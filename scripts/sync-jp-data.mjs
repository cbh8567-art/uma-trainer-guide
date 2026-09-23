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

function canonicalId(name, record, index) {
  if (name === "courses" && Array.isArray(record) && record.length === 2) {
    return String(record[0]);
  }
  const raw =
    record?.id ?? record?.SupportId ?? record?.supportId ?? record?.skillId ??
    record?.cardId ?? record?.characterId ?? record?.eventId;
  return raw == null || raw === "" ? `@index:${index}` : String(raw);
}

function stableStringify(value) {
  if (value == null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  return `{${Object.keys(value).sort().map(
    k => `${JSON.stringify(k)}:${stableStringify(value[k])}`
  ).join(",")}}`;
}

function diffRecords(name, previousRecords, nextRecords) {
  const toMap = (records) => new Map(
    records.map((record, index) => [canonicalId(name, record, index), record])
  );
  const before = toMap(previousRecords);
  const after = toMap(nextRecords);
  const added = [];
  const removed = [];
  const modified = [];

  for (const [id, record] of after) {
    if (!before.has(id)) {
      added.push(id);
      continue;
    }
    if (stableStringify(before.get(id)) !== stableStringify(record)) {
      modified.push(id);
    }
  }
  for (const id of before.keys()) {
    if (!after.has(id)) removed.push(id);
  }

  const limit = 30;
  return {
    addedCount: added.length,
    removedCount: removed.length,
    modifiedCount: modified.length,
    addedIds: added.slice(0, limit),
    removedIds: removed.slice(0, limit),
    modifiedIds: modified.slice(0, limit)
  };
}


function recordLabel(name, record, id = "") {
  if (name === "courses" && Array.isArray(record) && record.length === 2) {
    const value = record[1] || {};
    return String(value.name || value.label || value.raceName || id);
  }
  const candidates = [
    record?.name,
    record?.Name,
    record?.SupportNameJP,
    record?.SupportName,
    record?.title,
    record?.characterName,
    record?.skillName,
    record?.label,
    record?.supportNameMatch,
    record?.jpName
  ];
  const label = candidates.find(v => typeof v === "string" && v.trim());
  return label ? label.trim() : String(id);
}

function detailChanges(name, previousRecords, nextRecords, diff) {
  const mapRecords = (records) => new Map(
    records.map((record, index) => [canonicalId(name, record, index), record])
  );
  const before = mapRecords(previousRecords);
  const after = mapRecords(nextRecords);
  const limit = 30;
  return {
    added: diff.addedIds.slice(0, limit).map(id => ({
      id,
      name: recordLabel(name, after.get(id), id)
    })),
    removed: diff.removedIds.slice(0, limit).map(id => ({
      id,
      name: recordLabel(name, before.get(id), id)
    })),
    modified: diff.modifiedIds.slice(0, limit).map(id => ({
      id,
      name: recordLabel(name, after.get(id) || before.get(id), id)
    }))
  };
}

function collectSkillReferencesFromEvents(eventsData) {
  const ids = [];
  for (const event of eventsData?.events || []) {
    const groups = Array.isArray(event?.choices)
      ? event.choices.map(choice => choice?.skills || [])
      : [event?.skills || []];
    for (const group of groups) {
      for (const skill of group) {
        const id = Number(skill?.skillId);
        if (Number.isFinite(id)) ids.push(id);
      }
    }
  }
  return ids;
}

function collectSupportHintSkillReferences(supportsData) {
  const ids = [];
  for (const support of Array.isArray(supportsData) ? supportsData : []) {
    for (const id of support?.hintSkillIds || []) {
      const n = Number(id);
      if (Number.isFinite(n)) ids.push(n);
    }
  }
  return ids;
}

function snapshotFilename(name) {
  return name === "catalog" ? "support_hints.json" : `${name}.json`;
}

async function fetchText(url) {
  const started = Date.now();
  const res = await fetch(url, {
    headers: { "user-agent": "uma-trainer-guide-sync/1.0" }
  });
  const durationMs = Date.now() - started;
  if (!res.ok) {
    const error = new Error(`${url}: HTTP ${res.status}`);
    error.httpStatus = res.status;
    error.durationMs = durationMs;
    throw error;
  }
  return {
    text: await res.text(),
    httpStatus: res.status,
    durationMs,
    contentType: res.headers.get("content-type") || ""
  };
}

const sourceConfigPath = path.join(JP, "source_config.json");
const policyPath = path.join(JP, "sync_policy.json");
const statePath = path.join(JP, "sync_state.json");
const reportPath = path.join(JP, "validation_report.json");
const updateMetaPath = path.join(JP, "update_meta.json");
const historyPath = path.join(JP, "sync_history.json");
const changeReportPath = path.join(JP, "change_report.json");
const manifestPath = path.join(JP, "manifest.json");
const sourceHealthPath = path.join(JP, "source_health.json");

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

const sourceHealth = {
  schemaVersion: 1,
  updated: report.updated,
  checkedAt: report.checkedAt,
  status: "running",
  sources: {}
};

const changeReport = {
  schemaVersion: 1,
  updated: report.updated,
  checkedAt: report.checkedAt,
  status: "running",
  summary: { added: 0, removed: 0, modified: 0 },
  collections: {}
};

const manifest = {
  schemaVersion: 1,
  updated: report.updated,
  generatedAt: report.checkedAt,
  collections: {}
};

async function appendHistory(status, message) {
  const history = await readJson(historyPath).catch(() => ({
    schemaVersion: 1,
    updated: report.updated,
    limit: 20,
    runs: []
  }));
  const limit = Math.max(1, Number(history.limit || 20));
  const collections = {};
  for (const [name, entry] of Object.entries(report.collections || {})) {
    collections[name] = {
      count: Number(entry.count || 0),
      previousCount: entry.previousCount ?? null,
      removedCount: Number(entry.removedCount || 0),
      changed: Boolean(entry.changed),
      status: entry.status || "unknown",
      changes: entry.changes || {
        addedCount: 0,
        removedCount: 0,
        modifiedCount: 0,
        addedIds: [],
        removedIds: [],
        modifiedIds: []
      }
    };
  }
  history.schemaVersion = 1;
  history.updated = report.updated;
  history.limit = limit;
  history.runs = [{
    checkedAt: report.checkedAt,
    status,
    activeMode: status === "pass" ? "snapshot" : (sourceConfig.snapshotReady ? "snapshot" : "remote"),
    message,
    collections
  }, ...(Array.isArray(history.runs) ? history.runs : [])].slice(0, limit);
  await writeJson(historyPath, history);
}

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
      const fetched = await fetchText(url);
      raw = fetched.text;
      data = JSON.parse(raw);
      sourceHealth.sources[name] = {
        url,
        ok: true,
        httpStatus: fetched.httpStatus,
        durationMs: fetched.durationMs,
        contentType: fetched.contentType
      };
    } catch (e) {
      sourceHealth.sources[name] = {
        url,
        ok: false,
        httpStatus: Number(e?.httpStatus || 0) || null,
        durationMs: Number(e?.durationMs || 0) || null,
        error: e?.message || String(e)
      };
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
      const previousRecords = extractRecords(name, previousData);
      const previousCount = previousRecords.length;
      const removed = Math.max(0, previousCount - records.length);
      const ratio = previousCount ? removed / previousCount : 0;
      entry.previousCount = previousCount;
      entry.removedCount = removed;
      entry.removedRatio = ratio;
      entry.changes = diffRecords(name, previousRecords, records);
      entry.changeDetails = detailChanges(name, previousRecords, records, entry.changes);
      entry.changed =
        entry.changes.addedCount > 0 ||
        entry.changes.removedCount > 0 ||
        entry.changes.modifiedCount > 0;

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
      entry.changes = {
        addedCount: records.length,
        removedCount: 0,
        modifiedCount: 0,
        addedIds: records.slice(0, 30).map((r, i) => canonicalId(name, r, i)),
        removedIds: [],
        modifiedIds: []
      };
      entry.changeDetails = {
        added: records.slice(0, 30).map((r, i) => {
          const id = canonicalId(name, r, i);
          return { id, name: recordLabel(name, r, id) };
        }),
        removed: [],
        modified: []
      };
      entry.changed = true;
    }

    report.collections[name] = entry;
    manifest.collections[name] = {
      source: url,
      count: entry.count,
      contentSha256: entry.contentSha256,
      status: entry.status
    };
    changeReport.collections[name] = {
      count: entry.count,
      previousCount: entry.previousCount ?? null,
      changed: Boolean(entry.changed),
      status: entry.status,
      changes: entry.changes || {
        addedCount: 0,
        removedCount: 0,
        modifiedCount: 0,
        addedIds: [],
        removedIds: [],
        modifiedIds: []
      },
      details: entry.changeDetails || { added: [], removed: [], modified: [] }
    };
    staged.set(name, { raw, data });
  }

  const stagedSkills = staged.get("skills")?.data;
  if (Array.isArray(stagedSkills)) {
    const skillIds = new Set(stagedSkills.map(s => Number(s?.id)).filter(Number.isFinite));
    const missingEventSkills = [...new Set(
      collectSkillReferencesFromEvents(staged.get("events")?.data)
        .filter(id => !skillIds.has(id))
    )];
    const missingSupportHints = [...new Set(
      collectSupportHintSkillReferences(staged.get("supports")?.data)
        .filter(id => !skillIds.has(id))
    )];

    if (missingEventSkills.length) {
      report.warnings.push(
        `events: missing skill references (${missingEventSkills.slice(0, 20).join(", ")})`
      );
    }
    if (missingSupportHints.length) {
      report.warnings.push(
        `supports: missing hint skill references (${missingSupportHints.slice(0, 20).join(", ")})`
      );
    }
    report.referenceAudit = {
      missingEventSkillCount: missingEventSkills.length,
      missingEventSkillIds: missingEventSkills.slice(0, 50),
      missingSupportHintSkillCount: missingSupportHints.length,
      missingSupportHintSkillIds: missingSupportHints.slice(0, 50)
    };
  }

  changeReport.summary = Object.values(changeReport.collections).reduce((acc, entry) => {
    const c = entry.changes || {};
    acc.added += Number(c.addedCount || 0);
    acc.removed += Number(c.removedCount || 0);
    acc.modified += Number(c.modifiedCount || 0);
    return acc;
  }, { added: 0, removed: 0, modified: 0 });

  sourceHealth.status = Object.values(sourceHealth.sources).every(s => s.ok) ? "pass" : "fatal";

  if (report.fatal.length) {
    report.status = "fatal";
    state.status = "fatal";
    state.snapshotReady = Boolean(sourceConfig.snapshotReady);
    state.activeMode = sourceConfig.snapshotReady ? "snapshot" : "remote";
    state.message = "Validation failed. Existing current snapshots were kept.";
    changeReport.status = "fatal";
    await writeJson(reportPath, report);
    await writeJson(statePath, state);
    await writeJson(changeReportPath, changeReport);
    await writeJson(manifestPath, manifest);
    await writeJson(sourceHealthPath, sourceHealth);
    await appendHistory("fatal", state.message);
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
    report.changeTotals = Object.values(report.collections).reduce((acc, entry) => {
      const c = entry.changes || {};
      acc.added += Number(c.addedCount || 0);
      acc.removed += Number(c.removedCount || 0);
      acc.modified += Number(c.modifiedCount || 0);
      return acc;
    }, { added: 0, removed: 0, modified: 0 });
    state.status = "pass";
    state.snapshotReady = true;
    state.lastSuccessfulSync = report.checkedAt;
    state.activeMode = "snapshot";
    state.changeTotals = report.changeTotals;
    state.message = "Validated snapshots promoted atomically.";
    changeReport.status = "pass";
    await writeJson(reportPath, report);
    await writeJson(statePath, state);
    await writeJson(changeReportPath, changeReport);
    await writeJson(manifestPath, manifest);
    await writeJson(sourceHealthPath, sourceHealth);
    await appendHistory("pass", state.message);
  }
} catch (e) {
  report.status = "fatal";
  report.fatal.push(`sync runtime: ${e?.stack || e}`);
  state.status = "fatal";
  state.message = "Sync runtime failed. Existing snapshots were kept.";
  changeReport.status = "fatal";
  sourceHealth.status = "fatal";
  await writeJson(reportPath, report).catch(() => {});
  await writeJson(statePath, state).catch(() => {});
  await writeJson(changeReportPath, changeReport).catch(() => {});
  await writeJson(manifestPath, manifest).catch(() => {});
  await writeJson(sourceHealthPath, sourceHealth).catch(() => {});
  await appendHistory("fatal", state.message).catch(() => {});
  process.exitCode = 2;
}
