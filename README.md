# CombatSense Edge — 初赛作品（快应用 / 手表应用创新）

## 一、作品简介

CombatSense Edge 是一款面向 openvela 可穿戴平台的拳击训练辅助快应用。通过手表端 IMU 传感器（或 Demo 模拟数据）实时检测出拳动作（Jab / Cross / Hook / Other），在训练中提供实时计数、倒计时和置信度反馈，训练后给出动作统计、左右手差异、疲劳趋势和教练建议。

**选题方向**：快应用 / 手表应用创新 — 使用 openvela QuickApp 框架构建手表端 UI，复用 `system.router`、`system.sensor` 等系统能力。

**版本**：1.0.0（初赛最终提交）

### 已验证能力（1.0.0）

| 能力 | 状态 | 说明 |
|---|---|---|
| RPK 构建与打包 | **VERIFIED** | aiot-toolkit 2.0.5，`npm run build` 通过 |
| VelaSim 模拟器端到端 | **VERIFIED** | 官方 `vela-miwear-watch-5.0`，四页交互闭环 |
| 四页面交互闭环 | **VERIFIED** | Today → Session → Review → Settings 全流程 |
| Demo 数据驱动 | **VERIFIED** | 40 条可回放动作事件，训练统计/回顾完整 |
| Session→Review 参数流 | **VERIFIED** | Demo/Hardware 数据源区分，诚实 banner |
| 静态契约检查 | **VERIFIED** | 120 项自动化 smoke-test 检查通过 |
| 生产 release.rpk | **VERIFIED** | `quickapp/combat-sense/release/com.openvela.combatsense.release.1.0.0.rpk` |
| 作品介绍文档 | **VERIFIED** | `submission/CombatSense-Edge-作品介绍.pdf`（7 页） |
| 演示视频 | **VERIFIED** | `submission/CombatSense-Edge-demo.mp4`（47s，1280x720） |

## 二、选题方向与合规闭环

本作品完全基于 **快应用 / 手表应用创新** 赛题方向：

- 使用 openvela QuickApp 框架（aiot-toolkit 2.0.5 构建链）
- 手表端 UI 设计（480px 圆形手表布局）
- `system.router` 页面路由与 `system.sensor` 传感器接口
- 官方 VelaSim 模拟器验证（初赛允许仅用模拟器，真机不是合规必需项）
- 完整 Demo 数据驱动训练流程

**初赛必交清单**：

| 项目 | 状态 | 路径 |
|---|---|---|
| 完整源码 | **VERIFIED** | `quickapp/combat-sense/src/` |
| 生产 release.rpk | **VERIFIED** | `quickapp/combat-sense/release/com.openvela.combatsense.release.1.0.0.rpk` |
| 作品介绍文档 | **VERIFIED** | `submission/CombatSense-Edge-作品介绍.pdf`（7 页） |
| 演示视频（≤5min） | **VERIFIED** | `submission/CombatSense-Edge-demo.mp4`（47s） |
| 专属仓库 URL | **VERIFIED** | 本仓库 |

## 三、目录结构

```text
contest2026_182_wumoqingyin/
├── quickapp/combat-sense/         # 主作品：拳击训练快应用
│   ├── package.json               # aiot-toolkit 构建脚本 + devDependencies
│   ├── .gitignore                 # 忽略 node_modules/、build/、dist/、sign/
│   ├── release/                   # 生产 release.rpk 放置位置
│   ├── scripts/
│   │   ├── smoke-test.js          # 静态契约与语义检查
│   │   ├── verify-release.js      # release.rpk 校验脚本
│   │   └── create-velasim-vvd.js  # VelaSim 虚拟设备创建
│   └── src/
│       ├── manifest.json          # 快应用入口配置（路由、设备类型、特性声明）
│       ├── app.ux                 # 应用生命周期
│       ├── config-watch.json      # 手表设备配置
│       ├── common/
│       │   ├── demo-data.js       # 完整 Demo Session JSON + 40 条可回放动作事件
│       │   ├── data-interface.js  # 数据抽象层（Demo / 真实 IMU 切换接口）
│       │   └── logo.png           # 应用图标（96x96 RGBA PNG）
│       └── pages/
│           ├── index/index.ux     # Today — 训练入口、设备状态、上次摘要
│           ├── session/index.ux   # Combat Session — 计时/计数/置信度/暂停/结束
│           ├── review/index.ux    # Review — 统计、左右手、疲劳趋势、教练建议
│           └── settings/index.ux  # Settings — 佩戴手/站姿/训练类型/Demo 开关
├── .claude/skills/                # Markdown Skills（3 个）
├── app/imu_tool/                  # IMU C Tool（host stub 返回 ENOSYS）
├── logs/                          # OpenCode 日志（MiMo-v2.5）
├── patches/                       # 构建修复补丁
├── submission/                    # 初赛提交材料
│   ├── CombatSense-Edge-作品介绍.docx
│   ├── CombatSense-Edge-作品介绍.pdf
│   ├── CombatSense-Edge-demo.mp4
│   └── assets/                    # VelaSim 实录截图（5 张）
├── scripts/contest-verify.js      # 参赛验证脚本
├── CONTEST_SUBMISSION.md          # 官方要求矩阵与提交边界
└── README.md                      # 本文件
```

