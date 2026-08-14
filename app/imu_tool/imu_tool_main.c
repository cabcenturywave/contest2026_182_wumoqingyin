/****************************************************************************
 * CombatSense Edge — IMU Summary Tool
 *
 * NuttX/openvela C tool for boxing IMU training data.
 * Reads real /dev/lsm6dsl0 sensor data on NuttX via LSM6DSL driver ABI:
 *   fopen → SNIOC_START → SNIOC_LSM6DSLSENSORREAD → SNIOC_STOP → fclose.
 *
 * Host stub (IMU_TOOL_HOST_STUB) returns -ENOSYS for all hardware ops.
 * Never fabricates punch events; read_event returns -ENODATA until
 * calibration and classification are implemented.
 *
 * Build (host):  gcc -Wall -Wextra -Werror -std=c11 -DIMU_TOOL_HOST_STUB
 *                -o imu_tool_stub imu_tool_main.c -lm
 * Build (NuttX): via Makefile / CMakeLists.txt with CONFIG_SENSORS_LSM6DSL.
 ****************************************************************************/

#ifndef IMU_TOOL_HOST_STUB
#  include <nuttx/config.h>
#  include <sys/ioctl.h>
#  include <nuttx/sensors/ioctl.h>
#  include <nuttx/sensors/lsm6dsl.h>
#endif

#include <stdint.h>
#include <inttypes.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <errno.h>
#include <math.h>
#include <unistd.h>

/****************************************************************************
 * Public Types
 ****************************************************************************/

/* Single punch event (aligned with QuickApp data-interface.js) */

struct imu_punch_event
{
  int64_t  timestamp_ms;   /* Event timestamp (ms) */
  uint8_t  type;           /* 0=jab, 1=cross, 2=hook, 3=other */
  uint8_t  hand;           /* 0=left, 1=right, 2=unknown */
  float    confidence;     /* 0.0 ~ 1.0 */
};

/* Training session summary (aligned with QuickApp demoSession) */

struct imu_session_summary
{
  uint32_t duration_s;     /* Training duration (seconds) */
  uint32_t jab_count;
  uint32_t cross_count;
  uint32_t hook_count;
  uint32_t other_count;
  uint32_t total_count;
  float    avg_confidence;
  float    left_ratio;     /* Left-hand ratio 0.0~1.0, NaN=not collected */
  float    fatigue_index;  /* Fatigue index 0.0~1.0, NaN=not collected */
};

/* Raw IMU sample from LSM6DSL sensor (mirrors lsm6dsl_sensor_data_s) */

struct imu_raw_sample
{
  int16_t  accel_x;
  int16_t  accel_y;
  int16_t  accel_z;
  int16_t  gyro_x;
  int16_t  gyro_y;
  int16_t  gyro_z;
  uint16_t temperature;
  uint16_t timestamp;
};

/* Tool state machine */

enum imu_tool_state
{
  IMU_TOOL_UNINIT = 0,     /* Not initialized */
  IMU_TOOL_IDLE,           /* Initialized, idle */
  IMU_TOOL_STREAMING,      /* Receiving data */
  IMU_TOOL_ERROR           /* Error state */
};

/****************************************************************************
 * Private Data
 ****************************************************************************/

static enum imu_tool_state g_tool_state = IMU_TOOL_UNINIT;
static struct imu_session_summary g_session;
static uint32_t g_event_count = 0;

#ifndef IMU_TOOL_HOST_STUB
static FILE *g_sensor_fp = NULL;
#endif

/****************************************************************************
 * Private Helpers
 ****************************************************************************/

static void session_initDefaults(void)
{
  memset(&g_session, 0, sizeof(g_session));
  g_session.left_ratio = NAN;
  g_session.fatigue_index = NAN;
  g_event_count = 0;
}

/****************************************************************************
 * Public API — Implementation
 ****************************************************************************/

/**
 * Initialize IMU tool.
 * NuttX: opens /dev/lsm6dsl0; host stub: returns -ENOSYS.
 *
 * @return 0 on success, negative errno on failure.
 */

int imu_tool_init(void)
{
#ifndef IMU_TOOL_HOST_STUB
  if (g_tool_state != IMU_TOOL_UNINIT)
    {
      return -EBUSY;
    }

  g_sensor_fp = fopen("/dev/lsm6dsl0", "r");
  if (g_sensor_fp == NULL)
    {
      return -errno;
    }

  session_initDefaults();
  g_tool_state = IMU_TOOL_IDLE;
  printf("[imu_tool] init: opened /dev/lsm6dsl0\n");
  return 0;
#else
  printf("[imu_tool] init: stub — hardware not connected\n");
  return -ENOSYS;
#endif
}

