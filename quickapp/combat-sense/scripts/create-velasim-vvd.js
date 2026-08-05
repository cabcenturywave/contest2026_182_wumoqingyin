/*
 * Creates the local VelaSim device used by CombatSense Edge.
 * This intentionally uses the emulator package already installed by aiot-toolkit.
 */
const fs = require('fs');
const path = require('path');
const emulator = require('@aiot-toolkit/emulator');

const name = 'Vela_CombatSense';
const imageType = 'vela-miwear-watch-5.0';
const imageDir = path.join(
  emulator.defaultSDKHome,
  emulator.SDKParts.SYSTEM_IMAGES,
  imageType,
);
const vvdDir = path.join(emulator.defaultVvdHome, `${name}.vvd`);

if (!fs.existsSync(imageDir)) {
  throw new Error(`Simulator system image is missing: ${imageDir}. Run npm run simulator:init first.`);
}

if (fs.existsSync(vvdDir)) {
  console.log(`VelaSim device already exists: ${vvdDir}`);
  process.exit(0);
}

const manager = new emulator.VvdManager({ sdkHome: emulator.defaultSDKHome });
manager.createVvd({
  name,
  arch: emulator.IVvdArchType.arm,
  width: '466',
  height: '466',
  shape: 'circle',
  flavor: 'watch',
  density: '320',
  imageDir,
  imageType,
  customLcdRadius: '233',
});

console.log(`Created VelaSim device: ${vvdDir}`);
