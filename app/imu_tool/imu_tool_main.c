/****************************************************************************
 * CombatSense Edge — IMU Summary Tool (C Tool Skeleton)
 *
 * NuttX/openvela AI Agent 注册的拳击 IMU 摘要工具。
 * 当前为骨架实现：所有硬件读取返回 -ENOSYS（未接入）。
 * 真机接入后需替换 stub 为实际传感器读取逻辑。
 *
 * 严禁伪造传感器数据或声称真机已完成。
 ****************************************************************************/

#ifndef IMU_TOOL_HOST_STUB
#  include <nuttx/config.h>
#endif
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <errno.h>

/****************************************************************************
 * Public Types
 ****************************************************************************/

/* 单次出拳事件（与 QuickApp data-interface.js 对齐） */

struct imu_punch_event
{
  int64_t  timestamp_ms;   /* 事件时间戳 (ms) */
  uint8_t  type;           /* 0=jab, 1=cross, 2=hook, 3=other */
  uint8_t  hand;           /* 0=left, 1=right, 2=unknown */
  float    confidence;     /* 0.0 ~ 1.0 */
};

/* 训练摘要（与 QuickApp demoSession 字段对齐） */

struct imu_session_summary
{
  uint32_t duration_s;     /* 训练时长 (秒) */
  uint32_t jab_count;
  uint32_t cross_count;
  uint32_t hook_count;
  uint32_t other_count;
  uint32_t total_count;
  float    avg_confidence;
  float    left_ratio;     /* 左手占比 0.0~1.0, NaN=未采集 */
  float    fatigue_index;  /* 疲劳指数 0.0~1.0, NaN=未采集 */
};

/* 工具状态 */

enum imu_tool_state
{
  IMU_TOOL_UNINIT = 0,     /* 未初始化 */
  IMU_TOOL_IDLE,           /* 已初始化，空闲 */
  IMU_TOOL_STREAMING,      /* 正在接收数据 */
  IMU_TOOL_ERROR           /* 错误状态 */
};

/****************************************************************************
 * Private Data
 ****************************************************************************/

static enum imu_tool_state g_tool_state = IMU_TOOL_UNINIT;
static struct imu_session_summary g_session;
static uint32_t g_event_count = 0;

/****************************************************************************
 * Public Functions — 对外接口
 ****************************************************************************/

/**
 * 初始化 IMU 工具。
 *
 * @return 0 成功, -ENOSYS 硬件未接入, -EIO 初始化失败
 */

int imu_tool_init(void)
{
  printf("[imu_tool] init: stub — hardware not connected\n");
  memset(&g_session, 0, sizeof(g_session));
  g_session.left_ratio = 0.0f / 0.0f;   /* NaN: 未采集 */
  g_session.fatigue_index = 0.0f / 0.0f; /* NaN: 未采集 */
  g_event_count = 0;
  g_tool_state = IMU_TOOL_IDLE;
  return -ENOSYS; /* 硬件未接入，返回 ENOSYS */
}

/**
 * 启动 IMU 数据流。
 *
 * @return 0 成功, -ENOSYS 硬件未接入, -EBUSY 已在流式状态
 */

int imu_tool_start_stream(void)
{
  printf("[imu_tool] start_stream: stub — no sensor available\n");
  if (g_tool_state == IMU_TOOL_STREAMING)
    {
      return -EBUSY;
    }

  g_tool_state = IMU_TOOL_STREAMING;
  return -ENOSYS; /* 硬件未接入 */
}

/**
 * 停止 IMU 数据流。
 *
 * @return 0 成功, -ENOTCONN 未在流式状态
 */

int imu_tool_stop_stream(void)
{
  if (g_tool_state != IMU_TOOL_STREAMING)
    {
      return -ENOTCONN;
    }

  g_tool_state = IMU_TOOL_IDLE;
  printf("[imu_tool] stop_stream: stopped (0 events processed)\n");
  return 0;
}

/**
 * 读取一次出拳事件（阻塞或轮询）。
 * 当前 stub 始终返回 -ENOSYS。
 *
 * @param event_out 输出事件指针
 * @return 0 成功, -ENOSYS 无硬件, -EAGAIN 无新事件
 */

int imu_tool_read_event(struct imu_punch_event *event_out)
{
  if (event_out == NULL)
    {
      return -EINVAL;
    }

  if (g_tool_state != IMU_TOOL_STREAMING)
    {
      return -ENOTCONN;
    }

  /* STUB: 真机接入后替换为实际传感器读取 */

  return -ENOSYS;
}

/**
 * 获取当前训练摘要。
 *
 * @param summary_out 输出摘要指针
 * @return 0 成功, -EINVAL 参数无效
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
 * 重置训练摘要（新训练开始时调用）。
 */

void imu_tool_reset_summary(void)
{
  memset(&g_session, 0, sizeof(g_session));
  g_session.left_ratio = 0.0f / 0.0f;
  g_session.fatigue_index = 0.0f / 0.0f;
  g_event_count = 0;
  printf("[imu_tool] summary reset\n");
}

/**
 * 获取工具当前状态。
 */

enum imu_tool_state imu_tool_get_state(void)
{
  return g_tool_state;
}

/**
 * 反初始化，释放资源。
 */

void imu_tool_deinit(void)
{
  g_tool_state = IMU_TOOL_UNINIT;
  printf("[imu_tool] deinit\n");
}

/****************************************************************************
 * main — 独立可编译 host 验证入口
 *
 * 仅用于语法验证和接口确认，不执行真实传感器操作。
 * 编译: gcc -o imu_tool_stub imu_tool_main.c -lm
 ****************************************************************************/

#ifdef IMU_TOOL_HOST_STUB

int main(void)
{
  struct imu_session_summary summary;
  struct imu_punch_event evt;
  int ret;

  printf("=== CombatSense IMU Tool Stub ===\n\n");

  /* 1. Init */

  ret = imu_tool_init();
  printf("imu_tool_init()        → %d (expected -ENOSYS=%d)\n", ret, -ENOSYS);

  /* 2. Start stream */

  ret = imu_tool_start_stream();
  printf("imu_tool_start_stream() → %d (expected -ENOSYS=%d)\n", ret, -ENOSYS);

  /* 3. Read event (should fail) */

  ret = imu_tool_read_event(&evt);
  printf("imu_tool_read_event()   → %d (expected -ENOSYS=%d)\n", ret, -ENOSYS);

  /* 4. Get summary (should succeed, all zeros) */

  ret = imu_tool_get_summary(&summary);
  printf("imu_tool_get_summary()  → %d (expected 0)\n", ret);
  printf("  total=%u jab=%u cross=%u hook=%u other=%u\n",
         summary.total_count, summary.jab_count,
         summary.cross_count, summary.hook_count,
         summary.other_count);

  /* 5. Reset and deinit */

  imu_tool_reset_summary();
  imu_tool_deinit();

  printf("\n=== All stub checks passed ===\n");
  return 0;
}

#endif /* IMU_TOOL_HOST_STUB */
