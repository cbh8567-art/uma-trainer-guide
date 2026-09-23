import fs from "node:fs/promises";
const read = async (p, fallback = null) => {
  try { return JSON.parse(await fs.readFile(p, "utf8")); } catch { return fallback; }
};
const state = await read("data/jp/sync_state.json", {});
const validation = await read("data/jp/validation_report.json", {});
const health = await read("data/jp/source_health.json", {});
const impact = await read("data/jp/change_impact.json", {});
const syncExitCode = Number(process.env.SYNC_EXIT_CODE || 0);
const integrityOutcome = process.env.INTEGRITY_OUTCOME || "skipped";
const deployOutcome = process.env.DEPLOY_OUTCOME || "skipped";
const deployStatus = process.env.DEPLOY_STATUS || deployOutcome;
const failedSources = Object.entries(health.sources || {})
  .filter(([,v]) => !v?.ok)
  .map(([name,v]) => ({ name, error: v?.error || `HTTP ${v?.httpStatus || "unknown"}` }));

const failures = [];
if (syncExitCode !== 0) failures.push(`JP sync exit code ${syncExitCode}`);
if (integrityOutcome === "failure") failures.push("Integrity test failed");
if (deployOutcome === "failure") failures.push("Production deployment smoke test failed");
const automationWarnings = [];
if (deployStatus === "rate_limited") automationWarnings.push("Vercel deployment rate limited; GitHub integrity validation passed but production deployment was not refreshed.");
for (const item of validation.fatal || []) failures.push(String(item));
for (const s of failedSources) failures.push(`Source ${s.name}: ${s.error}`);

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  status: failures.length ? "failure" : "pass",
  gitSha: process.env.GITHUB_SHA || "",
  event: process.env.GITHUB_EVENT_NAME || "local",
  sync: { exitCode: syncExitCode, status: state.status || "unknown" },
  tests: { integrity: integrityOutcome, deploySmoke: deployStatus },
  impact: {
    level: impact.impactLevel || "unknown",
    changedCount: Array.isArray(impact.changedFiles) ? impact.changedFiles.length : 0,
    fullTest: Boolean(impact.fullTest),
    deploySmoke: Boolean(impact.deploySmoke)
  },
  sourceHealth: health.status || "unknown",
  failures,
  warnings: [...(validation.warnings || []), ...automationWarnings],
  failedSources
};
await fs.mkdir("data/jp", { recursive: true });
await fs.writeFile("data/jp/automation_report.json", JSON.stringify(report, null, 2) + "\n", "utf8");
console.log(`Automation report: ${report.status}`);
if (failures.length) failures.forEach(x => console.error("-", x));
