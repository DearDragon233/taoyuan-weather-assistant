# 部署包快速索引

- `index.html` — 网站本体（与线上 taoyuan-weather.pages.dev 同步）
- `manifest.webmanifest` — PWA 清单（应用名称、图标、主题色，「添加到主屏幕」用）
- `sw.js` — Service Worker（PWA 离线兜底；预缓存页面外壳，气象 API 请求不拦截）
- `icons/` — PWA 图标（icon-192.png / icon-512.png / icon-512-maskable.png）
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
- 改版 index.html 或更新静态资源后，**记得把 `sw.js` 里的缓存版本号随手 +1**（`taoyuan-shell-v1` → `taoyuan-shell-v2`）：页面导航走 network-first 能及时拿到新版，但预缓存的外壳资源靠版本号触发旧缓存清理，不改版本号老用户可能一直用旧图标/旧清单。
