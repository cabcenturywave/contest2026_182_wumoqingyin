# CombatSense Edge — 初赛提交材料

## 提交清单

| 材料 | 文件 | 路径 |
|---|---|---|
| 作品介绍文档（DOCX） | `CombatSense-Edge-作品介绍.docx` | `submission/CombatSense-Edge-作品介绍.docx` |
| 作品介绍文档（PDF，7 页） | `CombatSense-Edge-作品介绍.pdf` | `submission/CombatSense-Edge-作品介绍.pdf` |
| 演示视频（47s，1280x720，H.264） | `CombatSense-Edge-demo.mp4` | `submission/CombatSense-Edge-demo.mp4` |
| VelaSim 实录截图 | `assets/*.png`（5 张） | `submission/assets/` |

### 截图说明

| 文件 | 内容 |
|---|---|
| `today.png` | Today 页面 — Demo 数据模式状态条、上次训练摘要、开始训练按钮 |
| `session.png` | Combat Session — 实时计数、倒计时、置信度、暂停/结束控制 |
| `review.png` | Review — 动作统计、左右手差异、疲劳趋势 |
| `settings.png` | Settings — 佩戴手/站姿/训练类型/Demo 开关 |
| `coach.png` | Review 下滑 — 教练建议与返回首页 |

## 生产 release.rpk

| 项目 | 值 |
|---|---|
| 文件名 | `com.openvela.combatsense.release.1.0.0.rpk` |
| 路径 | `quickapp/combat-sense/release/com.openvela.combatsense.release.1.0.0.rpk` |
| 大小 | 27,973 bytes |
| SHA-256 | `3b75a9b4dd576b66ddd963433fab283b0bd1650423358c1ed9cfa1cfba8c2bc1` |
| package | `com.openvela.combatsense` |
| versionName | `1.0.0` |

## Demo / Mock 诚实边界

本作品所有训练数据均为 **Demo/Mock 数据**：

- **Demo Session JSON**（`quickapp/combat-sense/src/common/demo-data.js`）：3 回合 / 3 分钟训练，117 次出拳，左右手分布，疲劳趋势，4 条教练建议
- **可回放动作事件**：`demoEvents` 数组，40 条模拟拳击事件（~30 秒）
- **所有数字均为模拟数据**，不代表真实训练表现
- 演示视频录制于官方 VelaSim 模拟器，使用 Demo 数据驱动
- 截图均为 VelaSim 模拟器实录，非真机

## OpenCode / MiMo-v2.5 日志

| 项目 | 路径 |
|---|---|
| AI 对话日志 | `logs/cabcenturywave/` |
| 日志 manifest | `logs/cabcenturywave/manifest.json` |
| AI 模型 | MiMo-v2.5（xiaomi-token-plan/mimo-v2.5） |
| 可用 Skill | `.claude/skills/combat-sense-quickapp/SKILL.md` |
