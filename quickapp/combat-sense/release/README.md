# Release RPK

本目录用于放置最终的生产模式 release.rpk 文件。

## 放置位置

将通过 AIoT-IDE 受控签名流程生成的 `release.rpk` 文件放置于此目录：

```
quickapp/combat-sense/release/
└── com.openvela.combatsense.release.1.0.0.rpk
```

## 校验方式

使用项目根目录的验证脚本校验 release.rpk：

```bash
cd quickapp/combat-sense
node scripts/verify-release.js
```

或通过 npm 脚本：

```bash
cd quickapp/combat-sense
npm run verify:release
```

### 校验内容

1. `release/` 目录下恰好存在一个 `.rpk` 文件
2. 文件为有效 ZIP 格式
3. ZIP 内包含 `manifest.json`
4. 包名为 `com.openvela.combatsense`
5. `versionName` 为 `1.0.0`

## 安全声明

- **生产签名私钥绝不提交**至本仓库
- `.gitignore` 已配置忽略 `/sign` 目录及常见证书/私钥文件扩展名
- release.rpk 由 AIoT-IDE 在受控环境中签名生成
- 本地调试使用的 debug RPK 不放置于此目录
