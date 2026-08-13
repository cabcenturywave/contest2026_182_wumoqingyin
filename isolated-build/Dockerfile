# =============================================================================
# OpenVela Huangshan Pi Isolated Build Environment
# =============================================================================
# Security model:
#   - Build stage: network access allowed for apt (no runtime downloads)
#   - Runtime: network disabled (--network=none)
#   - No exposed ports
#   - No privileged mode
#   - No Docker socket mount
#   - Source tree mounted read-only
#   - All build artifacts go to writable overlay inside container
#   - Toolchain and build tools baked into image
# =============================================================================

FROM ubuntu:22.04 AS builder

ENV DEBIAN_FRONTEND=noninteractive

# Install minimal build dependencies (no networking required at build time)
RUN apt-get update && apt-get install -y --no-install-recommends \
    cmake \
    ninja-build \
    make \
    gcc \
    g++ \
    python3 \
    python3-pip \
    pkg-config \
    libncurses-dev \
    kmod \
    cpio \
    bc \
    flex \
    bison \
    libssl-dev \
    libffi-dev \
    git \
    && rm -rf /var/lib/apt/lists/*

# ---- Copy prebuilt ARM toolchain (host-linux-x86_64) ----
COPY prebuilts/gcc/linux-x86_64/arm-none-eabi /opt/toolchain/arm-none-eabi

# ---- Copy build tools (genromfs, ninja, kconfig, ccache, etc.) ----
COPY prebuilts/build-tools/linux-x86_64/bin /opt/build-tools

# ---- Copy CMake custom module ----
COPY build/cmake /opt/openvela-cmake

# Add toolchain and build tools to PATH
ENV PATH="/opt/toolchain/arm-none-eabi/bin:/opt/build-tools:${PATH}"

# Verify toolchain is accessible
RUN arm-none-eabi-gcc --version && ninja --version && genromfs -h

# ---- Create non-root build user ----
RUN groupadd -g 1000 builder && useradd -m -u 1000 -g builder builder

# ---- Workspace layout ----
# /openvela/src      -> read-only mount of source tree
# /openvela/build    -> writable build output (CMAKE_BINARY_DIR)
# /openvela/cache    -> writable ccache/sccache directory
# /openvela/artifacts -> writable final artifacts (bin, images)
RUN mkdir -p /openvela/src /openvela/build /openvela/cache /openvela/artifacts \
    && chown -R builder:builder /openvela

WORKDIR /openvela/src

# Default: drop to non-root
USER builder

# No ENTRYPOINT — the run script invokes cmake/ninja explicitly
CMD ["/bin/bash"]