## 四、运行方式

### RPK 构建

```bash
cd quickapp/combat-sense
npm ci
npm run build
# 输出: dist/com.openvela.combatsense.debug.1.0.0.rpk
```

### VelaSim 模拟器运行

```bash
cd quickapp/combat-sense
npm run simulator:init          # 首次下载官方模拟器资源
npm run simulator:create-vvd    # 首次创建 Vela_CombatSense
npm run simulator:headless      # 无图形 Ubuntu VM 的实际启动命令
```

启动命令出现 `there is only one emulator, need to Run?` 时输入 `y`。

### 验证命令

```bash
cd quickapp/combat-sense
npm test                       # 115+ 项静态契约与语义检查
node scripts/verify-release.js # release.rpk 校验（需先构建）

cd ../../
node scripts/contest-verify.js # 参赛文件完整性检查
```

## 五、Demo 数据与数据接口

- **Demo Session JSON**（`src/common/demo-data.js`）：3 回合 / 3 分钟拳击训练数据，117 次出拳、左右手分布、疲劳趋势曲线、4 条教练建议。**所有训练数字均为 Demo/Mock 数据**。
- **可回放动作事件**：`demoEvents` 数组包含 40 条带时间戳的模拟拳击事件（~30 秒）。
- **数据抽象层**（`src/common/data-interface.js`）：UI 层与传感器后端之间的接口层。未来接入真实 IMU 时，只需替换 `subscribePunches` 内部实现，UI 层无需修改。

## 六、AI Coding 使用说明

本项目完全借助 AI 辅助开发，使用 **OpenCode** + **MiMo-v2.5**（xiaomi-token-plan/mimo-v2.5）作为主要 AI 编程工具：

- **日志归集**：AI 对话日志存放在 `logs/cabcenturywave/` 目录，格式遵循 `logs/README.md` 规范
- **可用 Skill**：`.claude/skills/combat-sense-quickapp/` 固化了 QuickApp 页面约定、Demo/IMU 数据边界、构建验证与安全检查
- **敏感信息处理**：提交前对日志中的 API Key、Token 等敏感信息进行脱敏扫描

## 七、可选加分与 HOLD

以下项目属于后续路线或加分项，**不影响初赛合规**：

### 真机证据（可选加分）

- **黄山派启动**：SF32LB52 已刷入 openvela，NuttX NSH 启动成功
- **LCD/触摸驱动**：`/dev/lcd0`、`/dev/input0` 已打开
- **真实 IMU 原始样本**：`/dev/lsm6dsl0` 已返回加速度/陀螺仪/温度数据
- **CombatSense 真机启动**：ROMFS 含完整应用，`ps` 显示进程运行中

### HOLD（后续阶段）

1. **真机四页触摸验收**：系统和进程已验证，人工触摸交互待完成
2. **真实 IMU 训练校准**：data-interface 中硬件参数为初始估计值
3. **网络/TLS 集成**：CDC-ECM `eth0` 已注册，TCP/DNS/TLS 待验证
4. **Agent 阶段**：LLM 对话教练、Agent 工具注册、多步硬件闭环
5. **新增 C 外设驱动**：当前 `imu_tool` 为 Agent Tool 骨架
6. **官方准入测试**：待赛题组发布

## 八、linkfile 映射

| 本仓路径 | 映射到 openvela 编译树 |
| --- | --- |
| `app/hello_app` | `packages/demos/contest2026_182_hello_app` |
| `app/imu_tool` | `packages/demos/contest2026_182_imu_tool` |
| `quickapp/hello_quickapp` | `packages/apps/contest2026_182_hello_quickapp` |
| `quickapp/combat-sense` | `packages/apps/contest2026_182_combat_sense` |
| `board/contest_board` | `vendor/openvela/boards/contest2026_182_board` |

> 代码只存在于 contest 专属仓，构建时通过 linkfile 自动出现在 openvela 编译树对应位置，**生产仓库零改动**。
