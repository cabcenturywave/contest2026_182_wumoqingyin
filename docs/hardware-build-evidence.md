# Huangshan Pi 真机与构建证据（2026-08-14）

## 真机基线

- 连接主机：B 家 gxmo（不记录地址或凭据）
- 串口：CH340 `/dev/ttyUSB0`，1,000,000 baud
- 复位：遵循板级文档，以 RTS 低有效控制 SF32LB52 reset
- 捕获到 `SFBL`、SiFli boot banner、`msh />`
- 当前固件：RT-Thread 风格固件，不是 openvela/NuttX
- 启动日志显示 LSM6DSL 加速度计、陀螺仪初始化成功
- `list_device` 显示 `acce_lsm`、`gyro_lsm`、`step_lsm`

为避免泄露主机信息，本仓只记录必要的串口事实，不提交 SSH、网络地址或认证数据。

## openvela 构建

目标：`vendor/sifli/boards/sf32lb52/lckfb_huangshan_pi/configs/nsh`

阻塞根因是 `ajs_features_registry.cpp` 优先包含了源目录内的静态注册表头，遮蔽了按 Kconfig/JIDL 生成的注册表头，导致未启用 feature 的初始化符号进入链接。修复见 `patches/0001-feature-registry-use-generated-headers.patch`。

验证命令：

```bash
cd /path/to/openvela
git -C frameworks/runtimes/feature apply \
  /path/to/contest2026_182_wumoqingyin/patches/0001-feature-registry-use-generated-headers.patch
source build/envsetup.sh
cmake --build cmake_out/lckfb_huangshan_pi -- -j4
```

结果：

- 完成初始、first、second、final 四阶段链接
- 生成 `nuttx`、`final_nuttx`、`nuttx.bin`、`System.map`
- `nuttx.bin` 大小：6,509,008 bytes
- `nuttx.bin` SHA-256：`52308c600909d3e42a903ea6188fc8e9000b5a966a6bd1e41f55a2a52b7418de`
- final link：Flash 6,509,008 / 16 MiB（38.80%）；SRAM 219,256 / 512 KiB（41.82%）

构建成功不等于真机验收。当前镜像尚未烧录；刷写前必须先确认可恢复的原 RT-Thread 固件备份方案。