/**
 * Start IMU data stream.
 * NuttX: issues SNIOC_START ioctl; host stub: returns -ENOSYS.
 * On ioctl failure the device file is closed and state → ERROR.
 *
 * @return 0 on success, negative errno on failure.
 */

int imu_tool_start_stream(void)
{
#ifndef IMU_TOOL_HOST_STUB
  int ret;

  if (g_tool_state == IMU_TOOL_STREAMING)
    {
      return -EBUSY;
    }

  if (g_tool_state != IMU_TOOL_IDLE || g_sensor_fp == NULL)
    {
      return -ENOTCONN;
    }

  ret = ioctl(fileno(g_sensor_fp), SNIOC_START, 0);
  if (ret < 0)
    {
      int err = -errno;
      fclose(g_sensor_fp);
      g_sensor_fp = NULL;
      g_tool_state = IMU_TOOL_ERROR;
      return err;
    }

  g_tool_state = IMU_TOOL_STREAMING;
  printf("[imu_tool] start_stream: started\n");
  return 0;
#else
  printf("[imu_tool] start_stream: stub — no sensor available\n");
  return -ENOSYS;
#endif
}

/**
 * Stop IMU data stream.
 * NuttX: issues SNIOC_STOP ioctl; host stub: state-based.
 *
 * @return 0 on success, -ENOTCONN if not streaming.
 */

int imu_tool_stop_stream(void)
{
#ifndef IMU_TOOL_HOST_STUB
  int ret;

  if (g_tool_state != IMU_TOOL_STREAMING)
    {
      return -ENOTCONN;
    }

  ret = ioctl(fileno(g_sensor_fp), SNIOC_STOP, 0);
  g_tool_state = IMU_TOOL_IDLE;
  printf("[imu_tool] stop_stream: stopped (%" PRIu32
         " events processed)\n",
         g_event_count);
  return ret < 0 ? -errno : 0;
#else
  printf("[imu_tool] stop_stream: stub — no sensor available\n");
  return -ENOSYS;
#endif
}

/**
 * Read a single raw IMU sample from the sensor.
 * NuttX: issues SNIOC_LSM6DSLSENSORREAD ioctl; host stub: -ENOSYS.
 *
 * @param sample_out output sample pointer (must not be NULL).
 * @return 0 on success, negative errno on failure.
 */

int imu_tool_read_raw(struct imu_raw_sample *sample_out)
{
#ifndef IMU_TOOL_HOST_STUB
  struct lsm6dsl_sensor_data_s raw;
  int ret;

  if (sample_out == NULL)
    {
      return -EINVAL;
    }

  if (g_tool_state != IMU_TOOL_STREAMING || g_sensor_fp == NULL)
    {
      return -ENOTCONN;
    }

  ret = ioctl(fileno(g_sensor_fp), SNIOC_LSM6DSLSENSORREAD,
              (unsigned long)&raw);
  if (ret < 0)
    {
      return -errno;
    }

  sample_out->accel_x     = raw.x_data;
  sample_out->accel_y     = raw.y_data;
  sample_out->accel_z     = raw.z_data;
  sample_out->gyro_x      = raw.g_x_data;
  sample_out->gyro_y      = raw.g_y_data;
  sample_out->gyro_z      = raw.g_z_data;
  sample_out->temperature  = raw.temperature;
  sample_out->timestamp    = raw.timestamp;
  return 0;
#else
  if (sample_out == NULL)
    {
      return -EINVAL;
    }

  return -ENOSYS;
#endif
}

/**
 * Read a punch event.
 * Returns -ENODATA because calibration and punch classification are not
 * yet implemented.  This function NEVER fabricates jab/cross/hook events
 * from raw accelerometer/gyroscope data.
 *
 * @param event_out output event pointer.
 * @return 0 on success, -ENODATA if uncalibrated, negative errno on failure.
 */

