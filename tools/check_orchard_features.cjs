// Run from the repository root: node tools/check_orchard_features.cjs
const assert=require('node:assert/strict'), fs=require('node:fs'), vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8');
function section(a,b){const start=html.indexOf(a),end=html.indexOf(b,start);assert(start>=0&&end>start);return html.slice(start,end);}
const inputs={}, stored=new Map(), notices=[];
const ctx=vm.createContext({Date, Map, Number, JSON, G:{loc:0,dataLoc:0,today:'2026-10-08',fc:null},
  todayISO:()=> '2026-10-08', monthOf:date=>Number(date.slice(5,7)), KC_MONTHS:Array(13).fill(1),
  $:id=>inputs[id]??={value:'',innerHTML:'',textContent:'',focus(){}}, T:(zh,en)=>ctx.lang==='en'?en:zh,
  showToast:message=>notices.push(message),localStorage:{getItem:k=>stored.get(k)??null,setItem:(k,v)=>stored.set(k,v)},
  renderMyData(){},renderF5(){},locName:()=> 'Test',varieties:()=>[['Peach',null,60]],vName:v=>v[0],effStageOf:()=>({t10:-2,t90:-5}),
  refreshSeq:1,fetchJSON:async()=>({}),hourlyFrostURL:()=>'',stName:()=> 'Bloom',loc:()=>['',0,0,'','Asia/Shanghai'],lang:'zh'
});
vm.runInContext(section('const dateUTC =','function pad(')+section('/* ---------- 实测记录：','/* ---------- 我的园子：')+
  'globalThis.api={validOrchardData,orchardRecords,saveObservation,saveWaterRecord,waterBalance,frostHourRows,loadHourlyFrost,renderHourlyFrost,deleteOrchardRecord};',ctx);
inputs['obs-date']={value:'2026-10-07'};inputs['obs-temp']={value:'0'};inputs['obs-rain']={value:'0'};inputs['obs-harvest']={value:''};
ctx.api.saveObservation();assert.equal(ctx.api.orchardRecords()['2026-10-07'].rain,0);assert.equal(ctx.api.orchardRecords()['2026-10-07'].minTemp,0);
inputs['obs-temp'].value='-1.2';ctx.api.saveObservation();assert.equal(Object.keys(ctx.api.orchardRecords()).length,1);assert.equal(ctx.api.orchardRecords()['2026-10-07'].minTemp,-1.2);
ctx.G.loc=1;assert.equal(Object.keys(ctx.api.orchardRecords()).length,0);ctx.G.loc=0;
inputs['water-date']={value:'2026-10-07'};inputs['water-mm']={value:'30'};inputs['water-soil']={value:'moist'};
ctx.api.saveWaterRecord();inputs['water-mm'].value='20';ctx.api.saveWaterRecord();assert.equal(ctx.api.orchardRecords()['2026-10-07'].irrigation,20);
assert.equal(ctx.api.orchardRecords()['2026-10-07'].rain,0,'Water form must preserve observations');
const water=ctx.api.waterBalance({loc:0,today:'2026-10-08',fc:{daily:{time:['2026-09-08','2026-10-07','2026-10-08'],precipitation_sum:[100,8,2],et0_fao_evapotranspiration:[10,3,3]}}});
assert.equal(water.rain,2,'Measured zero rain replaces model rain');assert.equal(water.irrigation,20);assert.equal(water.use,6);assert.equal(water.measuredDays,1);
const raw=stored.get('orchardRecords:v1:0');assert(ctx.api.validOrchardData(raw));assert(!ctx.api.validOrchardData('{"ver":1,"days":{"2026-02-30":{}}}'));assert(!ctx.api.validOrchardData('{"ver":1,"days":{"2026-10-07":{"rain":-1}}}'));
const before=raw;inputs['obs-date'].value='2026-10-09';ctx.api.saveObservation();assert.equal(stored.get('orchardRecords:v1:0'),before,'Future record must be rejected');
inputs['obs-date'].value='2026-10-07';inputs['obs-temp'].value='';ctx.api.saveObservation();assert.equal(ctx.api.orchardRecords()['2026-10-07'].minTemp,undefined,'Blank clears a measurement');
const now=Date.UTC(2026,2,8,6),t=now/1000;
const fc={hourly:{time:[t-3600,t,t+3600,t+7200,t+72*3600],temperature_2m:[-9,-3,null,-6,-9],wind_speed_10m:[1,2,3,4,5],precipitation:[0,0,0,1,0]}};
const en={hourly:{time:[t+7200,t],temperature_2m:[-7,-1],temperature_2m_member01:[-6,-4],temperature_2m_member02:[null,null]}};
const rows=ctx.api.frostHourRows(fc,en,{t10:-2,t90:-5},now);
assert.equal(rows.length,2);assert.equal(rows[0].probability,50,'Ensemble values must align by timestamp, excluding null');assert.equal(rows[0].level,'risk');assert.equal(rows[1].level,'severe');assert.equal(rows[1].probability,100);
assert.equal(ctx.api.frostHourRows(fc,null,{t10:-2,t90:-5},now)[0].probability,null);assert.equal(ctx.api.frostHourRows(fc,en,{t10:-2,t90:-5},now+80*3600000).length,0);
ctx.Date=class extends Date{static now(){return now;}};
ctx.G.fc={};ctx.G.today='2026-03-08';ctx.G.frostHourly=fc;ctx.G.frostEnsemble=en;ctx.G.frostHourlyStatus='ready';ctx.lang='en';ctx.api.renderHourlyFrost();assert.doesNotMatch(inputs['frost-hourly-body'].innerHTML,/[\u4e00-\u9fff]/);assert.match(inputs['frost-hourly-title'].textContent,/cold risk/);assert.match(inputs['frost-hourly-body'].innerHTML,/hour-severe/);
async function asyncChecks(){
  const pending=[];ctx.G.loc=0;ctx.fetchJSON=()=>new Promise(r=>pending.push(r));const late=ctx.api.loadHourlyFrost(false,1,0);ctx.G.loc=1;pending[0](fc);pending[1](en);await late;assert.equal(ctx.G.frostHourly,fc,'Late region response must not write state');
  ctx.G.loc=0;ctx.fetchJSON=url=>url==='bad'?Promise.reject(new Error('offline')):Promise.resolve(fc);ctx.hourlyFrostURL=(idx,ensemble)=>ensemble?'bad':'good';await ctx.api.loadHourlyFrost(false,1,0);assert.equal(ctx.G.frostHourlyStatus,'ready');assert.equal(ctx.G.frostEnsemble,null);
  ctx.fetchJSON=()=>Promise.reject(new Error('offline'));await ctx.api.loadHourlyFrost(false,1,0);assert.equal(ctx.G.frostHourlyStatus,'unavailable');assert.match(inputs['frost-hourly-body'].innerHTML,/reconnect and refresh/);
  ctx.G.loc=0;ctx.api.deleteOrchardRecord('2026-10-07');assert.equal(Object.keys(ctx.api.orchardRecords()).length,0);
  console.log('Observation editing, zero rainfall, regional storage, water balance, backup validation, hourly frost and stale-response checks passed.');
}
asyncChecks().catch(e=>{console.error(e);process.exitCode=1;});
