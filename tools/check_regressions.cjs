// Run with: node tools/check_regressions.cjs
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const html = fs.readFileSync("index.html", "utf8");
function section(start, end) {
  const a = html.indexOf(start), b = html.indexOf(end, a);
  assert(a >= 0 && b > a, `Missing source section: ${start}`);
  return html.slice(a, b);
}
const dates = section("const dateUTC =", "function pad(");

async function main() {
  const dateContext = vm.createContext({ Date });
  vm.runInContext(dates + "globalThis.check = {addDaysISO,daysBetweenISO};", dateContext);
  assert.equal(dateContext.check.addDaysISO("2026-01-01", -6), "2025-12-26");
  assert.equal(dateContext.check.addDaysISO("2026-03-08", 1), "2026-03-09");
  assert.equal(dateContext.check.daysBetweenISO("2026-04-26", "2026-04-01"), 25);

  let archiveCalls = 0;
  const forecast = {daily: {
    time: ["2026-01-01", "2026-01-02", "2026-01-03"],
    temperature_2m_max: [10, 10, 10], temperature_2m_min: [0, 0, 0]
  }};
  const january = vm.createContext({
    Date, BLOOM_GDD: 200, PEST: {base: 7.2},
    todayISO: () => "2026-01-03", fcURL: () => "forecast", arcDailyURL: () => "archive",
    fetchJSON: async url => { if (url === "archive") archiveCalls++; return forecast; },
    gddSeries: () => ({}), extendGdd72WithForecast: () => {}, applyPhenoOverride: () => {}
  });
  vm.runInContext(dates + section("async function loadRegion(", "let refreshSeq=0;") + "globalThis.loadRegion=loadRegion;", january);
  const rd = await january.loadRegion(0, false);
  assert.equal(archiveCalls, 0, "First week of January must not request an inverted archive range");
  assert.equal(rd.gddMap["2026-01-03"], 1.5);
  january.todayISO = () => "2026-01-20";
  await assert.rejects(january.loadRegion(0, false), /Forecast does not cover the current date/);

  let resolveChill, requestedRange;
  const elements = {};
  const chill = vm.createContext({
    Date, G: {loc: 0, today: "2026-11-15", chill: null}, refreshSeq: 1,
    monthOf: iso => Number(iso.slice(5, 7)),
    $: id => elements[id] ||= {innerHTML: ""},
    T: (zh, en) => chill.lang === "en" ? en : zh,
    lang: "zh", updateHero: () => {},
    arcHourlyURL: (start, end) => { requestedRange = [start, end]; return "hourly"; },
    fetchJSON: () => new Promise(resolve => { resolveChill = resolve; })
  });
  vm.runInContext(dates + section("let chillSeq=0;", "function renderF3(") + "globalThis.renderF2=renderF2;", chill);
  const pendingChill = chill.renderF2(false, 1, 0);
  assert.deepEqual(requestedRange, ["2026-11-01", "2026-11-14"]);
  chill.lang = "en";
  resolveChill({hourly: {time: ["2026-11-14T00:00"], temperature_2m: [3]}});
  await pendingChill;
  assert.match(elements["f2-body"].innerHTML, /This dormancy season: trees have banked/);
  assert.doesNotMatch(elements["f2-body"].innerHTML, /本休眠季/);

  const pending = new Map();
  const screen = {};
  const state = {loc: 0, dataLoc: 0, today: "2026-10-05", fc: {marker: 0}};
  const noop = () => {};
  const refresh = vm.createContext({
    Date, G: state, AUTO_MIN: 30, cdLeft: 0,
    $: id => screen[id] ||= {innerHTML: "", textContent: ""},
    T: zh => zh, todayISO: () => "2026-10-05", showToast: noop,
    loadRegion: idx => new Promise(resolve => pending.set(idx, resolve)),
    buildEvents: noop, renderF1: noop, renderF4: noop, renderF5: noop,
    renderPest: noop, renderF3: noop, renderCal: noop, updateHero: noop,
    renderF2: async () => {}, renderPlan: noop, renderFavBtn: noop,
    renderHourlyFrost: noop, renderRecordForms: noop, loadHourlyFrost: noop, renderObservationHistory: noop,
    refreshMyOrchards: noop
  });
  vm.runInContext(section("let refreshSeq=0;", "function updateHero(") + "globalThis.refreshAll=refreshAll;", refresh);
  const first = refresh.refreshAll(false);
  state.loc = 1;
  const second = refresh.refreshAll(false);
  const result = marker => ({idx: marker, fc: {marker}, idxToday: 0, today: "2026-10-05", staleAt: Infinity,
    gddMap: {}, gddMap72: {}, bloom: null, bloomRaw: null, pheno: null, gddOffset: 0});
  pending.get(1)(result(1));
  await second;
  pending.get(0)(result(0));
  await first;
  assert.equal(state.dataLoc, 1);
  assert.equal(state.fc.marker, 1, "A late response must not replace the selected region");

  const stale = refresh.refreshAll(false);
  pending.get(1)({...result(1), staleAt: Date.UTC(2026, 9, 4, 12)});
  await stale;
  assert.match(screen.fresh.textContent, /缓存数据 · 上次获取/);

  console.log("Date, January archive, stale data, English chill, and region race checks passed.");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
