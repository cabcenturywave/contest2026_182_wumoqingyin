# CombatSense Edge — 参赛要求矩阵与初步提交说明

## 一、参赛作品概要

- **作品名称**：CombatSense Edge
- **选题方向**：快应用 / 手表应用创新
- **团队 ID**：182_wumoqingyin
- **当前版本**：Beta 1.0
- **代码仓库**：仅 contest 专属仓，通过 manifest linkfile 映射到 openvela 编译树

## 二、真机环境事实声明

| 项目 | 状态 | 说明 |
|---|---|---|
| B 家 gxmo | **VERIFIED** | 主机在线，CH340 `/dev/ttyUSB0` 可枚举 |
| 串口配置 | **VERIFIED** | 板级 defconfig 为 `CONFIG_UART_BAUD=1000000`，8N1，无流控 |
| 供电与复位 | **VERIFIED** | 按官方 RTS-to-RST 约定受控复位后，捕获到 `SFBL` 启动日志 |
| 当前固件 | **VERIFIED** | 当前运行 SiFli/RT-Thread 风格固件，控制台是 `msh />`，不是 openvela/NuttX NSH |
| IMU 硬件基线 | **VERIFIED** | 启动日志显示 LSM6DSL 加速度计/陀螺仪初始化成功，`list_device` 显示 `acce_lsm` / `gyro_lsm` / `step_lsm` |
| openvela/NuttX NSH | **BUILD_VERIFIED** | openvela 镜像已完整构建；尚未备份原固件、烧录和捕获 NSH 启动证据 |
| CombatSense 真机运行 | **BLOCKED** | 现有固件不是 openvela，尚无 CombatSense 上板证据 |

> **边界**：真机与 IMU 已确认存在且当前固件可运行，但这不能替代 openvela/NuttX NSH、CombatSense 或官方准入证据。

## 三、官方赛题两阶段要求矩阵

### 第一阶段：openvela 平台适配（基础必做）

| 官方要求 | 状态 | 仓库证据 / 下一步 |
|---|---|---|
| 系统启动、串口、NSH、GPIO/定时器 | **BUILD_VERIFIED** | SF32LB52 openvela 已生成 `nuttx.bin`；当前真机仍是 RT-Thread，须先备份原固件再烧录并验证 NSH/GPIO/定时器。 |
| Wi-Fi/以太网、TCP/IP + TLS、外网 | **BLOCKED** | 尚无板上 openvela 网络与 TLS 证据。 |
| 至少 2 项 openvela 独有组件适配 | **BLOCKED** | QuickApp/VelaSim 仅是软件基线，不等于在目标板上完成两项框架适配。 |
| 至少 1 项 NuttX 上游不存在的新外设驱动 | **BLOCKED** | `app/imu_tool` 是 Agent Tool 骨架，不是新外设驱动。 |
| openvela 官方准入测试 | **BLOCKED** | 待赛题组发布并在目标板上执行。 |
| BSP 规范：Kconfig/defconfig/链接脚本/移植指南 | **SCAFFOLDED** | 已有板级与隔离构建骨架，完整移植与真机验收未完成。 |

#### 前期软件基线（非第一阶段完成证明）

- **VERIFIED**：QuickApp 四页交互、40 条 Demo 事件、RPK 构建、VelaSim 安装与首页启动。
- **VERIFIED**：115 项静态契约/语义检查。

### 第二阶段：AI Agent 智能应用（进阶必做）

| 官方要求 | 状态 | 仓库证据 / 下一步 |
|---|---|---|
| 目标板运行 Agent，配置 LLM 并对话 | **BLOCKED** | MiMo 开发日志证明的是开发过程，不是目标板 Agent 运行。 |
| 至少 2 个 Markdown Skill | **SCAFFOLDED** | `combat-sense-imu` 与 `combat-sense-agent` 已创建，尚未装入板上 Agent 验证。 |
| 至少 1 个 C Tool 并与硬件交互 | **SCAFFOLDED** | `app/imu_tool` host stub 可编译，硬件读取返回 `-ENOSYS`，尚未注册到 Agent 工具系统。 |
| 真机指令→推理→硬件工具→结果，含 2+ 工具多步协作 | **BLOCKED** | Skill 中仅有 Probe/Aggregate/Advise 设计，无真机执行证据。 |

## 四、新增内容清单

- Markdown Skills：`.claude/skills/combat-sense-imu/` 与 `.claude/skills/combat-sense-agent/`
- C Tool 骨架：`app/imu_tool/`
- 要求矩阵：本文件
- 构建修复补丁：`patches/0001-feature-registry-use-generated-headers.patch`
- 真机与构建证据：`docs/hardware-build-evidence.md`
- OpenCode/MiMo 对话记录：`logs/cabcenturywave/`

## 五、验证命令

```bash
cd quickapp/combat-sense && npm ci && npm test && npm run build
cd ../../app/imu_tool && gcc -DIMU_TOOL_HOST_STUB -o imu_tool_stub imu_tool_main.c -lm && ./imu_tool_stub
cd ../.. && node scripts/contest-verify.js

# 在 openvela 全量工作区应用构建修复并构建目标板镜像
git -C frameworks/runtimes/feature apply \
  /path/to/contest2026_182_wumoqingyin/patches/0001-feature-registry-use-generated-headers.patch
source build/envsetup.sh
cmake --build cmake_out/lckfb_huangshan_pi -- -j4
```

## 六、诚实声明

1. openvela 目标板镜像已构建成功，但尚未备份原固件、烧录或取得 NSH 真机启动证据；当前已验证的真机固件仍是 SiFli/RT-Thread 基线。
2. LSM6DSL 初始化与设备枚举只证明 IMU 硬件基线，不代表 CombatSense 检测算法已真机校准。
3. C Tool 骨架所有硬件读取返回 `-ENOSYS`，不伪造任何传感器数据。
4. Agent Skill 设计面向未来真机集成，当前无板上 LLM/Agent 闭环。