int imu_tool_read_event(struct imu_punch_event *event_out)
{
#ifndef IMU_TOOL_HOST_STUB
  if (event_out == NULL)
    {
      return -EINVAL;
    }

  if (g_tool_state != IMU_TOOL_STREAMING)
    {
      return -ENOTCONN;
    }

  /* Punch classification requires calibration + algorithm.
   * Return -ENODATA honestly rather than fabricating events. */

  return -ENODATA;
#else
  if (event_out == NULL)
    {
      return -EINVAL;
    }

  return -ENOSYS;
#endif
}

/**
 * Get current training session summary.
 *
 * @param summary_out output summary pointer.
 * @return 0 on success, -EINVAL on NULL pointer.
 */

int imu_tool_get_summary(struct imu_session_summary *summary_out)
{
  if (summary_out == NULL)
    {
      return -EINVAL;
    }

  memcpy(summary_out, &g_session, sizeof(g_session));
  return 0;
}

/**
 * Reset training session summary (call at new training start).
 */

void imu_tool_reset_summary(void)
{
  session_initDefaults();
  printf("[imu_tool] summary reset\n");
}

/**
 * Get current tool state.
 */

enum imu_tool_state imu_tool_get_state(void)
{
  return g_tool_state;
}

/**
 * Deinitialize tool and release all resources.
 * NuttX: stops stream if active, then fclose().
 */

void imu_tool_deinit(void)
{
#ifndef IMU_TOOL_HOST_STUB
  if (g_sensor_fp != NULL)
    {
      if (g_tool_state == IMU_TOOL_STREAMING)
        {
          ioctl(fileno(g_sensor_fp), SNIOC_STOP, 0);
        }

      fclose(g_sensor_fp);
      g_sensor_fp = NULL;
    }
#endif

  g_tool_state = IMU_TOOL_UNINIT;
  printf("[imu_tool] deinit\n");
}

/****************************************************************************
 * main — CLI entry point
 *
 * Host stub: verification tests (all hardware ops → ENOSYS).
 * NuttX target: bounded IMU raw-sample collection with summary output.
 ****************************************************************************/

#ifdef IMU_TOOL_HOST_STUB

int main(void)
{
  struct imu_session_summary summary;
  struct imu_punch_event evt;
  struct imu_raw_sample raw;
  int ret;
  int failures = 0;

#define VERIFY(cond, msg) do { \
    if (!(cond)) { \
      fprintf(stderr, "FAIL: %s\n", msg); \
      failures++; \
    } \
  } while (0)

  printf("=== CombatSense IMU Tool Host Stub ===\n\n");

  /* --- NULL-pointer guard checks first --- */

  ret = imu_tool_read_raw(NULL);
  VERIFY(ret == -EINVAL, "read_raw(NULL) should return -EINVAL");

  ret = imu_tool_read_event(NULL);
  VERIFY(ret == -EINVAL, "read_event(NULL) should return -EINVAL");

  ret = imu_tool_get_summary(NULL);
  VERIFY(ret == -EINVAL, "get_summary(NULL) should return -EINVAL");

  /* --- Init (stub: must fail, state stays UNINIT) --- */

  ret = imu_tool_init();
  VERIFY(ret == -ENOSYS, "init() should return -ENOSYS");
  VERIFY(imu_tool_get_state() == IMU_TOOL_UNINIT,
         "state must remain UNINIT after failed init");

  /* --- Start stream (stub: must fail) --- */

  ret = imu_tool_start_stream();
  VERIFY(ret == -ENOSYS, "start_stream() should return -ENOSYS");
  VERIFY(imu_tool_get_state() == IMU_TOOL_UNINIT,
         "state must remain UNINIT after failed start_stream");

  /* --- Stop stream (stub: must fail, state stays UNINIT) --- */

  ret = imu_tool_stop_stream();
  VERIFY(ret == -ENOSYS, "stop_stream() should return -ENOSYS");
  VERIFY(imu_tool_get_state() == IMU_TOOL_UNINIT,
         "state must remain UNINIT after failed stop_stream");

  /* --- Read raw (stub: must fail) --- */

  ret = imu_tool_read_raw(&raw);
  VERIFY(ret == -ENOSYS, "read_raw() should return -ENOSYS");

  /* --- Read event (stub: must fail, state is UNINIT so -ENOSYS) --- */

  ret = imu_tool_read_event(&evt);
  VERIFY(ret == -ENOSYS, "read_event() should return -ENOSYS");

  /* --- Get summary (should succeed, returns defaults) --- */

  ret = imu_tool_get_summary(&summary);
  VERIFY(ret == 0, "get_summary() should return 0");
  VERIFY(summary.total_count == 0, "summary.total_count must be 0");
  VERIFY(summary.jab_count == 0, "summary.jab_count must be 0");
  VERIFY(summary.cross_count == 0, "summary.cross_count must be 0");
  VERIFY(summary.hook_count == 0, "summary.hook_count must be 0");
  VERIFY(summary.other_count == 0, "summary.other_count must be 0");

  /* --- Reset summary + deinit --- */

  imu_tool_reset_summary();
  imu_tool_deinit();
  VERIFY(imu_tool_get_state() == IMU_TOOL_UNINIT,
         "state must be UNINIT after deinit");

  /* --- Re-init after deinit (must still fail in stub) --- */

  ret = imu_tool_init();
  VERIFY(ret == -ENOSYS, "re-init() should return -ENOSYS");
  VERIFY(imu_tool_get_state() == IMU_TOOL_UNINIT,
         "state must remain UNINIT after re-init failure");
  imu_tool_deinit();

  /* --- Report --- */

  printf("\n");
  if (failures > 0)
    {
      fprintf(stderr, "FAILED: %d assertion(s) failed\n", failures);
      return 1;
    }

  printf("=== All stub checks passed ===\n");
  return 0;
}

