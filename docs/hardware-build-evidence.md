# Huangshan Pi 真机与构建证据（2026-08-14）

## 原固件基线与恢复备份

- 连接主机：B 家 gxmo（不记录地址或凭据）
- 串口：CH340 `/dev/ttyUSB0`，1,000,000 baud
- 复位：遵循板级文档，以 RTS 低有效控制 SF32LB52 reset
- 捕获到 `SFBL`、SiFli boot banner、`msh />`
- 原固件：RT-Thread 风格固件，不是 openvela/NuttX
- 启动日志显示 LSM6DSL 加速度计、陀螺仪初始化成功
- `list_device` 显示 `acce_lsm`、`gyro_lsm`、`step_lsm`

为避免泄露主机信息，本仓只记录必要的串口事实，不提交 SSH、网络地址或认证数据。

使用 OpenSiFli 官方 `sftool` 0.2.5 从 `0x12000000` 连续读取完整 16 MiB NOR 两次。两份文件均为 16,777,216 bytes，SHA-256 均为
`7093e316de6de8ba44fc9f160ea07eaef71e2d5950272589dea42ef30a69a507`，并通过逐字节比较。备份只保存在 gxmo，不提交二进制固件。

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
- 最终真机候选 `nuttx.bin` 大小：6,827,876 bytes
- 最终真机候选 SHA-256：`18be032aad6390c09c987b856ad5f1190b38b3f0f1f24d726d518105ad138209`
- final link：Flash 6,827,876 / 16 MiB（40.70%）；SRAM 219,128 / 512 KiB（41.80%）
- 候选包含 `/etc/data/app/com.openvela.combatsense`，并由 `rcS` 默认启动该包

## openvela 与 CombatSense 真机结果

- 使用 `sftool --verify` 将最终候选写入 `0x12010000`，写后校验成功
- 受控复位后捕获 `SFBL`、`NuttShell (NSH)`；`uname -a` 返回 NuttX/arm/nsh
- `/dev` 枚举 `lcd0`、`fb0`、`input0`、`lsm6dsl0`、`gpio0..2`、`timer0`、`rtc0`、`buttons` 等设备
- LCD 与触摸驱动成功打开；`ps` 显示 `vapp hap://app/com.openvela.combatsense` 为运行中的 PID 8
- `lsm6dsl_reader` 在 CombatSense 运行期间连续返回非零加速度、陀螺仪与温度样本，证明 NuttX 驱动可读取真实 IMU
- 尚未完成人工触摸操作的四页逐项验收，也未完成真实 IMU 训练校准；这些项目不能由启动和进程证据替代

真机候选的可复现集成方式：将 debug RPK 解压到板级
`src/etc/data/app/com.openvela.combatsense/`，并将板级 `etc/init.d/rcS` 的默认 URI 改为
`hap://app/com.openvela.combatsense`。重新运行 CMake configure 以刷新 `GLOB_RECURSE`，再构建镜像。直接在默认 Lyra 已运行时启动第二个 `vapp` 会争用单实例 LVGL；因此最终候选在启动期只运行 CombatSense。
