# CombatSense Edge — IMU Tool

NuttX/openvela C tool skeleton for boxing IMU training summary.

## Overview

This tool provides a minimal C interface for IMU sensor data collection and summary computation in the CombatSense Edge quickapp ecosystem. It is designed to be registered as an AI agent tool on NuttX/openvela.

## Current Status

**Stub — hardware not connected.** All sensor-reading APIs return `-ENOSYS` (function not implemented). No fake data is generated. This is intentional to satisfy contest requirements: the tool must clearly indicate hardware unavailability.

## API

| Function | Return | Description |
|---|---|---|
| `imu_tool_init()` | `-ENOSYS` | Initialize tool; stub returns ENOSYS |
| `imu_tool_start_stream()` | `-ENOSYS` | Start IMU data stream; no sensor available |
| `imu_tool_stop_stream()` | `0` | Stop data stream |
| `imu_tool_read_event(event_out)` | `-ENOSYS` | Read punch event; no sensor available |
| `imu_tool_get_summary(summary_out)` | `0` | Get session summary (all zeros) |
| `imu_tool_reset_summary()` | `void` | Reset summary counters |
| `imu_tool_get_state()` | state enum | Get current tool state |
| `imu_tool_deinit()` | `void` | Cleanup |

## Build

### NuttX target

Enable in menuconfig:

```
CONFIG_LVX_USE_CONTEST2026_182_IMU_TOOL=y
```

### Host verification (syntax check)

```bash
gcc -DIMU_TOOL_HOST_STUB -o imu_tool_stub imu_tool_main.c -lm
./imu_tool_stub
```

## Data Structures

- `struct imu_punch_event` — single punch event (timestamp, type, hand, confidence)
- `struct imu_session_summary` — training session aggregate (counts, ratios, fatigue)

Both align with QuickApp `data-interface.js` and `demoSession` fields.

## Files

- `imu_tool_main.c` — implementation + host stub main
- `Makefile` — NuttX build
- `CMakeLists.txt` — NuttX CMake build
- `Kconfig` — NuttX menuconfig entry
