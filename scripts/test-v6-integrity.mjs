import fs from "node:fs/promises";
import path from "node:path";
const ROOT=process.cwd(), errors=[];
const ok=(cond,msg)=>{if(!cond)errors.push(msg)};
const read=async p=>JSON.parse(await fs.readFile(path.join(ROOT,p),"utf8"));
const text=async p=>await fs.readFile(path.join(ROOT,p),"utf8");
const index=await text("index.html");
const inlineScripts=[...index.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(match=>match[1]);
ok(inlineScripts.length===2,`index must contain exactly 2 inline scripts (found ${inlineScripts.length})`);
inlineScripts.forEach((script,index)=>{
  try{ new Function(script); }
  catch(e){ errors.push(`index inline JavaScript ${index+1} syntax error: ${e.message}`); }
});
ok((index.match(/const STATE_KEY='uma_tracker_v4_state'/g)||[]).length===1,"STATE_KEY must exist exactly once");
ok(index.includes("serverProfiles.jp=normalizeServerProfile")&&index.includes("serverProfiles.kr=normalizeServerProfile"),"JP/KR saved profiles must remain separate");
ok(index.includes("cacheNeedsRefresh=!ids.has(30322)||!ids.has(30323)"),"old card caches must refresh for the new JP cards");
ok(index.includes("friend_manual_"),"friend_manual_ fallback missing");
ok(!index.includes("scenarioBase"),"obsolete scenarioBase must remain absent");
ok(index.includes("gametora.com/images/umamusume/skill_icons/utx_ico_skill_"),"GameTora fallback missing");
ok(index.includes("30305")&&index.includes("いつでも、毎秒、その時だ"),"Tazuna invariant missing");
ok(index.includes("./data/jp/system_status.json"),"system_status loader missing");
ok(index.includes("./data/jp/scenario_watch.json"),"scenario_watch loader missing");
ok(/<meta name="app-build" content="V7\.\d+(?:\.\d+)?">/.test(index),"V7.x app build marker missing");
ok(index.includes('id="dbLoadPanel"')&&index.includes('id="dbRetryBtn"'),"DB loading/retry UI missing");
const meta=await read("data/kr/server_meta.json");
ok(Number(meta.supportMaxId)===30260,"KR supportMaxId must stay 30260");
const jpSupports=await read("data/jp/current/supports.json");
const verifiedDetails=await read("data/jp/verified_support_details.json");
ok(index.includes("applyVerifiedSupportDetails(cards,skillMap)"),"verified JP card details must be applied during sync");
ok(index.includes("applyVerifiedSupportDetails(normalizeCachedCatalog"),"verified JP card details must be applied to saved data");
ok(index.includes("goshikiPerformanceGrid"),"Goshiki in-game performance icons are missing from the guide");
ok(Array.isArray(verifiedDetails.extraSkills)&&verifiedDetails.extraSkills.length>=7,"new JP skill metadata is incomplete");
for(const [id,name,type] of [[30322,"マヤノトップガン","power"],[30323,"吾妻","friend"]]){
  const card=jpSupports.find(item=>Number(item.id)===id);
  ok(Boolean(card)&&card.name.includes(name)&&card.type===type&&card.reviewStatus==="official_release_only",`JP support ${id} is missing or mislabeled`);
  ok(id>Number(meta.supportMaxId),`JP support ${id} must not appear in KR`);
  const detail=verifiedDetails.cards?.[String(id)];
  ok(Boolean(detail)&&Array.isArray(detail.supportEffects)&&detail.supportEffects.length>=10,`JP support ${id} effects are incomplete`);
  for(const effect of detail?.supportEffects||[])ok(effect.values?.length===5,`JP support ${id} ${effect.name} must have five limit break values`);
  ok(Array.isArray(detail?.rareEvents)&&detail.rareEvents.length>0,`JP support ${id} event choices are missing`);
  try{const image=await fs.readFile(path.join(ROOT,"assets","supports",`${id}.png`));ok(image.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),`JP support ${id} image is not PNG`)}
  catch{errors.push(`JP support ${id} image is missing`)}
}
ok(verifiedDetails.cards?.["30322"]?.rareEvents?.[0]?.choices?.length===6,"Mayano success and great-success choices are incomplete");
ok(verifiedDetails.cards?.["30323"]?.rareEvents?.[0]?.choices?.[0]?.skills?.some(skill=>skill.skillId===202551),"Azuma outing rare skill is missing");
ok(index.includes("20011,20012,20041,20042"),"new JP skill icon is not bundled");
const newSkillIcon=await fs.readFile(path.join(ROOT,"assets","skill-icons","20041.png"));
ok(newSkillIcon.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),"new JP skill icon is not PNG");
for(const id of [30256,30257])ok(index.includes(`${id}:`),`KR island support ${id} mapping missing`);
ok(Number(meta.implementedUmaCards)===212,"KR implementedUmaCards must stay 212");
const uma=await read("data/kr/uma_ids.json");
ok(Array.isArray(uma.ids)&&uma.ids.length===212,"KR uma allowlist count must stay 212");
for(const id of [103103,104003,113301])ok(!uma.ids.includes(id),`future KR uma id ${id} must remain excluded`);
const scenarios=await read("data/common/scenarios.json");
for(const key of ["goshiki","tresenken","dreams","onsen","island","legends","mecha","harvest","uaf","none"])ok(Boolean(scenarios.scenarios?.[key]),`scenario ${key} missing`);
ok(scenarios.scenarios?.goshiki?.servers?.join(",")==="jp","Goshiki must remain JP only");
ok(scenarios.scenarios?.goshiki?.performances?.length===5,"Goshiki needs all five in-game performance icons");
for(const performance of scenarios.scenarios?.goshiki?.performances||[]){
  ok(/^\.\/assets\/scenario\/goshiki\/utx_ico_festa_act_0[1-5]\.png$/.test(performance.icon),`invalid Goshiki icon path: ${performance.jp}`);
  try{const icon=await fs.readFile(path.join(ROOT,performance.icon));ok(icon.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),`Goshiki icon is not PNG: ${performance.jp}`)}
  catch{errors.push(`Goshiki icon file missing: ${performance.jp}`)}
}
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
ok(watch.knownScenarioKeys?.includes("goshiki"),"goshiki scenario watch key missing");
const inheritance=await read("data/jp/inheritance_recommendations.json");
const iconOverrides=await read("data/jp/skill_icon_overrides.json");
await read("data/jp/system_status.json");
ok(inheritance?.scope==="jp","JP inheritance recommendation scope invalid");
ok(Array.isArray(inheritance?.distance?.mid)&&inheritance.distance.mid.length>=8,"JP mid inheritance recommendations missing");
ok(Array.isArray(inheritance?.style?.senko)&&inheritance.style.senko.length>=5,"JP style inheritance recommendations missing");
for(const [skillId,iconId] of Object.entries({"204572":20011,"204702":20011,"204532":20011,"204701":20012,"204531":20012,"204571":20012,"204372":20011}))ok(Number(iconOverrides?.overrides?.[skillId]?.iconId)===Number(iconId),`E F Fouria icon override missing: ${skillId}`);
ok(Number(iconOverrides?.overrides?.["100301311"]?.iconId)===20042,"Tokai Teio evolution icon override missing");
await read("data/jp/change_report.json");
await read("data/jp/manifest.json");
await read("data/jp/source_health.json");
await read("data/jp/entity_summary.json");
await read("data/jp/change_impact.json");
await read("data/jp/automation_report.json");

ok(index.includes('id="v7InheritanceRecommend"'),"V7 inheritance recommendation UI missing");
ok(index.includes("function v7InheritancePlan"),"V7 inheritance recommendation logic missing");
ok(index.includes('id="v7Planner"'),"V7 planner UI missing");
ok(index.includes("function renderV7Planner"),"V7 planner renderer missing");
ok(index.includes("function v7RecommendedOwnedDeck"),"V7 owned deck recommender missing");
ok(index.includes("function applyV7RecommendedDeck"),"V7 apply deck action missing");
ok(index.includes("function v7DeckDeficits"),"V7 deficit analysis missing");
ok(index.includes("function v7SkillPlan"),"V7 skill priority engine missing");
if(errors.length){console.error("V7 integrity test FAILED");for(const e of errors)console.error("-",e);process.exit(1)}
console.log("V7 integrity test PASS");
