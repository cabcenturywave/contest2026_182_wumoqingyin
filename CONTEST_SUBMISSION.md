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
| 原固件与恢复 | **VERIFIED** | 原 RT-Thread 固件已完整读取两次；16 MiB 镜像尺寸、SHA-256 与逐字节比较一致 |
| openvela/NuttX NSH | **VERIFIED** | `sftool --verify` 刷写成功；真机捕获 `SFBL`、`NuttShell (NSH)` 与 NuttX `uname` |
| openvela 外设基线 | **VERIFIED** | `/dev` 枚举 LCD、触摸、GPIO、定时器、RTC、按钮与 `/dev/lsm6dsl0`；reader 已返回真实 IMU 样本 |
| CombatSense 真机启动 | **VERIFIED** | ROMFS 含完整应用目录；`ps` 显示 `vapp hap://app/com.openvela.combatsense` 正在运行 |
| CombatSense 真机交互 | **PARTIAL** | LCD/触摸驱动已打开；四页面人工触摸与真实 IMU 训练校准尚未完成 |
| 生产模式 release.rpk | **BLOCKED** | `aiot release` 已执行，但本机没有有效生产签名路径；不得以 debug 证书冒充正式发布包 |

> **边界**：系统、设备节点和 CombatSense 进程已经真机验证；这仍不能替代人工触摸验收、真实 IMU 训练校准、网络/Agent 闭环或官方准入测试。

## 三、官方赛题两阶段要求矩阵

### 第一阶段：openvela 平台适配（基础必做）

| 官方要求 | 状态 | 仓库证据 / 下一步 |
|---|---|---|
| 系统启动、串口、NSH、GPIO/定时器 | **VERIFIED** | 真机已启动 NuttX NSH，GPIO 与 timer 设备节点已枚举。 |
| Wi-Fi/以太网、TCP/IP + TLS、外网 | **PARTIAL / PHYSICAL_LINK_BLOCKED** | CDC-ECM 已在真机注册非 loopback `eth0`；官方资料确认 PA36/PA35 是排针 USB_DM/USB_DP，但尚未连接到 gxmo，TCP、DNS、TLS 与外网仍未验证。 |
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
| 至少 1 个 C Tool 并与硬件交互 | **DEVICE_VERIFIED / AGENT_PENDING** | `app/imu_tool` 已在真机通过 `imu_tool 10` 有界读取真实 `/dev/lsm6dsl0` 样本并完成清理；Agent 工具注册尚未验证。 |
| 真机指令→推理→硬件工具→结果，含 2+ 工具多步协作 | **BLOCKED** | Skill 中仅有 Probe/Aggregate/Advise 设计，无真机执行证据。 |

## 四、新增内容清单

- Markdown Skills：`.claude/skills/combat-sense-imu/` 与 `.claude/skills/combat-sense-agent/`
- C Tool 构建候选：`app/imu_tool/`
- 要求矩阵：本文件
- 构建修复补丁：`patches/0001-feature-registry-use-generated-headers.patch`
- CDC-ECM 板级补丁：`patches/0002-huangshan-pi-enable-cdc-ecm-network.patch`
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

1. openvela 已刷写并启动，CombatSense 进程已在真机运行；尚未完成人工触摸四页验收。
2. `/dev/lsm6dsl0` 已能返回真实 IMU 样本，但这不代表 CombatSense 检测算法已接入或完成真机校准。
3. C Tool 的 host stub 所有硬件读取返回 `-ENOSYS`；目标端已通过 10 次有界真实原始 IMU 采样，拳型分类未校准时仍返回 `-ENODATA`，不伪造事件。
4. Agent Skill 设计面向未来真机集成，当前无板上 LLM/Agent 闭环。
5. 真机候选使用 debug RPK 验证；正式参赛 `release.rpk` 仍需通过 AIoT-IDE/受控签名流程生成，私钥不得提交。