#else /* NuttX CLI — bounded sampling with summary */

int main(int argc, char *argv[])
{
  int max_samples = 100;
  int ret;
  int sample_count = 0;
  struct imu_raw_sample sample;
  int64_t sum_ax = 0;
  int64_t sum_ay = 0;
  int64_t sum_az = 0;
  int64_t sum_gx = 0;
  int64_t sum_gy = 0;
  int64_t sum_gz = 0;

  if (argc > 1)
    {
      max_samples = atoi(argv[1]);
      if (max_samples <= 0 || max_samples > 10000)
        {
          max_samples = 100;
        }
    }

  printf("=== CombatSense IMU Tool ===\n");
  printf("Sampling %d raw IMU samples from /dev/lsm6dsl0\n\n", max_samples);

  /* Initialize — open /dev/lsm6dsl0 */

  ret = imu_tool_init();
  if (ret < 0)
    {
      fprintf(stderr, "ERROR: init failed: %d\n", ret);
      return 1;
    }

  /* Start sensor stream */

  ret = imu_tool_start_stream();
  if (ret < 0)
    {
      fprintf(stderr, "ERROR: start_stream failed: %d\n", ret);
      imu_tool_deinit();
      return 1;
    }

  /* Bounded sampling loop */

  for (int i = 0; i < max_samples; i++)
    {
      ret = imu_tool_read_raw(&sample);
      if (ret < 0)
        {
          fprintf(stderr, "WARNING: read_raw failed at sample %d: %d\n",
                  i, ret);
          sleep(1);
          continue;
        }

      sample_count++;
      sum_ax += sample.accel_x;
      sum_ay += sample.accel_y;
      sum_az += sample.accel_z;
      sum_gx += sample.gyro_x;
      sum_gy += sample.gyro_y;
      sum_gz += sample.gyro_z;

      /* Print first 5 and last sample */

      if (i < 5 || i == max_samples - 1)
        {
          printf("  [%4d] accel=(%6d,%6d,%6d) gyro=(%6d,%6d,%6d) "
                 "temp=%u ts=%u\n",
                 i, sample.accel_x, sample.accel_y, sample.accel_z,
                 sample.gyro_x, sample.gyro_y, sample.gyro_z,
                 sample.temperature, sample.timestamp);
        }
      else if (i == 5)
        {
          printf("  ... (skipping middle samples) ...\n");
        }

      sleep(1);
    }

  /* Summary */

  printf("\n--- Summary (%d samples) ---\n", sample_count);
  if (sample_count > 0)
    {
      printf("  Avg accel: (%.1f, %.1f, %.1f)\n",
             (double)sum_ax / sample_count,
             (double)sum_ay / sample_count,
             (double)sum_az / sample_count);
      printf("  Avg gyro:  (%.1f, %.1f, %.1f)\n",
             (double)sum_gx / sample_count,
             (double)sum_gy / sample_count,
             (double)sum_gz / sample_count);
    }

  /* Cleanup — stop stream, close device */

  imu_tool_stop_stream();
  imu_tool_deinit();

  printf("\n=== Done ===\n");
  return 0;
}

#endif /* IMU_TOOL_HOST_STUB */
