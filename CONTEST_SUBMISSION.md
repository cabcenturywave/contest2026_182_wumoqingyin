# CombatSense Edge — 参赛要求矩阵与初步提交说明

## 一、参赛作品概要

- **作品名称**：CombatSense Edge
- **选题方向**：快应用 / 手表应用创新
- **团队 ID**：182_wumoqingyin
- **当前版本**：Beta 1.0
- **代码仓库**：仅 contest 专属仓，通过 manifest linkfile 映射到 openvela 编译树

## 二、硬件环境事实声明

| 项目 | 状态 | 说明 |
|------|------|------|
| B 家 gxmo 设备 | 已连接 | USB 已枚举，候选真机串口已识别 |
| 串口设备 | `/dev/ttyUSB0` | CH340 芯片，已枚举为空闲状态 |
| 目标波特率 | `CONFIG_UART_BAUD=1000000` | defconfig 中已配置 |
| 串口控制台 | **未证实** | 在 1M 波特率发送换行未获得任何输出 |
| 固件运行状态 | **未证实** | 无法确认设备是否运行 openvela |
| 供电状态 | **未证实** | USB 已连接但未确认系统启动 |
| IMU 传感器 | **未验证** | 未在真机上测试加速度计 |
| 真机 openvela 运行 | **未完成** | 不能声称真机已运行 |

> **底线**：候选真机串口已连接，但控制台/供电/固件运行均未证实。严禁写成"真机已运行"。

## 三、官方赛题两阶段要求矩阵

### 第一阶段：openvela 平台适配（基础必做）

| 官方要求 | 状态 | 仓库证据 / 下一步 |
|---|---|---|
| 系统启动、串口、NSH、GPIO/定时器 | **BLOCKED** | 仅枚举 CH340；控制台无输出。先确认供电/复位/接线并保留启动证据。 |
| Wi-Fi/以太网、TCP/IP + TLS、外网 | **BLOCKED** | 尚无板上网络与 TLS 证据。 |
| 至少 2 项 openvela 独有组件适配 | **BLOCKED** | QuickApp/VelaSim 仅是软件基线，不等于在目标板上完成两项框架适配。 |
| 至少 1 项 NuttX 上游不存在的新外设驱动 | **BLOCKED** | `app/imu_tool` 是 Agent Tool 骨架，不是新外设驱动。 |
| openvela 官方准入测试 | **BLOCKED** | 待赛题组发布并在目标板上执行。 |
| BSP 规范：Kconfig/defconfig/链接脚本/移植指南 | **SCAFFOLDED** | 已有板级与隔离构建骨架，完整移植与真机验收未完成。 |

#### 前期软件基线（非第一阶段完成证明）

- **VERIFIED**：QuickApp 四页交互、40 条 Demo 事件、RPK 构建、VelaSim 安装与首页启动。
- **VERIFIED**：115 项静态契约/语义检查。

### 第二阶段：Agent 能力 + 硬件集成

| 要求项 | 状态 | 详细说明 |
|--------|------|----------|
| 官方要求 | 状态 | 仓库证据 / 下一步 |
|---|---|---|
| 目标板运行 Agent，配置 LLM 并对话 | **BLOCKED** | MiMo 开发日志证明的是开发过程，不是目标板 Agent 运行。 |
| 至少 2 个 Markdown Skill | **SCAFFOLDED** | `combat-sense-imu` 与 `combat-sense-agent` 已创建，尚未装入板上 Agent 验证。 |
| 至少 1 个 C Tool 并与硬件交互 | **SCAFFOLDED** | `app/imu_tool` host stub 可编译，硬件读取返回 `-ENOSYS`，尚未注册到 Agent 工具系统。 |
| 真机指令→推理→硬件工具→结果，含 2+ 工具多步协作 | **BLOCKED** | Skill 中仅有 Probe/Aggregate/Advise 设计，无真机执行证据。 |

## 四、新增内容清单

### Markdown Agent Skills

| Skill | 路径 | 用途 |
|-------|------|------|
| combat-sense-imu | `.claude/skills/combat-sense-imu/SKILL.md` | IMU 传感器集成、校准协议、峰值检测调优 |
| combat-sense-agent | `.claude/skills/combat-sense-agent/SKILL.md` | Agent 多步推理、3 工具协作、硬件证据边界 |

### C Tool 骨架

| 文件 | 说明 |
|------|------|
| `app/imu_tool/imu_tool_main.c` | 8 个接口函数 + host stub 入口 |
| `app/imu_tool/Makefile` | NuttX Make 构建 |
| `app/imu_tool/CMakeLists.txt` | NuttX CMake 构建 |
| `app/imu_tool/Kconfig` | menuconfig 选项 |
| `app/imu_tool/README.md` | 接口文档 + host 编译命令 |

### manifest 更新

`contest2026_182_wumoqingyin.xml` 新增 linkfile：

```xml
<linkfile src="app/imu_tool" dest="packages/demos/contest2026_182_imu_tool"/>
```

## 五、验证命令

```bash
# QuickApp 静态契约检查
cd quickapp/combat-sense && npm ci && npm test

# C Tool host stub 编译验证
cd app/imu_tool && gcc -DIMU_TOOL_HOST_STUB -o imu_tool_stub imu_tool_main.c -lm && ./imu_tool_stub

# 仓库提交验证
node scripts/contest-verify.js
```

## 六、诚实声明

1. 当前所有 IMU 硬件参数为初始估计值，未经真机校准。
2. 候选真机串口（gxmo / CH340 / `/dev/ttyUSB0`）已连接，但控制台输出、固件运行、IMU 传感器均未证实。
3. C Tool 骨架所有硬件读取返回 `-ENOSYS`，不伪造任何传感器数据。
4. Agent Skill 设计面向未来真机集成，当前无 LLM API 接入。
5. 本提交为骨架 + 模拟器验证阶段，不声称真机已完成。
