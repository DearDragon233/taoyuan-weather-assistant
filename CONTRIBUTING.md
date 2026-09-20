# CONTRIBUTING.md — 参与升级（人类协作者版）

欢迎参与「桃园农事气象助手」升级。无论写代码、核农学参数还是反馈桃农使用问题，都是贡献。

## 快速上手

```bash
git clone https://github.com/DearDragon233/taoyuan-weather-assistant.git
cd taoyuan-weather-assistant
git checkout upgrade/v4          # 升级主线在这条分支
# 无构建。本地预览：
npx serve .                      # 或 python -m http.server
```

## 你可以贡献什么

| 类型 | 例子 | 难度 |
|---|---|---|
| 农学参数校准 | 用平谷实测物候修正品种需冷量/发育期表（`index.html` 参数区） | ★ |
| 文案打磨 | 把建议写得更像"老把式"说的话 | ★ |
| 新决策模块 | 从 [UPGRADE_PLAN.md](UPGRADE_PLAN.md) 路线认领（虫害预测、物候人工修正等） | ★★★ |
| 反馈 | 桃农实际用起来哪里看不懂、不准，开 issue | ★ |

## 提交规范

- 从 `upgrade/v4` 拉功能分支：`feat/<功能名>` 或 `fix/<问题名>`
- 一个功能一个提交，中文 message，格式：`feat(模块): 一句话说明` + 空行 + 要点列表
- **不要直接 push 到 upgrade/v4**：开 Pull Request，等维护者审查
- 改了 `index.html` 记得把 `sw.js` 里的 `CACHE_VERSION` +1（详见 [DEPLOY.md](DEPLOY.md)）

## 底线（同 AGENTS.md）

零依赖无构建、不收集用户信息、只接免费开放数据、农学参数必须有文献口径、文案面向农民口语化。
AI 协作者的章程见 [AGENTS.md](AGENTS.md)。
