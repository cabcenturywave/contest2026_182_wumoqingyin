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

### 完整闭环流程（第二阶段验证）

```
                    ┌─────────────┐
                    │   Today     │
                    │  (首页)     │
                    └──────┬──────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
            ▼              ▼              ▼
     ┌──────────┐   ┌──────────┐   ┌──────────┐
     │ Settings │   │ Session  │   │  Review  │
     │  (设置)  │   │ (训练中) │   │ (回顾)   │
     └──────────┘   └──────────┘   └──────────┘
            │              │              │
            │              │              │
            └──────────────┼──────────────┘
                           │
                    ┌──────▼──────┐
                    │   Today     │
                    │  (返回首页) │
                    └─────────────┘
```

### 页面导航详情

| 源页面 | 触发动作 | 目标页面 | 导航方式 |
|--------|----------|----------|----------|
| **Today** | 点击 ⚙ 设置图标 | Settings | `router.push` |
| **Today** | 点击"开始训练" | Session | `router.push` |
| **Session** | 点击"开始" | Session (运行中) | 状态切换 |
| **Session** | 点击"暂停" | Session (已暂停) | 状态切换 |
| **Session** | 点击"继续" | Session (运行中) | 状态切换 |
| **Session** | 点击"结束" | Review | `router.replace` |
| **Review** | 点击"返回首页" | Today | `router.replace` |
| **Settings** | 点击 ← 返回箭头 | Today | `router.back` |

### 页面功能说明

- **Today**: 展示传感器连接状态、上次训练摘要（时长/出拳/置信度），点击红色按钮进入训练，点击右上角⚙进入设置。
- **Combat Session**: 实时显示倒计时、Jab/Cross/Hook/Other 计数、平均置信度。支持开始/暂停/继续/结束完整控制流。
- **Review**: 训练结束后展示总时长、动作分布、左右手差异条形图、疲劳趋势柱状图、教练建议。
- **Settings**: 点击循环切换选项（佩戴手、站姿、训练类型、Demo 数据开关），支持返回首页。

### 验收检查清单

- [ ] **Today → Settings**: 点击⚙图标可进入设置页面
- [ ] **Settings → Today**: 点击←返回箭头可返回首页
- [ ] **Today → Session**: 点击"开始训练"进入训练页面
- [ ] **Session 开始**: 点击"开始"按钮，计时器启动，实时计数开始
- [ ] **Session 暂停**: 点击"暂停"按钮，计时器暂停，计数停止
- [ ] **Session 继续**: 点击"继续"按钮，计时器恢复，计数继续
- [ ] **Session 结束**: 点击"结束"按钮，跳转到 Review 页面
- [ ] **Review → Today**: 点击"返回首页"返回 Today 页面
- [ ] **数据持久化**: 训练数据在页面间正确传递
- [ ] **Demo 数据**: 所有数据来自本地 Demo，无网络请求

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
- `probeSensor(successCb, failCb)` — 探测加速度计是否可用（500ms 超时）
- `setMode(mode)` / `getMode()` — 切换 `'demo'` / `'hardware'` 模式
- `subscribePunches(callback, errorCallback, speed)` — 订阅出拳事件
- `unsubscribePunches()` — 停止订阅
- `getSessionSummary()` — 获取上一次训练总结
- `getSettings()` / `saveSettings(obj)` — 读写持久化设置

### 硬件模式说明

硬件模式通过 `@system.sensor` 订阅加速度计（`interval: 'game'`），采用以下检测流水线：
1. **去重力**：指数移动平均（EMA）估计重力分量，`linearAccel = |mag - gravity|`
2. **峰值检测状态机**：IDLE → RISING → HOLDING → COOLDOWN
3. **冷却期**：两次出拳间隔至少 200ms
4. **输出**：`{ type: 'other', hand: 'unknown', confidence, timestamp }`

#### 待真板校准参数

以下参数为初始估计值，**必须在真板上重新校准**：

| 参数 | 当前值 | 说明 |
|---|---|---|
| `GRAVITY_EMA_ALPHA` | 0.98 | 重力 EMA 平滑系数 |
| `PUNCH_LINEAR_THRESHOLD` | 2.0 | 线性加速度出拳阈值（去重力后） |
| `COOLDOWN_MS` | 200 | 两次出拳最小间隔 (ms) |
| `PEAK_HOLDBACK_MS` | 80 | 峰值确认等待时间 (ms) |
| `CONFIDENCE_SCALE` | 0.08 | 置信度缩放系数 |

校准方法：佩戴手表静止 10 秒记录噪声基线，然后以不同力度出拳各 20 次记录峰值分布。

## 六、第二阶段：模拟器演示闭环优化

### 目标
实现完整的用户交互闭环，确保所有页面导航和数据流在模拟器中可正常运行。

### 实现内容
1. **Settings 入口**: 在 Today 页面右上角添加 ⚙ 设置图标，点击可进入 Settings 页面
2. **Settings 返回**: 在 Settings 页面添加 ← 返回箭头，支持返回 Today 页面
3. **完整流程验证**: Today → Session → 暂停/继续 → 结束 → Review → Today
4. **离线运行**: 所有数据来自本地 Demo，不接入网络、不写入 Key/Token

### 技术实现
- 使用 `@system.router` 进行页面导航
- Settings 页面使用 `router.back()` 返回上一页
- Session 页面使用状态机管理训练流程（idle → running → paused → running → idle）
- 数据通过 `data-interface.js` 抽象层传递，支持 Demo/真实 IMU 切换

### 验证结果
- [x] Settings 入口可见且可点击
- [x] Settings 返回功能正常
- [x] 训练流程完整可执行
- [x] 数据在页面间正确传递
- [x] 无网络请求，纯本地运行

## 七、AI Coding 使用说明

本项目第一阶段（应用骨架）完全通过 AI 辅助完成：
- 需求分析与页面拆解：由 AI 根据比赛要求制定任务计划
- 代码实现：AI 参考 openvela 现有 wearable quickapp 示例（health-demo、settings、24count、fistPower）的目录结构、manifest 格式、组件模式和路由用法
- 数据建模：AI 设计了 demo-data.js 中的完整训练数据结构和可回放事件序列
- 工程修正：AI 发现并修正了 manifest.json 位置、缺少 package.json/config-watch.json 等构建兼容性问题
- 完整对话日志见 `logs/` 目录
