# AGENTS.md — AI 协作者（coworker）工作章程

> 本项目欢迎 AI agent 作为 coworker 参与开发。为避免"多个厨师一锅乱炖"，所有 AI 协作者遵守本章程。
> 人类协作者请看 [CONTRIBUTING.md](CONTRIBUTING.md)（内容一致，口径更细）。

## 项目一句话

给平谷桃农的免费农事气象决策网页：单文件 `index.html`，零依赖无构建，Open-Meteo 数据，全部计算在用户端。

## 硬性约束（违反即回滚）

1. **不动底线**：不引入构建步骤、不加 npm/CDN 运行时依赖、不加注册/登录/统计埋点、不接收费接口
2. **文案口径**：面向中老年农民的口语化中文，结论先行；新增 UI 文案须与现有风格一致（参考推进方案卡）
3. **单文件原则**：功能代码进 `index.html`；只有 PWA 外壳（manifest/sw/icons）和工具脚本可以是独立文件
4. **API 不拦截**：`sw.js` 不得缓存/拦截 open-meteo.com 任何请求
5. **缓存版本**：改动 index.html 后，`sw.js` 的 `CACHE_VERSION` +1；改数据字段则 `index.html` 里 `CACHE_VER` +1
6. **无虚构**：农学参数（临界温度/需冷量/发育期/病害阈值）必须给文献口径；查不到就显示"暂无公开数据"

## 工作流程

```
1. 读 TASKS.md（当前任务书），认领一个任务
2. git checkout -b feat/<名字>（从 upgrade/v4 拉出）
3. 改动 → 按 TASKS.md 验收标准自测 → 独立提交（中文 commit message，一个功能一个提交）
4. 不 push、不 merge —— 留给维护者审查合并
```

## 自测清单（提交前必过）

- `node --check sw.js`（若改了 SW）；manifest 过 JSON 校验
- 浏览器打开 `index.html`（file:// 与 http:// 都试）控制台零报错
- 切换至少 2 个乡镇，各模块渲染正常；断网刷新一次看兜底文案
- 手机宽度（375px）过一遍布局，触控目标 ≥44px

## 历史协作记录

- 2026-09 v4.0 主线（浇水模块/疏果套袋/分享）：维护者本人
- 2026-09 v4.0 PWA（manifest/sw/注册代码）：coworker agent 贡献（icons 与最终校验由主线补全）
