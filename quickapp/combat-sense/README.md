# CombatSense Edge

## 一、作品简介

CombatSense Edge 是一款基于 openvela 可穿戴平台的拳击训练辅助快应用。通过手表端 IMU 传感器（或 Demo 模拟数据）实时检测出拳动作（Jab / Cross / Hook / Other），在训练中提供实时计数、倒计时和置信度反馈，训练后给出动作统计、左右手差异、疲劳趋势和教练建议。当前阶段为应用骨架 + Demo 数据驱动，不接入真实硬件。

## 二、选题方向

**快应用 / 手表应用创新** — 利用 openvela 快应用框架（QuickApp）构建手表端 UI，复用 `system.router` 等系统能力。

## 三、目录结构

```
quickapp/combat-sense/
├── package.json               # aiot-toolkit 构建脚本 + devDependencies
├── .gitignore                 # 忽略 node_modules/、build/、dist/
├── README.md                  # 本文件
└── src/
    ├── manifest.json          # 快应用入口配置（路由、设备类型、特性声明）
    ├── app.ux                 # 应用生命周期
    ├── config-watch.json      # 手表设备配置（空对象）
    ├── common/
    │   ├── demo-data.js       # 完整 Demo Session JSON + 40 条可回放动作事件
    │   ├── data-interface.js  # 数据抽象层（Demo / 真实 IMU 切换接口）
    │   └── logo.png           # 应用图标（96x96 RGBA PNG）
    └── pages/
        ├── index/index.ux     # Today — 训练入口、设备状态、上次摘要
        ├── session/index.ux   # Combat Session — 计时/计数/置信度/暂停/结束
        ├── review/index.ux    # Review — 统计、左右手、疲劳趋势、教练建议
        └── settings/index.ux  # Settings — 佩戴手/站姿/训练类型/Demo 开关

contest2026_182_wumoqingyin.xml  # 已添加 linkfile 映射
```

## 四、页面流程

```
Today ──(开始训练)──> Combat Session ──(结束)──> Review ──(返回首页)──> Today
```

- **Today**: 展示传感器连接状态、上次训练摘要（时长/出拳/置信度），点击红色按钮进入训练。
- **Combat Session**: 实时显示倒计时、Jab/Cross/Hook/Other 计数、平均置信度。支持暂停/继续/结束。
- **Review**: 训练结束后展示总时长、动作分布、左右手差异条形图、疲劳趋势柱状图、教练建议。
- **Settings**: 点击循环切换选项（佩戴手、站姿、训练类型、Demo 数据开关）。

## 五、运行方式

### 本地构建 RPK

```bash
cd quickapp/combat-sense
npm install
npm run build
# 输出: dist/com.openvela.combatsense.debug.1.0.0.rpk
```

### 模拟器运行

已在 Ubuntu VM 的官方 VelaSim `vela-miwear-watch-5.0` 镜像中实际验证：首页 → 训练 → 实时计数 → 训练回顾均可正常运行。

```bash
# 首次：下载官方模拟器资源并创建手表虚拟设备
npm run simulator:init
npm run simulator:create-vvd

# 无图形 Ubuntu VM：自动构建、安装和启动（首次提示时输入 y）
npm run simulator:headless
```

`simulator:headless` 使用 Xvfb，因此不需要配置桌面环境、VNC 或公网端口。`simulator:create-vvd` 是对 aiot-toolkit 2.0.5 中新设备名称校验问题的本地兼容封装，只调用已安装的官方 SDK，不包含密钥。

### Demo Data 说明

- **Demo Session JSON** 位于 `src/common/demo-data.js`
- 包含一个完整的 3 回合 / 3 分钟拳击训练数据：117 次出拳、左右手分布、疲劳趋势曲线、4 条教练建议
- **可回放动作事件**：同一文件中的 `demoEvents` 数组包含 40 条带时间戳的模拟拳击事件（~30 秒），由 `data-interface.js` 的 `subscribePunches()` 按时间回放

### 数据接口说明

`data-interface.js` 是 UI 层与传感器后端之间的抽象层：
- `subscribePunches(callback, errorCallback, speed)` — 订阅出拳事件（Demo 模式下回放 `demoEvents`）
- `unsubscribePunches()` — 停止订阅
- `getSessionSummary()` — 获取上一次训练总结
- `getSettings()` / `saveSettings(obj)` — 读写持久化设置
- 未来接入真实 IMU 时，只需替换 `subscribePunches` 内部实现，UI 层无需修改

## 六、AI Coding 使用说明

本项目第一阶段（应用骨架）完全通过 AI 辅助完成：
- 需求分析与页面拆解：由 AI 根据比赛要求制定任务计划
- 代码实现：AI 参考 openvela 现有 wearable quickapp 示例（health-demo、settings、24count、fistPower）的目录结构、manifest 格式、组件模式和路由用法
- 数据建模：AI 设计了 demo-data.js 中的完整训练数据结构和可回放事件序列
- 工程修正：AI 发现并修正了 manifest.json 位置、缺少 package.json/config-watch.json 等构建兼容性问题
- 完整对话日志见 `logs/` 目录
