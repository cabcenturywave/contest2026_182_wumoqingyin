# CombatSense Edge — IMU Tool CMakeLists.txt (NuttX)

if(CONFIG_LVX_USE_CONTEST2026_182_IMU_TOOL)
  nuttx_add_application(
    NAME imu_tool
    SRCS imu_tool_main.c
    STACKSIZE 4096)
endif()
