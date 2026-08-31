#!/usr/bin/env node
/**
 * CombatSense Edge — release.rpk 校验脚本
 *
 * 验证 release/ 目录下的 .rpk 文件：
 * 1. 恰好存在一个 .rpk 文件
 * 2. 文件为有效 ZIP 格式
 * 3. 输出 SHA-256 摘要和文件尺寸
 * 4. ZIP 内包含 manifest.json（支持 store 和 deflate 压缩）
 * 5. 包名为 com.openvela.combatsense
 * 6. versionName 为 1.0.0
 *
 * 仅使用 Node.js 内置 fs/path/zlib/crypto 模块。
 * Run: node scripts/verify-release.js
 * Exit 0 = pass, Exit 1 = fail
 */

'use strict';

var fs = require('fs');
var path = require('path');
var zlib = require('zlib');
var crypto = require('crypto');

var RELEASE_DIR = path.join(__dirname, '..', 'release');
var EXPECTED_PACKAGE = 'com.openvela.combatsense';
var EXPECTED_VERSION = '1.0.0';
var passed = 0;
var failed = 0;
var errors = [];

function assert(cond, msg) {
  if (cond) {
    passed++;
    console.log('  PASS: ' + msg);
  } else {
    failed++;
    errors.push(msg);
    console.error('  FAIL: ' + msg);
  }
}

function fail(msg) {
  assert(false, msg);
}

// ---- 1. Check release directory exists ----
console.log('\n[1] Release directory');
assert(fs.existsSync(RELEASE_DIR), 'release/ directory exists');

if (!fs.existsSync(RELEASE_DIR)) {
  console.log('\n========================================');
  console.log('Passed: ' + passed + '  Failed: ' + failed);
  console.log('ABORT: release/ directory missing');
  process.exit(1);
}

// ---- 2. Find .rpk files ----
console.log('\n[2] RPK file count');
var rpkFiles = fs.readdirSync(RELEASE_DIR).filter(function (f) {
  return f.endsWith('.rpk');
});

assert(rpkFiles.length === 1, 'exactly one .rpk file found (got ' + rpkFiles.length + ')');

if (rpkFiles.length !== 1) {
  console.log('\n========================================');
  console.log('Passed: ' + passed + '  Failed: ' + failed);
  console.log('ABORT: expected exactly one .rpk file');
  process.exit(1);
}

var rpkPath = path.join(RELEASE_DIR, rpkFiles[0]);
console.log('  Found: ' + rpkFiles[0]);

// ---- 3. Read file and compute SHA-256 ----
console.log('\n[3] File hash and size');
var rpkBuf = fs.readFileSync(rpkPath);
var hash = crypto.createHash('sha256').update(rpkBuf).digest('hex');
console.log('  SHA-256: ' + hash);
console.log('  Size:    ' + rpkBuf.length + ' bytes');
assert(rpkBuf.length > 0, 'RPK file size > 0 bytes');

// ---- 4. Verify ZIP local file header ----
console.log('\n[4] ZIP header');
var isPK = rpkBuf[0] === 0x50 && rpkBuf[1] === 0x4B &&
           rpkBuf[2] === 0x03 && rpkBuf[3] === 0x04;
assert(isPK, 'RPK starts with ZIP local file header (PK\\x03\\x04)');

if (!isPK) {
  console.log('\n========================================');
  console.log('Passed: ' + passed + '  Failed: ' + failed);
  console.log('ABORT: not a valid ZIP');
  process.exit(1);
}

// ---- 5. Parse ZIP End of Central Directory ----
console.log('\n[5] ZIP structure');
var eocdSig = Buffer.from([0x50, 0x4B, 0x05, 0x06]);
var eocdPos = -1;
for (var i = rpkBuf.length - 22; i >= Math.max(0, rpkBuf.length - 65576); i--) {
  if (rpkBuf[i] === 0x50 && rpkBuf[i + 1] === 0x4B &&
      rpkBuf[i + 2] === 0x05 && rpkBuf[i + 3] === 0x06) {
    eocdPos = i;
    break;
  }
}
assert(eocdPos >= 0, 'ZIP End of Central Directory found');

