# CombatSense Edge — 初赛提交矩阵

## 一、作品概要

- **作品名称**：CombatSense Edge
- **选题方向**：快应用 / 手表应用创新
- **团队 ID**：182_wumoqingyin
- **版本**：1.0.0（初赛最终提交）
- **代码仓库**：contest 专属仓，通过 manifest linkfile 映射到 openvela 编译树

## 二、初赛必交清单

| 项目 | 状态 | 位置/说明 |
|---|---|---|
| 完整源码 | **VERIFIED** | `quickapp/combat-sense/src/`，含 manifest、4 页面、data-interface、demo-data |
| 生产模式 release.rpk | **VERIFIED** | `quickapp/combat-sense/release/com.openvela.combatsense.release.1.0.0.rpk`（27,973 bytes） |
| 作品介绍文档 | **VERIFIED** | `submission/CombatSense-Edge-作品介绍.pdf`（7 页） |
| 演示视频（≤5 分钟） | **VERIFIED** | `submission/CombatSense-Edge-demo.mp4`（47s，1280x720，H.264） |
| 专属仓库 URL | **VERIFIED** | 本仓库地址 |

> 所有初赛必交材料均已生成并放置于提交目录。

## 三、模拟器验证（初赛合规闭环）

初赛允许仅使用官方 VelaSim 验证，真机不是合规必需项。

| 项目 | 状态 | 说明 |
|---|---|---|
| RPK 构建 | **VERIFIED** | `npm run build`，aiot-toolkit 2.0.5 |
| VelaSim 安装 | **VERIFIED** | `vela-miwear-watch-5.0` 官方镜像 |
| VelaSim 启动 | **VERIFIED** | `npm run simulator:headless`，Xvfb 无图形 VM |
| 四页交互闭环 | **VERIFIED** | Today → Session → Review → Settings 全流程 |
| Demo 数据驱动 | **VERIFIED** | 40 条可回放动作事件，训练统计完整 |
| 静态契约检查 | **VERIFIED** | `npm test`，115+ 项 smoke-test 通过 |

## 四、AI Coding 日志与 Skill

| 项目 | 状态 | 位置/说明 |
|---|---|---|
| OpenCode 日志 | **VERIFIED** | `logs/cabcenturywave/`，含 manifest.json |
| AI 模型 | **VERIFIED** | MiMo-v2.5（xiaomi-token-plan/mimo-v2.5） |
| 日志格式 | **VERIFIED** | `logs/<github_login>/<date>/opencode__*.jsonl` |
| Skill #1 | **VERIFIED** | `.claude/skills/combat-sense-quickapp/SKILL.md` |
| Skill #2 | **VERIFIED** | `.claude/skills/combat-sense-imu/SKILL.md` |
| Skill #3 | **VERIFIED** | `.claude/skills/combat-sense-agent/SKILL.md` |

## 五、源码结构

```text
quickapp/combat-sense/
├── package.json               # 版本 1.0.0，含 verify:release 脚本
├── .gitignore                 # 忽略 node_modules/、build/、dist/、sign/
├── release/                   # 生产 release.rpk 放置位置
│   └── README.md              # 校验方式与私钥安全说明
├── scripts/
│   ├── smoke-test.js          # 静态契约与语义检查（115+ 项）
│   ├── verify-release.js      # release.rpk 校验脚本
│   └── create-velasim-vvd.js  # VelaSim 虚拟设备创建
└── src/
    ├── manifest.json          # package: com.openvela.combatsense, versionName: 1.0.0
    ├── app.ux
    ├── config-watch.json
    ├── common/
    │   ├── demo-data.js       # Demo/Mock 训练数据
    │   ├── data-interface.js  # 数据抽象层
    │   └── logo.png
    └── pages/                 # Today / Session / Review / Settings
```

## 六、验证命令

```bash
# QuickApp 静态检查
cd quickapp/combat-sense && npm ci && npm test

# release.rpk 校验
node scripts/verify-release.js

# 参赛文件完整性
cd ../../ && node scripts/contest-verify.js

# RPK 构建
cd quickapp/combat-sense && npm run build

# 模拟器运行
cd quickapp/combat-sense && npm run simulator:headless
```

## 七、许可与安全

- 仓库根目录包含 `LICENSE`（Apache License 2.0）
- `.gitignore` 忽略 `/sign`、证书、私钥目录
- 生产签名私钥**绝不提交**至仓库
- Demo 数据中无真实用户信息或敏感凭据

## 八、可选真机证据

以下为额外真机验证记录，**不影响初赛合规**：

| 项目 | 状态 | 说明 |
|---|---|---|
| 黄山派启动 | **VERIFIED** | SF32LB52，NuttX NSH 启动成功 |
| LCD/触摸驱动 | **VERIFIED** | `/dev/lcd0`、`/dev/input0` 已打开 |
| 真实 IMU 原始样本 | **VERIFIED** | `/dev/lsm6dsl0` 返回加速度/陀螺仪/温度 |
| CombatSense 真机启动 | **VERIFIED** | ROMFS 部署，进程运行中 |
| IMU C Tool host stub | **VERIFIED** | `-DIMU_TOOL_HOST_STUB` 模式下所有硬件操作返回 ENOSYS |
| 真机四页触摸验收 | **HOLD** | 系统已验证，人工触摸待完成 |
| 真实 IMU 训练校准 | **HOLD** | 硬件参数为初始估计值 |
| 网络/TLS 集成 | **HOLD** | CDC-ECM 已注册，TCP/TLS 待验证 |
| Agent 阶段 | **HOLD** | LLM 对话、工具注册、多步闭环待实现 |

## 九、HOLD 项目（后续阶段）

1. 真机四页触摸交互验收（HOLD：系统已验证，交互待完成）
2. 真实 IMU 传感器训练校准
3. 网络/TLS 通信集成
4. AI Agent 对话教练与多步工具协作
5. 新增 C 外设驱动
6. openvela 官方准入测试

> 这些项目属于加分项或后续阶段，**不能被写成初赛必做阻塞项**。
