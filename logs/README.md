# logs/ — OpenCode / MiMo AI Coding 日志

本目录已放置本作品开发过程中真实导出的 OpenCode 对话日志，并与作品代码一并提交。它不是示例目录。

## 本次提交快照

| 项目 | 值 |
|---|---|
| GitHub 登录名 | `cabcenturywave` |
| 工具 | OpenCode |
| 模型证据 | `MiMo-v2.5`、`MiMo-v2.5-pro`（以每条事件的 `model` 字段为准） |
| JSONL 会话文件 | 22 个 |
| 事件总数 | 1618 条 |
| 会话清单 | `cabcenturywave/manifest.json` |
| 生成器 | `opencode-collector@1.3.0` |
| 官方 validator | 全部通过 |

官方导出的 JSONL 没有 token 用量字段，因此仓库和报告均不虚构 token 总数；评审可用会话数、事件数和原始 JSONL 复核实际协作规模。

## 目录结构

```text
logs/
└── <github_login>/              # 你的 GitHub 用户名，一人一目录
    ├── manifest.json            # 会话清单
    └── <date>/                  # 日期 YYYY-MM-DD
        └── <tool>__<sid>.jsonl  # 一个会话一个文件（工具名与 session id 用 __ 连接）
```

- `<tool>`：本作品为 `opencode`
- 每个 `.jsonl` 每行一个事件，由组委会提供的日志归集工具导出；不要手动改写事件正文。
- 提交前运行 `node scripts/security-scan.js --history`，只输出风险类别与文件位置，不输出命中的敏感值。

导出与提交的完整步骤、字段定义见[《AI Coding 日志归集与提交手册》](https://github.com/open-vela/docs/blob/dev-ai-contest-2026/zh-cn/contest_2026/ai_coding_log_guide.md)。
