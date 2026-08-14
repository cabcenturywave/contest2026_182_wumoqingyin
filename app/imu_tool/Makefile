############################################################################
# CombatSense Edge — IMU Tool Makefile (NuttX)
############################################################################

include $(APPDIR)/Make.defs

PROGNAME  = imu_tool
PRIORITY  = SCHED_PRIORITY_DEFAULT
STACKSIZE = 4096
MODULE    = $(CONFIG_LVX_USE_CONTEST2026_182_IMU_TOOL)

MAINSRC = imu_tool_main.c

include $(APPDIR)/Application.mk
