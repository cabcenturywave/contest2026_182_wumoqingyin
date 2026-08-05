# CombatSense Edge

## 一、作品简介

CombatSense Edge 是一款面向 openvela 可穿戴平台的拳击训练辅助快应用。通过手表端 IMU 传感器（或 Demo 模拟数据）实时检测出拳动作（Jab / Cross / Hook / Other），在训练中提供实时计数、倒计时和置信度反馈，训练后给出动作统计、左右手差异、疲劳趋势和教练建议。

当前状态：**应用骨架 + Demo 数据驱动**，已完成 aiot-toolkit RPK 打包验证，尚未完成 openvela 模拟器实际运行验证。代码仅位于 contest 专属仓，通过 manifest `<linkfile>` 映射到 openvela 编译树，不改动任何生产仓库。

## 二、选题方向

**快应用 / 手表应用创新** — 利用 openvela 快应用框架（QuickApp）构建手表端 UI，复用 `system.router` 等系统能力，探索可穿戴设备在运动训练场景的应用。

## 三、目录结构

```text
contest2026_182_wumoqingyin/
├── quickapp/combat-sense/         # 主作品：拳击训练快应用
│   ├── package.json               # aiot-toolkit 构建脚本 + devDependencies
│   ├── .gitignore                 # 忽略 node_modules/、build/、dist/
│   ├── README.md                  # 作品详细说明
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
├── quickapp/hello_quickapp/       # 快应用示例骨架
├── app/hello_app/                 # 应用示例骨架
├── board/contest_board/           # 板级适配示例骨架
├── logs/                          # AI Coding 日志（格式见 logs/README.md）
├── contest2026_182_wumoqingyin.xml # repo manifest，含 linkfile 映射
├── openvela.xml                   # openvela 基础工程 manifest
├── .gitignore.example             # 编译产物忽略示例
└── README.md                      # 本文件
```

### linkfile 映射（contest2026_182_wumoqingyin.xml）

| 本仓路径 | 映射到 openvela 编译树 |
| --- | --- |
| `app/hello_app` | `packages/demos/contest2026_182_hello_app` |
| `quickapp/hello_quickapp` | `packages/apps/contest2026_182_hello_quickapp` |
| `quickapp/combat-sense` | `packages/apps/contest2026_182_combat_sense` |
| `board/contest_board` | `vendor/openvela/boards/contest2026_182_board` |

> 代码只存在于 contest 专属仓，构建时通过 linkfile 自动出现在 openvela 编译树对应位置，**生产仓库零改动**。

## 四、运行方式

### 已验证：RPK 打包

```bash
cd quickapp/combat-sense
npm install
npm run build
# 输出: dist/com.openvela.combatsense.debug.1.0.0.rpk
```

此步骤已通过 aiot-toolkit 验证，可正常生成 RPK 文件。

### 待验证：openvela 模拟器运行

以下步骤中，仅 Step 1 的 board config 目录、defconfig 内容（含 `CONFIG_QUICKAPP=y`）和 `cmake_out/vela_goldfish-arm64-v8a-ap/` 路径已在 VM 中确认存在；**完整编译、模拟器启动、RPK 安装和应用运行均未实际执行**，列为后续待完成项：

```bash
# 0. 拉取完整 openvela 工程（首次）
repo init -u https://github.com/open-vela/contest2026_182_wumoqingyin \
  -b dev-ai-contest-2026 -m contest2026_182_wumoqingyin.xml
repo sync -c -j8

# 1. [待验证] 编译（goldfish 模拟器目标，已含 CONFIG_QUICKAPP=y）
#    build.sh 接收 board config 目录，自行读取 defconfig
./build.sh vendor/openvela/boards/vela/configs/goldfish-arm64-v8a-ap -j8

# 2. [待验证] 启动模拟器（参数为 cmake_out 下的构建产物目录）
./emulator.sh cmake_out/vela_goldfish-arm64-v8a-ap

# 3. [待验证] 将 RPK 推送到模拟器
#    需确认模拟器内的 adb 或 push 机制，以下为预期命令：
# adb push quickapp/combat-sense/dist/com.openvela.combatsense.debug.1.0.0.rpk /data/

# 4. [待验证] 在模拟器内启动 CombatSense Edge
```

> `vendor/openvela/boards/vela/configs/` 下无 `quickapp/` 目录，快应用能力通过 `goldfish-arm64-v8a-ap` defconfig 中的 `CONFIG_QUICKAPP=y` 启用。`cmake_out/vela_goldfish-arm64-v8a-ap/` 为既有构建产物目录，非本次实测生成。

### Demo Data 与数据接口边界

- **Demo Session JSON**（`src/common/demo-data.js`）：包含一个完整的 3 回合 / 3 分钟拳击训练数据，117 次出拳、左右手分布、疲劳趋势曲线、4 条教练建议。
- **可回放动作事件**：同一文件中的 `demoEvents` 数组包含 40 条带时间戳的模拟拳击事件（约 30 秒），由 `data-interface.js` 的 `subscribePunches()` 按时间回放。
- **数据抽象层**（`src/common/data-interface.js`）：UI 层与传感器后端之间的接口层，提供 `subscribePunches` / `unsubscribePunches` / `getSessionSummary` / `getSettings` / `saveSettings` 等方法。**未来接入真实 IMU 时，只需替换 `subscribePunches` 内部实现，UI 层无需修改。**

当前所有数据均为 Demo 模拟数据，不依赖真实硬件或 IMU 传感器。

## 五、AI Coding 使用说明

本项目完全借助 AI 辅助开发，使用 **OpenCode** 作为主要 AI 编程工具：

- **需求分析与页面拆解**：由 AI 根据比赛要求制定任务计划，拆解为 Today / Combat Session / Review / Settings 四个页面。
- **代码实现**：AI 参考 openvela 现有 wearable quickapp 示例（health-demo、settings、24count、fistPower）的目录结构、manifest 格式、组件模式和路由用法。
- **数据建模**：AI 设计了 demo-data.js 中的完整训练数据结构和可回放事件序列。
- **工程修正**：AI 发现并修正了 manifest.json 位置、缺少 package.json / config-watch.json 等构建兼容性问题。
- **可复用 Skill**：`.claude/skills/combat-sense-quickapp/` 固化了 CombatSense QuickApp 的页面约定、Demo / IMU 数据边界、构建验证与安全检查，可用于后续功能迭代。
- **日志归集**：AI 对话日志通过 OpenCode 导出，存放在 `logs/` 目录，格式遵循 `logs/README.md` 规范。
- **敏感信息处理**：提交前对日志中的 API Key、Token 等敏感信息进行脱敏扫描，确保不含明文密钥。

完整对话日志见 `logs/` 目录。
