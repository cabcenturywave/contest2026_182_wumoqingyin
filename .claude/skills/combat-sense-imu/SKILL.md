---
name: combat-sense-imu
description: Implement, calibrate, or validate IMU sensor integration for CombatSense Edge. Use for accelerometer data pipeline, peak detection tuning, gravity estimation, hardware mode switching, and real-device IMU calibration workflows.
---

# CombatSense Edge — IMU Sensor Integration

This skill governs all work related to real IMU hardware integration in the CombatSense Edge project.

## Scope

- `quickapp/combat-sense/src/common/data-interface.js` — hardware mode accelerometer pipeline
- `app/imu_tool/` — C-side IMU data processing tool (skeleton, hardware-pending)
- Hardware parameter calibration and tuning
- Sensor probing, subscription, and peak detection state machine

## Workflow

1. **Never fabricate IMU data or hardware verification results.** All hardware-mode parameters are INITIAL ESTIMATES unless explicitly calibrated on a real device.
2. Read `data-interface.js` before modifying the accelerometer pipeline. The peak detection state machine (IDLE→RISING→HOLDING→COOLDOWN) is the core detection logic.
3. When tuning parameters (`GRAVITY_EMA_ALPHA`, `PUNCH_LINEAR_THRESHOLD`, `COOLDOWN_MS`, `PEAK_HOLDBACK_MS`, `CONFIDENCE_SCALE`), always document the calibration source and device used.
4. Hardware mode switch: call `setMode('hardware')` after confirming `probeSensor()` succeeds. Never bypass the probe gate.
5. The C tool skeleton (`app/imu_tool/`) is a scaffold for future NuttX-side IMU processing. Do not claim it is functional until real hardware integration is complete.
6. Run the smoke test after any parameter or pipeline change:
   ```bash
   cd quickapp/combat-sense && npm test
   ```

## Calibration Protocol (for real hardware)

When real hardware becomes available:
1. Wear the device statically for 10 seconds to establish gravity baseline.
2. Throw 20 jabs, 20 crosses, 20 hooks at varying intensities.
3. Record peak linear acceleration values for each punch type.
4. Adjust `PUNCH_LINEAR_THRESHOLD` to separate signal from noise.
5. Adjust `GRAVITY_EMA_ALPHA` to balance responsiveness vs. stability.
6. Set `COOLDOWN_MS` to minimum inter-punch interval observed.
7. Update `CONFIDENCE_SCALE` to map observed peaks to 0.3–0.95 confidence range.

## Guardrails

- Never claim real-device IMU verification unless a real device was used and results are logged.
- Never hardcode IMU sensor values as if they are calibrated real-device data.
- Always preserve the `INITIAL ESTIMATES` / `MUST be recalibrated` documentation in `data-interface.js`.
- Do not modify the UI layer (`pages/`) when working on IMU integration — only `data-interface.js` and `imu_tool/`.
