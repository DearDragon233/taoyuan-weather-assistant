# 部署包快速索引

- `index.html` — 网站本体（与线上 taoyuan-weather.pages.dev 同步）
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
