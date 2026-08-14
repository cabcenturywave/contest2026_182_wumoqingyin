# CombatSense Edge — IMU Tool

NuttX/openvela C tool for boxing IMU training data collection and summary.

## Overview

Reads real accelerometer + gyroscope data from `/dev/lsm6dsl0` (LSM6DSL I2C
sensor) on NuttX/openvela targets.  Provides both a low-level raw-sample
interface (`imu_tool_read_raw`) and a higher-level punch-event interface
(`imu_tool_read_event`).  Punch classification is **not yet implemented**;
`read_event` returns `-ENODATA` honestly rather than fabricating events.

Host builds compile with `-DIMU_TOOL_HOST_STUB` and return `-ENOSYS` for all
hardware operations — no fake data is generated.

## Current Status

| Layer | Status | Notes |
|-------|--------|-------|
| NuttX sensor open / start / stop / close | **Device verified** | `imu_tool 10` opened, started, stopped and closed the real device on Huangshan Pi |
| Raw IMU sample read (`imu_tool_read_raw`) | **Device verified** | Ten bounded real samples and their aggregate summary were captured on-device |
| Punch event classification | **Not implemented** | Returns `-ENODATA` — no classification algorithm yet |
| Host stub verification | **Verified** | Assertion-based; all hw ops → `-ENOSYS`; state stays UNINIT |
| Real-device validation | **Raw sampling verified** | Flash verify, NuttX boot, device node, 10 samples and bounded cleanup passed |

> **Note:** Raw-sample ioctl behavior is verified on Huangshan Pi. Punch
> classification and Agent tool registration remain unverified.

## API

| Function | NuttX | Host Stub | Description |
|---|---|---|---|
| `imu_tool_init()` | 0 / errno | `-ENOSYS` | Open `/dev/lsm6dsl0` |
| `imu_tool_start_stream()` | 0 / errno | `-ENOSYS` | `SNIOC_START` |
| `imu_tool_stop_stream()` | 0 / `-ENOTCONN` | `-ENOSYS` | `SNIOC_STOP` |
| `imu_tool_read_raw(sample_out)` | 0 / errno | `-ENOSYS` | `SNIOC_LSM6DSLSENSORREAD` |
| `imu_tool_read_event(event_out)` | `-ENODATA` | `-ENOSYS` | Punch classification (unimplemented) |
| `imu_tool_get_summary(summary_out)` | 0 | 0 | Session counters (all zeros) |
| `imu_tool_reset_summary()` | void | void | Reset counters |
| `imu_tool_get_state()` | enum | enum | Current state machine state |
| `imu_tool_deinit()` | void | void | Stop stream + `fclose` |

## Data Structures

- `struct imu_raw_sample` — raw accel/gyro/temperature/timestamp (mirrors `lsm6dsl_sensor_data_s`)
- `struct imu_punch_event` — punch event (timestamp, type, hand, confidence)
- `struct imu_session_summary` — session aggregate (counts, ratios, fatigue)

All aligned with QuickApp `data-interface.js` and `demoSession` fields.

## Build

### NuttX target (raw sampling device verified)

Enable in menuconfig:

```
CONFIG_SENSORS_LSM6DSL=y
CONFIG_LVX_USE_CONTEST2026_182_IMU_TOOL=y
```

> **Warning:** This has been executed on Huangshan Pi for bounded raw sampling
> only. It is not evidence of calibrated punch classification.

### Host verification (syntax + stub check)

```bash
gcc -Wall -Wextra -Werror -std=c11 \
    -DIMU_TOOL_HOST_STUB \
    -o imu_tool_stub imu_tool_main.c -lm
./imu_tool_stub
```

### Real-device verification

```bash
# After flashing with CONFIG_SENSORS_LSM6DSL=y and
# CONFIG_LVX_USE_CONTEST2026_182_IMU_TOOL=y:
imu_tool 50        # read 50 raw samples, print summary
```

> **Status:** `imu_tool 10` passed on 2026-08-14: ten raw samples, summary,
> stream stop, device close, and return to NSH were observed. Classification
> remains intentionally unavailable until calibration.

## Files

- `imu_tool_main.c` — full implementation (NuttX + host stub + CLI main)
- `Makefile` — NuttX Make build
- `CMakeLists.txt` — NuttX CMake build
- `Kconfig` — NuttX menuconfig (depends on `SENSORS_LSM6DSL`)
- `Make.defs` — build-system include guard
