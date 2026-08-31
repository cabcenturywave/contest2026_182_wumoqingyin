# CombatSense Edge — 初赛仓库与官网提交矩阵

## 一、作品概要

- **作品名称**：CombatSense Edge
- **选题方向**：快应用 / 手表应用创新
- **队伍名称**：wumoqingyin（队伍编号 182）
- **版本**：1.0.0（初赛最终提交）
- **官方专属仓库**：https://github.com/open-vela/contest2026_182_wumoqingyin
- **选手分支**：`cabcenturywave:feat/beta1`
- **代码映射**：通过 manifest linkfile 映射到 openvela 编译树

## 二、初赛必交清单

| 项目 | 状态 | 位置/说明 |
|---|---|---|
| 完整源码 | **VERIFIED** | `quickapp/combat-sense/src/`，含 manifest、4 页面、data-interface、demo-data |
| 生产模式 release.rpk | **VERIFIED** | `quickapp/combat-sense/release/com.openvela.combatsense.release.1.0.0.rpk`（27,973 bytes） |
| 官方模板技术报告 | **VERIFIED** | `submission/CombatSense-Edge-官方作品提交报告.docx/.pdf`（7 页，摘要 290 字） |
| 演示视频（≤5 分钟） | **VERIFIED** | `submission/CombatSense-Edge-demo.mp4`（47s，1280x720，H.264） |
| OpenCode / MiMo 对话日志 | **VERIFIED** | `logs/cabcenturywave/`，22 个会话 / 1618 条事件 |
| 至少一个 Skill | **VERIFIED** | `.claude/skills/`，共 3 个 Skill |
| 官网上传 ZIP | **READY** | `submission/wumoqingyin-CombatSense-Edge-contest2026_182_wumoqingyin.zip` |
| 专属仓库 URL | **VERIFIED** | 官方仓库地址见上 |
| 飞书作品表单与成功回执 | **PENDING** | 包已就绪；在表单提交成功并出现回执前不得标记完成 |

> 代码、日志、报告、视频和上传包均已生成并可复验；官网表单是独立的最终提交动作，不能以 GitHub PR 代替。

### 官网上传包

| 项目 | 值 |
|---|---|
| 官方表单 | https://mi.feishu.cn/share/base/form/shrcn1gCLxCjCXGwiuQ4TTDrQ7d |
| ZIP 文件名 | `wumoqingyin-CombatSense-Edge-contest2026_182_wumoqingyin.zip` |
| ZIP 大小 | 630,890 bytes |
| ZIP SHA-256 | `627e780ce211b46e432e7323db12d2289d2c0180c3a4ea229a088b06fa764023` |
| ZIP 内容 | 官方模板报告 DOCX、同版 PDF、47 秒演示视频；共 3 个条目 |

表单必填字段为队伍名称、作品名称、仓库链接、队长姓名、联系电话和作品介绍 ZIP。姓名与电话只进入官方表单，不写入仓库、报告、视频或 ZIP；成功回执是最终完成证据。

## 三、模拟器验证（初赛合规闭环）

初赛允许仅使用官方 VelaSim 验证，真机不是合规必需项。

| 项目 | 状态 | 说明 |
|---|---|---|
| RPK 构建 | **VERIFIED** | `npm run build`，aiot-toolkit 2.0.5 |
| VelaSim 安装 | **VERIFIED** | `vela-miwear-watch-5.0` 官方镜像 |
| VelaSim 启动 | **VERIFIED** | `npm run simulator:headless`，Xvfb 无图形 VM |
| 四页交互闭环 | **VERIFIED** | Today → Session → Review → Settings 全流程 |
| Demo 数据驱动 | **VERIFIED** | 40 条可回放动作事件，训练统计完整 |
| 静态契约检查 | **VERIFIED** | `npm test`，120 项 smoke-test 通过 |

## 四、AI Coding 日志与 Skill

| 项目 | 状态 | 位置/说明 |
|---|---|---|
| OpenCode 日志 | **VERIFIED** | `logs/cabcenturywave/`，含 manifest.json |
| AI 模型 | **VERIFIED** | MiMo-v2.5 / MiMo-v2.5-pro（以事件 `model` 字段为准） |
| 日志格式 | **VERIFIED** | `logs/<github_login>/<date>/opencode__*.jsonl` |
| 日志规模 | **VERIFIED** | 22 个 JSONL 会话文件 / 1618 条事件，官方 validator 全部通过 |
| Token 总量 | **N/A** | 官方导出不含 token 用量字段；不虚构数值，以原始事件和会话数供复核 |
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

# 当前文件、归档内嵌条目与全部可达 Git 历史无秘密扫描
node scripts/security-scan.js --history

# RPK 构建
cd quickapp/combat-sense && npm run build

# 模拟器运行
cd quickapp/combat-sense && npm run simulator:headless
```

## 七、许可与安全

- 仓库根目录包含 `LICENSE`（Apache License 2.0）
- `.gitignore` 忽略 `/sign`、证书、私钥目录
- 生产签名私钥**绝不提交**至仓库
- 当前提交的产品设计、源码、文档和演示材料为队伍原创；第三方构建工具与依赖遵循各自许可
- Demo 数据中无真实用户信息或敏感凭据
- 队长姓名和联系电话只提交至官方表单，不进入 Git 历史或公开交付包

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
