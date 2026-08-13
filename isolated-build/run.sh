#!/usr/bin/env bash
# =============================================================================
# OpenVela Huangshan Pi — Isolated Build Runner
# =============================================================================
# Usage:
#   ./run.sh [build|configure|shell|clean|image]
#
# Commands:
#   image     — Build the Docker image (toolchain + build tools baked in)
#   build     — Run isolated CMake + Ninja build for lckfb_huangshan_pi/nsh
#   configure — Create/update build-output and run CMake configure only
#   shell     — Drop into interactive shell inside the isolated container
#   clean     — Remove build artifacts and image
#
# Security guarantees:
#   --network=none          No network access
#   --read-only             Root filesystem read-only
#   --security-opt=no-new-privileges:true  Cannot gain new privileges
#   --cap-drop=ALL          All Linux capabilities dropped
#   -v SRC:RO               Source tree mounted read-only
#   No -p / --publish       No ports exposed
#   No --privileged         Not privileged
#   No -v /var/run/docker.sock   No Docker socket
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

IMAGE_NAME="openvela-huangshan-build"
CONTAINER_NAME="openvela-huangshan-build"

# ---- Board configuration (verified Huangshan Pi parameters) ----
BOARD_CONFIG_REL="vendor/sifli/boards/sf32lb52/lckfb_huangshan_pi/configs/nsh"
CMAKE_GENERATOR="Ninja"
EXTRA_FLAGS="-Wno-cpp -Wno-deprecated-declarations"
CUSTOM_MODULE_PATH="/opt/openvela-cmake"

# ---- Paths inside the container ----
SRC_MOUNT="/openvela/src"
BUILD_DIR="/openvela/build"
CACHE_DIR="/openvela/cache"
ARTIFACTS_DIR="/openvela/artifacts"

# ---- Host-side output directories ----
HOST_BUILD_DIR="${SCRIPT_DIR}/build-output"
HOST_CACHE_DIR="${SCRIPT_DIR}/cache"
HOST_ARTIFACTS_DIR="${SCRIPT_DIR}/artifacts"

# ---- Helper: Docker security flags (shared by all commands) ----
SECURITY_FLAGS=(
    --network=none
    --read-only
    --cap-drop=ALL
    --security-opt=no-new-privileges:true
    --tmpfs /tmp:rw,noexec,nosuid,size=256m
    --tmpfs /run:rw,noexec,nosuid,size=64m
    -v "${REPO_ROOT}:${SRC_MOUNT}:ro"
    -v "${HOST_BUILD_DIR}:${BUILD_DIR}"
    -v "${HOST_CACHE_DIR}:${CACHE_DIR}"
    -v "${HOST_ARTIFACTS_DIR}:${ARTIFACTS_DIR}"
)

# ---- Commands ----

cmd_image() {
    echo "==> Building Docker image: ${IMAGE_NAME}"
    docker build \
        -t "${IMAGE_NAME}" \
        -f "${SCRIPT_DIR}/Dockerfile" \
        "${REPO_ROOT}"
    echo "==> Image built successfully"
}

cmd_build() {
    echo "==> Starting isolated Huangshan Pi build"
    echo "    Source (read-only):  ${REPO_ROOT}"
    echo "    Build output:        ${HOST_BUILD_DIR}"
    echo "    Cache:               ${HOST_CACHE_DIR}"
    echo "    Artifacts:           ${HOST_ARTIFACTS_DIR}"
    echo ""

    # Ensure host output dirs exist
    mkdir -p "${HOST_BUILD_DIR}" "${HOST_CACHE_DIR}" "${HOST_ARTIFACTS_DIR}"

    # CMake configure + build in one container run
    docker run --rm \
        --name "${CONTAINER_NAME}" \
        "${SECURITY_FLAGS[@]}" \
        "${IMAGE_NAME}" \
        bash -c "
            set -euo pipefail
            echo '--- CMake Configure ---'
            cmake \
                -B ${BUILD_DIR} \
                -S ${SRC_MOUNT}/nuttx \
                -DBOARD_CONFIG=${SRC_MOUNT}/${BOARD_CONFIG_REL} \
                -DCUSTOM_MODULE_PATH=${CUSTOM_MODULE_PATH} \
                -DCMAKE_C_COMPILER_LAUNCHER=ccache \
                -DCMAKE_CXX_COMPILER_LAUNCHER=ccache \
                -DEXTRA_FLAGS=\"${EXTRA_FLAGS}\" \
                -G${CMAKE_GENERATOR}

            echo '--- Ninja Build ---'
            cd ${BUILD_DIR}
            ninja -j\$(nproc)

            echo '--- Copy artifacts ---'
            cp -a ${BUILD_DIR}/nuttx.bin ${ARTIFACTS_DIR}/ 2>/dev/null || true
            cp -a ${BUILD_DIR}/nuttx ${ARTIFACTS_DIR}/ 2>/dev/null || true
            cp -a ${BUILD_DIR}/nuttx.manifest ${ARTIFACTS_DIR}/ 2>/dev/null || true
            cp -a ${BUILD_DIR}/compile_commands.json ${ARTIFACTS_DIR}/ 2>/dev/null || true
            echo '==> Build complete'
        "
}

cmd_configure() {
    echo "==> Starting isolated Huangshan Pi configure"
    echo "    Source (read-only):  ${REPO_ROOT}"
    echo "    Build output:        ${HOST_BUILD_DIR}"
    echo "    Cache:               ${HOST_CACHE_DIR}"
    echo ""

    mkdir -p "${HOST_BUILD_DIR}" "${HOST_CACHE_DIR}"

    docker run --rm \
        --name "${CONTAINER_NAME}-configure" \
        "${SECURITY_FLAGS[@]}" \
        "${IMAGE_NAME}" \
        bash -c "
            set -euo pipefail
            echo '--- CMake Configure ---'
            cmake \
                -B ${BUILD_DIR} \
                -S ${SRC_MOUNT}/nuttx \
                -DBOARD_CONFIG=${SRC_MOUNT}/${BOARD_CONFIG_REL} \
                -DCUSTOM_MODULE_PATH=${CUSTOM_MODULE_PATH} \
                -DCMAKE_C_COMPILER_LAUNCHER=ccache \
                -DCMAKE_CXX_COMPILER_LAUNCHER=ccache \
                -DEXTRA_FLAGS=\"${EXTRA_FLAGS}\" \
                -G${CMAKE_GENERATOR}
            echo '==> Configure complete'
        "
}

cmd_shell() {
    echo "==> Dropping into isolated shell"
    mkdir -p "${HOST_BUILD_DIR}" "${HOST_CACHE_DIR}" "${HOST_ARTIFACTS_DIR}"

    docker run -it --rm \
        --name "${CONTAINER_NAME}-shell" \
        "${SECURITY_FLAGS[@]}" \
        "${IMAGE_NAME}" \
        /bin/bash
}

cmd_clean() {
    echo "==> Cleaning build artifacts"
    rm -rf "${HOST_BUILD_DIR}" "${HOST_CACHE_DIR}" "${HOST_ARTIFACTS_DIR}"
    echo "==> Removing Docker image"
    docker rmi -f "${IMAGE_NAME}" 2>/dev/null || true
    echo "==> Clean complete"
}

# ---- Main ----
case "${1:-build}" in
    image)      cmd_image ;;
    build)      cmd_build ;;
    configure)  cmd_configure ;;
    shell)      cmd_shell ;;
    clean)      cmd_clean ;;
    *)
        echo "Usage: $0 {image|build|configure|shell|clean}"
        exit 1
        ;;
esac
