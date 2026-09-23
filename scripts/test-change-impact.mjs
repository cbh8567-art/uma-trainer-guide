import fs from "node:fs/promises";
import { execFileSync } from "node:child_process";

const outPath = "data/jp/change_impact.json";
const sha = process.env.GITHUB_SHA || "";
const event = process.env.GITHUB_EVENT_NAME || "local";
let files = [];
try {
  files = execFileSync("git", ["diff", "--name-only", "HEAD^", "HEAD"], { encoding: "utf8" })
    .split(/\r?\n/).map(s => s.trim()).filter(Boolean);
} catch { files = []; }

const categories = {
  app: files.filter(f => f === "index.html"),
  pipeline: files.filter(f => f.startsWith("scripts/") || f === ".github/workflows/sync-jp-data.yml"),
  jpData: files.filter(f => f.startsWith("data/jp/")),
  krData: files.filter(f => f.startsWith("data/kr/")),
  commonData: files.filter(f => f.startsWith("data/common/")),
  other: files.filter(f => !(f === "index.html" || f.startsWith("scripts/") ||
    f === ".github/workflows/sync-jp-data.yml" || f.startsWith("data/jp/") ||
    f.startsWith("data/kr/") || f.startsWith("data/common/")))
};

const fullTest = categories.app.length > 0 || categories.pipeline.length > 0 ||
  categories.krData.length > 0 || categories.commonData.length > 0;
const deploySmoke = categories.app.length > 0;
const level = categories.pipeline.length || categories.app.length ? "high"
  : (categories.krData.length || categories.commonData.length ? "medium" : "low");

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  event, sha, changedFiles: files, categories,
  impactLevel: level, fullTest, deploySmoke
};

await fs.mkdir("data/jp", { recursive: true });
await fs.writeFile(outPath, JSON.stringify(report, null, 2) + "\n", "utf8");
if (process.env.GITHUB_OUTPUT) {
  await fs.appendFile(process.env.GITHUB_OUTPUT,
    `impact_level=${level}\nfull_test=${fullTest}\ndeploy_smoke=${deploySmoke}\nchanged_count=${files.length}\n`);
}
console.log(`Change impact: ${level} · files ${files.length} · fullTest=${fullTest} · deploySmoke=${deploySmoke}`);
