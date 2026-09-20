/* Pages Function：GET /api/stats
 * 返回过去 30 天每日访问量（仅聚合数字），数据来自 Cloudflare Web Analytics
 * （无 Cookie、无个人身份信息，隐私友好）。密钥只存在服务端环境变量里，不下发前端。
 *
 * 需在 Cloudflare Pages 项目 → Settings → Environment variables 配置：
 *   ANALYTICS_ACCOUNT_TAG  账户 tag（dash.cloudflare.com URL 里 32 位 hex）
 *   ANALYTICS_TOKEN        具有「Account Analytics:Read」权限的 API Token
 *   ANALYTICS_SITE_TAG     Web Analytics 站点 tag（可选，不填则汇总全账户站点）
 *
 * 未配置时返回 503 {ok:false, reason:"not-configured"}，前端据此显示「暂未开启」。
 */
const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "public, max-age=600" /* 聚合数字，10 分钟缓存足够新鲜 */
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: JSON_HEADERS });
}

export async function onRequestGet(context) {
  const env = context.env;
  const ACCOUNT = env.ANALYTICS_ACCOUNT_TAG;
  const TOKEN = env.ANALYTICS_TOKEN;
  const SITE = env.ANALYTICS_SITE_TAG;
  if (!ACCOUNT || !TOKEN) {
    return json({ ok: false, reason: "not-configured" }, 503);
  }

  const until = new Date();
  const since = new Date(until.getTime() - 30 * 86400000);

  /* 站点 tag 可选：没配就不加 siteTag 过滤（GraphQL 不接受空字符串过滤值） */
  const siteFilter = SITE ? "siteTag: $siteTag, " : "";
  const query = `
    query($accountTag: string!, $siteTag: string, $since: Time!, $until: Time!) {
      viewer {
        accounts(filter: { accountTag: $accountTag }) {
          webAnalyticsRequestsAdaptiveGroups(
            limit: 31
            filter: { ${siteFilter}datetime_geq: $since, datetime_lt: $until }
            orderBy: [datetimeDay_ASC]
          ) {
            dimensions { datetimeDay }
            sum { requests pageViews }
          }
        }
      }
    }`;

  const variables = { accountTag: ACCOUNT, since: since.toISOString(), until: until.toISOString() };
  if (SITE) variables.siteTag = SITE;

  let resp;
  try {
    resp = await fetch("https://api.cloudflare.com/client/v4/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + TOKEN },
      body: JSON.stringify({ query, variables })
    });
  } catch (e) {
    return json({ ok: false, reason: "upstream-unreachable" }, 502);
  }
  if (!resp.ok) {
    return json({ ok: false, reason: "upstream-http-" + resp.status }, 502);
  }

  let payload;
  try { payload = await resp.json(); } catch (e) { return json({ ok: false, reason: "upstream-bad-json" }, 502); }
  if (payload.errors && payload.errors.length) {
    return json({ ok: false, reason: "graphql: " + payload.errors[0].message }, 502);
  }

  const groups = (((payload.data || {}).viewer || {}).accounts || [[], {}])[0] || [];
  const days = groups.map(g => ({
    date: String((g.dimensions || {}).datetimeDay || "").slice(0, 10),
    pv: ((g.sum || {}).pageViews ?? 0) + 0,
    req: ((g.sum || {}).requests ?? 0) + 0
  })).filter(d => d.date);

  const total30 = days.reduce((s, d) => s + d.pv, 0);
  return json({ ok: true, days, total30, until: until.toISOString().slice(0, 10) });
}
