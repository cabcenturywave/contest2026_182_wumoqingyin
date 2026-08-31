# CombatSense Edge — 官方提交材料

## 官方上传包

官网“提交作品”入口要求上传一个按 `<队伍名称>-<作品名称>-<仓库名称>.zip` 命名的压缩包。本仓已经生成唯一候选包：

`wumoqingyin-CombatSense-Edge-contest2026_182_wumoqingyin.zip`

| 项目 | 值 |
|---|---|
| ZIP 大小 | 630,890 bytes |
| ZIP SHA-256 | `627e780ce211b46e432e7323db12d2289d2c0180c3a4ea229a088b06fa764023` |
| 完整性 | 3 个条目全部可解压，中文文件名带 UTF-8 标记 |
| 官方表单 | [openvela 大赛提交作品表单](https://mi.feishu.cn/share/base/form/shrcn1gCLxCjCXGwiuQ4TTDrQ7d) |

压缩包只包含官方模板技术报告 DOCX/PDF 和演示视频，不包含源码、AI 日志、私钥、证书私钥、Token、队长姓名或联系电话。源码与 AI Coding 日志由评审从专属 GitHub 仓库直接 clone。

## 提交清单

| 材料 | 文件 | 路径 |
|---|---|---|
| 官方模板技术报告（DOCX） | `CombatSense-Edge-官方作品提交报告.docx` | `submission/CombatSense-Edge-官方作品提交报告.docx` |
| 官方模板技术报告（PDF，7 页） | `CombatSense-Edge-官方作品提交报告.pdf` | `submission/CombatSense-Edge-官方作品提交报告.pdf` |
| 演示视频（47s，1280x720，H.264） | `CombatSense-Edge-demo.mp4` | `submission/CombatSense-Edge-demo.mp4` |
| 官网上传 ZIP | `wumoqingyin-CombatSense-Edge-contest2026_182_wumoqingyin.zip` | `submission/` |
| 补充图文作品介绍 | `CombatSense-Edge-作品介绍.docx/.pdf` | `submission/`（不放入官网 ZIP） |
| VelaSim 实录截图 | `assets/*.png`（5 张） | `submission/assets/` |

### 官方上传 ZIP 内容

| 文件 | 大小 | SHA-256 |
|---|---:|---|
| `CombatSense-Edge-官方作品提交报告.docx` | 30,607 bytes | `fdd1839a2c0462bfcc68f81f3fc919784e6526d320344dd58354119a6888d849` |
| `CombatSense-Edge-官方作品提交报告.pdf` | 575,139 bytes | `285eaf492f000916d7dbab961a4599a07dd785d8e87f0917549452f5ec4921ca` |
| `CombatSense-Edge-demo.mp4` | 226,894 bytes | `9f4f0441bc793635412ba9bc30eb4e73ed4c530d3159315e94ac68eeab46bd7b` |

报告已经逐页渲染检查：A4、7 页、摘要 290 字；官方模板水印、材料清单、信息表、AI-Native 用量表、评审维度对照和注意事项均保留。Token 总量记为 N/A，原因是官方 OpenCode JSONL 导出不含该字段；没有编造数值。

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
| AI 模型 | MiMo-v2.5 / MiMo-v2.5-pro |
| 日志规模 | 22 个会话 / 1618 条事件，官方 validator 全部通过 |
| 自定义 Skills | `.claude/skills/combat-sense-{quickapp,imu,agent}/SKILL.md`（3 个） |

## 安全复核

```bash
node scripts/security-scan.js --history
```

该命令检查当前文件、DOCX/RPK/ZIP 内嵌条目和全部可达 Git 历史，只报告风险类别与文件位置，不输出命中的秘密内容。生产签名私钥仅由本地受控流程使用，绝不进入 GitHub、作品报告、演示视频或官方上传 ZIP。
