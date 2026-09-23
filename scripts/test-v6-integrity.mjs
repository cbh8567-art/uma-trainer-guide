import fs from "node:fs/promises";
import path from "node:path";
const ROOT=process.cwd(), errors=[];
const ok=(cond,msg)=>{if(!cond)errors.push(msg)};
const read=async p=>JSON.parse(await fs.readFile(path.join(ROOT,p),"utf8"));
const text=async p=>await fs.readFile(path.join(ROOT,p),"utf8");
const index=await text("index.html");
const inlineMatch=index.match(/<script>([\s\S]*?)<\/script>/);
ok(Boolean(inlineMatch?.[1]),"inline app script missing");
if(inlineMatch?.[1]){
  try{ new Function(inlineMatch[1]); }
  catch(e){ errors.push("index inline JavaScript syntax error: "+e.message); }
}
ok((index.match(/const STATE_KEY='uma_tracker_v4_state'/g)||[]).length===1,"STATE_KEY must exist exactly once");
ok(index.includes("friend_manual_"),"friend_manual_ fallback missing");
ok(!index.includes("scenarioBase"),"obsolete scenarioBase must remain absent");
ok(index.includes("gametora.com/images/umamusume/skill_icons/utx_ico_skill_"),"GameTora fallback missing");
ok(index.includes("30305")&&index.includes("いつでも、毎秒、その時だ"),"Tazuna invariant missing");
ok(index.includes("./data/jp/system_status.json"),"system_status loader missing");
ok(index.includes("./data/jp/scenario_watch.json"),"scenario_watch loader missing");
ok(index.includes('<meta name="app-build" content="V7.0">'),"V7.0 app build marker missing");
const meta=await read("data/kr/server_meta.json");
ok(Number(meta.supportMaxId)===30260,"KR supportMaxId must stay 30260");
ok(Number(meta.implementedUmaCards)===212,"KR implementedUmaCards must stay 212");
const uma=await read("data/kr/uma_ids.json");
ok(Array.isArray(uma.ids)&&uma.ids.length===212,"KR uma allowlist count must stay 212");
for(const id of [103103,104003,113301])ok(!uma.ids.includes(id),`future KR uma id ${id} must remain excluded`);
const scenarios=await read("data/common/scenarios.json");
for(const key of ["tresenken","dreams","onsen","island","legends","mecha","harvest","uaf","none"])ok(Boolean(scenarios.scenarios?.[key]),`scenario ${key} missing`);
const src=await read("data/jp/source_config.json");
ok(src.snapshotReady===true,"JP snapshotReady must be true");
for(const key of ["catalog","supports","events","skills","characters","courses"])ok(Boolean(src.snapshotSources?.[key]),`snapshot source ${key} missing`);
const review=await read("data/jp/review_queue.json");
ok(Array.isArray(review.items),"review_queue invalid");
const candidates=await read("data/kr/import_candidates.json");
ok(Array.isArray(candidates.characters)&&Array.isArray(candidates.supports),"KR candidates invalid");
const watch=await read("data/jp/scenario_watch.json");
ok(watch.machineReadableSourceConfigured===false,"scenario source must not be falsely claimed configured");
ok(watch.status==="verification_required","scenario watch must remain verification_required");
await read("data/jp/system_status.json");
await read("data/jp/change_report.json");
await read("data/jp/manifest.json");
await read("data/jp/source_health.json");
await read("data/jp/entity_summary.json");
await read("data/jp/change_impact.json");
await read("data/jp/automation_report.json");
ok(index.includes('id="v7Planner"'),"V7 planner UI missing");
ok(index.includes("function renderV7Planner"),"V7 planner renderer missing");
ok(index.includes("function v7RecommendedOwnedDeck"),"V7 owned deck recommender missing");
ok(index.includes("function applyV7RecommendedDeck"),"V7 apply deck action missing");
ok(index.includes("function v7DeckDeficits"),"V7 deficit analysis missing");
ok(index.includes("function v7SkillPlan"),"V7 skill priority engine missing");
if(errors.length){console.error("V7 integrity test FAILED");for(const e of errors)console.error("-",e);process.exit(1)}
console.log("V7 integrity test PASS");
