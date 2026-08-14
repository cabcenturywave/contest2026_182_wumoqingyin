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

## 真实 IMU C Tool 构建候选（2026-08-14）

- `app/imu_tool` 已通过 `fopen("/dev/lsm6dsl0")`、`SNIOC_START`、`SNIOC_LSM6DSLSENSORREAD` 与 `SNIOC_STOP` 接入现有 LSM6DSL 驱动 ABI。
- host stub 在 `-Wall -Wextra -Werror -std=c11` 下编译并通过断言，所有硬件操作保持 `-ENOSYS`。
- 黄山派 ARM/NuttX 静态库编译和完整 initial/first/second/final 四阶段链接通过；`nm` 确认 `imu_tool_init`、`imu_tool_read_raw`、`imu_tool_start_stream` 与 `imu_tool_main` 进入 `final_nuttx`。
- 真机候选 `nuttx.bin` 大小为 6,829,744 bytes，SHA-256 为 `bfbc5a71e6092cd6d32ab15612f9124180260011a84aa9bbf3a0fb255d8e3181`；final link Flash 40.71%，SRAM 41.82%。传输到 gxmo 后再次核对大小与 SHA-256，再使用 `sftool --verify` 写入既定 `0x12010000` 地址，写后校验成功。
- 受控复位后捕获 `SFBL`、`NuttShell (NSH)`；`uname -a` 返回 NuttX/arm/nsh，且 `/dev/lsm6dsl0` 存在。
- 在 NSH 执行有界命令 `imu_tool 10`，成功采集 10 个真实原始 IMU 样本；加速度、陀螺仪、温度与时间戳均有实际输出，并生成 10 样本平均值摘要。
- 命令结束时确认执行 `stop_stream` 与 `deinit`，输出 `Done` 后返回 NSH；没有遗留无限采样任务。
- 本次只验收 C Tool 的真实原始采样与有界清理。拳型分类仍未校准，事件计数保持 0，`imu_tool_read_event` 仍返回 `-ENODATA`；不得声称已完成拳型识别、训练校准或 Agent 工具注册。

## CDC-ECM 板端网络候选（2026-08-14）

- 当前真机基线只注册了 loopback；`ifconfig` 无物理网络设备，`route` 为空，不能作为 TCP/IP、TLS 或外网证据。
- 只读审计确认 SF32LB52 原生 USB device 控制器与 NuttX CDC-ECM 类可复用现有 EP1 bulk IN、EP2 bulk OUT、EP3 interrupt IN；UART1/CH340 NSH 控制台与原生 USB 类相互独立。
- `patches/0002-huangshan-pi-enable-cdc-ecm-network.patch` 用 CDC-ECM 替换未被 gxmo 枚举的 CDCACM，并在 board bring-up 显式调用 `cdcecm_initialize(0, NULL)`。
- 独立构建目录 `cmake_out/lckfb_huangshan_pi_cdcecm` 完成 initial/first/second/final 四阶段链接；`nuttx.bin` 大小 6,831,776 bytes，SHA-256 为 `59f7ce5555fc0baa08397d354adef0512d91ceb790a8b94f668a3d0a3abbc6a7`；final link Flash 40.72%，SRAM 41.77%。
- 传输后重新核对大小与 SHA-256，使用 `sftool --verify` 写入既定 `0x12010000` 地址，写后校验成功。
- 真机启动后 `ifconfig` 出现非 loopback `eth0`，MAC 为板级默认值，地址为 NuttX CDC-ECM 默认 `10.0.0.2/24`；CombatSense 进程继续运行，`imu_tool 3` 回归采样与清理通过。
- gxmo 同期仍只枚举 CH340，没有发现 CDC-ECM USB 设备或新增主机网卡。这证明板端网络类已注册，但不证明 USB 物理数据链路、主机到板 TCP、DNS、TLS 或外网可用。
- SiFli 官方黄山派管脚资料确认 30P 排针第 13 脚为 PA36/USB_DM、第 15 脚为 PA35/USB_DP，且提供 USB VBUS 与 GND；这给出了可验证的原生 USB 外接路径。下一步需要在断电状态下使用合适的 USB breakout/扩展板连接 D-/D+/GND（供电方式需先确认，避免双电源回灌），再执行主机枚举、双向 TCP 与 TLS 验收。参考：`https://wiki.sifli.com/board/sf32lb52x/SF32LB52-%E9%BB%84%E5%B1%B1%E6%B4%BE.html`。