if (eocdPos < 0) {
  console.log('\n========================================');
  console.log('Passed: ' + passed + '  Failed: ' + failed);
  console.log('ABORT: invalid ZIP structure');
  process.exit(1);
}

var cdOffset = rpkBuf.readUInt32LE(eocdPos + 16);
var numEntries = rpkBuf.readUInt16LE(eocdPos + 10);
console.log('  Central directory entries: ' + numEntries);
assert(numEntries > 0, 'ZIP contains at least one entry');

// ---- 6. Walk central directory to find manifest.json ----
console.log('\n[6] Find manifest.json in ZIP');
var offset = cdOffset;
var manifestFound = false;
var manifestBuf = null;

for (var e = 0; e < numEntries; e++) {
  var cdSig = rpkBuf.readUInt32LE(offset);
  if (cdSig !== 0x02014B50) {
    fail('invalid central directory signature at offset ' + offset);
    break;
  }

  var nameLen = rpkBuf.readUInt16LE(offset + 28);
  var extraLen = rpkBuf.readUInt16LE(offset + 30);
  var commentLen = rpkBuf.readUInt16LE(offset + 32);
  var localOffset = rpkBuf.readUInt32LE(offset + 42);
  var compMethod = rpkBuf.readUInt16LE(offset + 10);
  var compSize = rpkBuf.readUInt32LE(offset + 20);
  var uncompSize = rpkBuf.readUInt32LE(offset + 24);
  var fileName = rpkBuf.toString('utf8', offset + 46, offset + 46 + nameLen);

  if (fileName === 'manifest.json') {
    manifestFound = true;

    // Read local file header
    var lSig = rpkBuf.readUInt32LE(localOffset);
    if (lSig !== 0x04034B50) {
      fail('invalid local file header for manifest.json');
      break;
    }
    var lNameLen = rpkBuf.readUInt16LE(localOffset + 26);
    var lExtraLen = rpkBuf.readUInt16LE(localOffset + 28);
    var dataOffset = localOffset + 30 + lNameLen + lExtraLen;
    var dataLen = compSize;

    var raw = rpkBuf.slice(dataOffset, dataOffset + dataLen);

    if (compMethod === 0) {
      // Store (no compression)
      manifestBuf = raw;
    } else if (compMethod === 8) {
      // Deflate
      try {
        manifestBuf = zlib.inflateRawSync(raw);
      } catch (e) {
        fail('deflate decompression failed for manifest.json: ' + e.message);
      }
    } else {
      fail('unsupported compression method ' + compMethod + ' for manifest.json (only store=0 and deflate=8 supported)');
    }
    break;
  }

  offset += 46 + nameLen + extraLen + commentLen;
}

assert(manifestFound, 'manifest.json found in ZIP');

if (!manifestFound || !manifestBuf) {
  console.log('\n========================================');
  console.log('Passed: ' + passed + '  Failed: ' + failed);
  console.log('ABORT: cannot read manifest.json');
  process.exit(1);
}

// ---- 7. Parse and validate manifest ----
console.log('\n[7] Manifest validation');
try {
  var manifest = JSON.parse(manifestBuf.toString('utf8'));
  assert(manifest.package === EXPECTED_PACKAGE,
    'package name is ' + EXPECTED_PACKAGE + ' (got ' + manifest.package + ')');
  assert(manifest.versionName === EXPECTED_VERSION,
    'versionName is ' + EXPECTED_VERSION + ' (got ' + manifest.versionName + ')');
  assert(manifest.name, 'manifest has name field: ' + manifest.name);
} catch (e) {
  fail('manifest.json parse error: ' + e.message);
}

// ---- Summary ----
console.log('\n========================================');
console.log('Passed: ' + passed + '  Failed: ' + failed);
if (failed > 0) {
  console.log('\nFailures:');
  errors.forEach(function (e) { console.log('  - ' + e); });
  process.exit(1);
} else {
  console.log('release.rpk verification passed.');
  process.exit(0);
}
