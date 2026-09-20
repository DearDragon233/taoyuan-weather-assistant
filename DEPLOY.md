# 部署包快速索引

- `index.html` — 网站本体（与线上 taoyuan-weather.pages.dev 同步）
- `manifest.webmanifest` — PWA 清单（应用名称、图标、主题色，「添加到主屏幕」用）
- `sw.js` — Service Worker（PWA 离线兜底；预缓存页面外壳，气象 API 请求不拦截）
- `icons/` — PWA 图标（icon-192.png / icon-512.png / icon-512-maskable.png）
- `functions/api/stats.js` — Pages Function：访问统计接口（读取 Cloudflare Web Analytics 聚合数字）
- `README.md` — 项目说明（GitHub 仓库主页用）
- `LICENSE` — MIT 协议
- `docs/index.html` — GitHub Pages 跳转页（指向正式地址）

## GitHub 仓库地址

https://github.com/DearDragon233/taoyuan-weather-assistant

## 更新流程

改完 index.html 后三步：

```bash
cd 桃园农事助手-部署包
git add index.html && git commit -m "update"
git push
```

Cloudflare Pages 已连接该仓库时推送即自动上线；若用直接上传模式，再手动拖一次 index.html 即可。

### PWA 相关注意

- 部署包现在还包含 `sw.js`、`manifest.webmanifest` 和 `icons/`，Cloudflare Pages 连仓库部署时会一并上线，无需任何额外配置；用直接上传模式时把这几个文件和 icons 文件夹一起拖上去。
- 改版 index.html 或更新静态资源后，**记得把 `sw.js` 里的缓存版本号随手 +1**（`taoyuan-shell-v5` → `taoyuan-shell-v6`）：页面导航走 network-first 能及时拿到新版，但预缓存的外壳资源靠版本号触发旧缓存清理，不改版本号老用户可能一直用旧图标/旧清单。

### 访问统计（/api/stats）开启步骤

网页「这个月有多少人在用」区块由 Cloudflare Pages Function（`functions/api/stats.js`）读取 Cloudflare Web Analytics 的聚合数字，**不需要数据库，密钥不下发前端**。开启：

1. Pages 项目 → **Web Analytics → Enable**（自动注入无 Cookie 统计代码）
2. 打开 dash.cloudflare.com → Web Analytics 页面，从浏览器地址栏复制**站点 tag**（`?siteTag=xxx` 那串）
3. **账户 tag**：dash 首页 URL 里的 32 位十六进制串
4. My Profile → **API Tokens → Create Token**，权限选 `Account → Account Analytics → Read`
5. Pages 项目 → Settings → **Environment variables**（生产环境）添加：
   - `ANALYTICS_ACCOUNT_TAG` = 账户 tag
   - `ANALYTICS_TOKEN` = API Token（标记为 Secret）
   - `ANALYTICS_SITE_TAG` = 站点 tag
6. 重新部署一次（push 一个空提交即可），网页即显示统计

未配置时网页显示「暂未开启」，不影响任何功能；`file://` 直接打开同样安全降级。本地调试可用 `python tools/devserver.py 8933`（带 no-cache 头）。
