import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = process.cwd();
const JP = path.join(ROOT, "data", "jp");
const CURRENT = path.join(JP, "current");

const readJson = async (p) => JSON.parse(await fs.readFile(p, "utf8"));
const writeJson = async (p, v) => {
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, JSON.stringify(v, null, 2) + "\n", "utf8");
};
const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");
const now = () => new Date().toISOString();

function extractRecords(name, data) {
  if (name === "catalog") {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.supports)) return data.supports;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  }
  if (name === "supports" || name === "skills" || name === "characters") {
    return Array.isArray(data) ? data : [];
  }
  if (name === "events") return Array.isArray(data?.events) ? data.events : [];
  if (name === "courses") {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.courses)) return data.courses;
    if (data && typeof data === "object") return Object.entries(data);
    return [];
  }
  return [];
}

function duplicateIds(name, records) {
  if (name === "courses") return [];
  const seen = new Set(), dup = new Set();
  for (const r of records) {
    const raw =
      r?.id ?? r?.SupportId ?? r?.supportId ?? r?.skillId ??
      r?.cardId ?? r?.characterId ?? r?.eventId;
    if (raw == null || raw === "") continue;
    const id = String(raw);
    if (seen.has(id)) dup.add(id);
    else seen.add(id);
  }
  return [...dup];
}

function snapshotFilename(name) {
  return name === "catalog" ? "support_hints.json" : `${name}.json`;
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { "user-agent": "uma-trainer-guide-sync/1.0" }
  });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return await res.text();
}

const sourceConfigPath = path.join(JP, "source_config.json");
const policyPath = path.join(JP, "sync_policy.json");
const statePath = path.join(JP, "sync_state.json");
const reportPath = path.join(JP, "validation_report.json");
const updateMetaPath = path.join(JP, "update_meta.json");

const sourceConfig = await readJson(sourceConfigPath);
const policy = await readJson(policyPath);

const report = {
  schemaVersion: 1,
  updated: new Date().toISOString().slice(0, 10),
  status: "running",
  checkedAt: now(),
  fatal: [],
  warnings: [],
  collections: {}
};

const state = {
  schemaVersion: 1,
  updated: report.updated,
  status: "running",
  snapshotReady: Boolean(sourceConfig.snapshotReady),
  lastSuccessfulSync: null,
  lastAttempt: report.checkedAt,
  activeMode: sourceConfig.snapshotReady ? "snapshot" : "remote",
  message: ""
};

try {
  const oldState = await readJson(statePath).catch(() => null);
  if (oldState?.lastSuccessfulSync) state.lastSuccessfulSync = oldState.lastSuccessfulSync;

  const staged = new Map();

  for (const name of policy.requiredCollections) {
    const url = sourceConfig.sources?.[name];
    if (!url) {
      report.fatal.push(`${name}: source URL missing`);
      continue;
    }

    let raw, data;
    try {
      raw = await fetchText(url);
      data = JSON.parse(raw);
    } catch (e) {
      report.fatal.push(`${name}: ${e.message}`);
      continue;
    }

    const records = extractRecords(name, data);
    const min = Number(policy.minimumRecords?.[name] ?? 1);
    const dups = duplicateIds(name, records);

    const entry = {
      source: url,
      count: records.length,
      contentSha256: sha256(raw),
      duplicateIds: dups.slice(0, 50),
      status: "pass"
    };

    if (records.length < min) {
      entry.status = "fatal";
      report.fatal.push(`${name}: record count ${records.length} < minimum ${min}`);
    }
    if (dups.length) {
      entry.status = "fatal";
      report.fatal.push(`${name}: duplicate canonical IDs (${dups.slice(0, 10).join(", ")})`);
    }

    const currentPath = path.join(CURRENT, snapshotFilename(name));
    try {
      const previousRaw = await fs.readFile(currentPath, "utf8");
      const previousData = JSON.parse(previousRaw);
      const previousCount = extractRecords(name, previousData).length;
      const removed = Math.max(0, previousCount - records.length);
      const ratio = previousCount ? removed / previousCount : 0;
      entry.previousCount = previousCount;
      entry.removedCount = removed;
      entry.removedRatio = ratio;

      const limitCount = Number(policy.massDeletion?.removedCountGte ?? 10);
      const limitRatio = Number(policy.massDeletion?.removedRatioGte ?? 0.02);
      if (removed >= limitCount || ratio >= limitRatio) {
        entry.status = "fatal";
        report.fatal.push(
          `${name}: mass deletion guard (${removed}/${previousCount}, ${(ratio * 100).toFixed(2)}%)`
        );
      }
    } catch {
      entry.previousCount = null;
      entry.removedCount = 0;
      entry.removedRatio = 0;
    }

    report.collections[name] = entry;
    staged.set(name, { raw, data });
  }

  if (report.fatal.length) {
    report.status = "fatal";
    state.status = "fatal";
    state.snapshotReady = Boolean(sourceConfig.snapshotReady);
    state.activeMode = sourceConfig.snapshotReady ? "snapshot" : "remote";
    state.message = "Validation failed. Existing current snapshots were kept.";
    await writeJson(reportPath, report);
    await writeJson(statePath, state);
    process.exitCode = 2;
  } else {
    await fs.mkdir(CURRENT, { recursive: true });
    for (const [name, item] of staged) {
      await fs.writeFile(
        path.join(CURRENT, snapshotFilename(name)),
        JSON.stringify(item.data, null, 2) + "\n",
        "utf8"
      );
    }

    sourceConfig.snapshotReady = true;
    sourceConfig.updated = report.updated;
    await writeJson(sourceConfigPath, sourceConfig);

    const updateMeta = await readJson(updateMetaPath).catch(() => ({
      schemaVersion: 1,
      collections: {}
    }));
    updateMeta.updated = report.updated;
    updateMeta.lastSuccessfulSync = report.checkedAt;
    updateMeta.collections ??= {};
    for (const [name, entry] of Object.entries(report.collections)) {
      updateMeta.collections[name] = {
        ...(updateMeta.collections[name] || {}),
        source: entry.source,
        status: "auto",
        fetchedAt: report.checkedAt,
        recordCount: entry.count,
        contentSha256: entry.contentSha256
      };
    }
    await writeJson(updateMetaPath, updateMeta);

    report.status = "pass";
    state.status = "pass";
    state.snapshotReady = true;
    state.lastSuccessfulSync = report.checkedAt;
    state.activeMode = "snapshot";
    state.message = "Validated snapshots promoted atomically.";
    await writeJson(reportPath, report);
    await writeJson(statePath, state);
  }
} catch (e) {
  report.status = "fatal";
  report.fatal.push(`sync runtime: ${e?.stack || e}`);
  state.status = "fatal";
  state.message = "Sync runtime failed. Existing snapshots were kept.";
  await writeJson(reportPath, report).catch(() => {});
  await writeJson(statePath, state).catch(() => {});
  process.exitCode = 2;
}
