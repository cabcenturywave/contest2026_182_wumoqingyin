#!/usr/bin/env node
'use strict';

var fs = require('fs');
var path = require('path');
var cp = require('child_process');
var crypto = require('crypto');
var zlib = require('zlib');
var root = path.join(__dirname, '..');

// Required files for contest submission
var required = [
  'LICENSE',
  'CONTEST_SUBMISSION.md',
  'scripts/security-scan.js',
  '.claude/skills/combat-sense-quickapp/SKILL.md',
  '.claude/skills/combat-sense-imu/SKILL.md',
  '.claude/skills/combat-sense-agent/SKILL.md',
  'app/imu_tool/imu_tool_main.c',
  'app/imu_tool/Makefile',
  'app/imu_tool/CMakeLists.txt',
  'app/imu_tool/Kconfig',
  'logs/cabcenturywave/manifest.json',
  'submission/README.md',
  'submission/CombatSense-Edge-官方作品提交报告.docx',
  'submission/CombatSense-Edge-官方作品提交报告.pdf',
  'submission/CombatSense-Edge-demo.mp4',
  'submission/wumoqingyin-CombatSense-Edge-contest2026_182_wumoqingyin.zip'
];

required.forEach(function (rel) {
  if (!fs.existsSync(path.join(root, rel))) {
    throw new Error('missing required file: ' + rel);
  }
});

// Check contest XML manifest
var xml = fs.readFileSync(path.join(root, 'contest2026_182_wumoqingyin.xml'), 'utf8');
if (xml.indexOf('src="app/imu_tool"') < 0) {
  throw new Error('imu_tool linkfile is missing');
}

// Check CONTEST_SUBMISSION.md contains official initial submission status words
var submission = fs.readFileSync(path.join(root, 'CONTEST_SUBMISSION.md'), 'utf8');
var requiredStatusWords = ['VERIFIED', 'READY', 'PENDING', 'HOLD', 'ENOSYS'];
requiredStatusWords.forEach(function (word) {
  if (submission.indexOf(word) < 0) {
    throw new Error('submission matrix missing status word: ' + word);
  }
});

// Check submission matrix covers required submission items
var requiredMatrixItems = ['源码', 'release', '文档', '视频', '日志', 'Skill', 'ZIP', '表单', 'LICENSE', '原创', 'Apache License 2.0'];
requiredMatrixItems.forEach(function (item) {
  if (submission.indexOf(item) < 0) {
    throw new Error('submission matrix missing required item: ' + item);
  }
});

var officialForm = 'https://mi.feishu.cn/share/base/form/shrcn1gCLxCjCXGwiuQ4TTDrQ7d';
var officialRepo = 'https://github.com/open-vela/contest2026_182_wumoqingyin';
if (submission.indexOf(officialForm) < 0 || submission.indexOf(officialRepo) < 0) {
  throw new Error('submission matrix is missing an official URL');
}

function sha256(rel) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(root, rel))).digest('hex');
}

var expectedArtifacts = {
  'quickapp/combat-sense/release/com.openvela.combatsense.release.1.0.0.rpk': ['3b75a9b4dd576b66ddd963433fab283b0bd1650423358c1ed9cfa1cfba8c2bc1', 27973],
  'submission/CombatSense-Edge-官方作品提交报告.docx': ['fdd1839a2c0462bfcc68f81f3fc919784e6526d320344dd58354119a6888d849', 30607],
  'submission/CombatSense-Edge-官方作品提交报告.pdf': ['285eaf492f000916d7dbab961a4599a07dd785d8e87f0917549452f5ec4921ca', 575139],
  'submission/CombatSense-Edge-demo.mp4': ['9f4f0441bc793635412ba9bc30eb4e73ed4c530d3159315e94ac68eeab46bd7b', 226894],
  'submission/wumoqingyin-CombatSense-Edge-contest2026_182_wumoqingyin.zip': ['627e780ce211b46e432e7323db12d2289d2c0180c3a4ea229a088b06fa764023', 630890]
};

Object.keys(expectedArtifacts).forEach(function (rel) {
  var expected = expectedArtifacts[rel];
  var full = path.join(root, rel);
  if (!fs.existsSync(full)) {
    throw new Error('missing verified artifact: ' + rel);
  }
  if (fs.statSync(full).size !== expected[1] || sha256(rel) !== expected[0]) {
    throw new Error('artifact hash or size mismatch: ' + rel);
  }
});

var zipRel = 'submission/wumoqingyin-CombatSense-Edge-contest2026_182_wumoqingyin.zip';
var zipPath = path.join(root, zipRel);
var expectedZipEntries = [
  'CombatSense-Edge-官方作品提交报告.docx',
  'CombatSense-Edge-官方作品提交报告.pdf',
  'CombatSense-Edge-demo.mp4'
];

function parseZip(buffer) {
  var eocd = -1;
  for (var cursor = buffer.length - 22; cursor >= Math.max(0, buffer.length - 65557); cursor--) {
    if (buffer.readUInt32LE(cursor) === 0x06054b50) {
      eocd = cursor;
      break;
    }
  }
  if (eocd < 0) {
    throw new Error('official ZIP has no end-of-central-directory record');
  }
  var count = buffer.readUInt16LE(eocd + 10);
  var offset = buffer.readUInt32LE(eocd + 16);
  var entries = [];
  for (var index = 0; index < count; index++) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) {
      throw new Error('official ZIP central directory is invalid');
    }
    var flags = buffer.readUInt16LE(offset + 8);
    var method = buffer.readUInt16LE(offset + 10);
    var compressedSize = buffer.readUInt32LE(offset + 20);
    var nameLength = buffer.readUInt16LE(offset + 28);
    var extraLength = buffer.readUInt16LE(offset + 30);
    var commentLength = buffer.readUInt16LE(offset + 32);
    var localOffset = buffer.readUInt32LE(offset + 42);
    var name = buffer.slice(offset + 46, offset + 46 + nameLength).toString((flags & 0x0800) ? 'utf8' : 'latin1');
    if (flags & 0x0001) {
      throw new Error('official ZIP contains an encrypted entry');
    }
    if (/[^\x00-\x7f]/.test(name) && !(flags & 0x0800)) {
      throw new Error('official ZIP non-ASCII entry lacks the UTF-8 flag');
    }
    if (buffer.readUInt32LE(localOffset) !== 0x04034b50) {
      throw new Error('official ZIP local header is invalid');
    }
    var localNameLength = buffer.readUInt16LE(localOffset + 26);
    var localExtraLength = buffer.readUInt16LE(localOffset + 28);
    var dataOffset = localOffset + 30 + localNameLength + localExtraLength;
    var compressed = buffer.slice(dataOffset, dataOffset + compressedSize);
    var payload;
    if (method === 0) {
      payload = compressed;
    } else if (method === 8) {
      payload = zlib.inflateRawSync(compressed);
    } else {
      throw new Error('official ZIP uses an unsupported compression method');
    }
    entries.push({name: name, payload: payload});
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

var parsedZipEntries = parseZip(fs.readFileSync(zipPath));
var zipEntryNames = parsedZipEntries.map(function (entry) { return entry.name; });
if (JSON.stringify(zipEntryNames) !== JSON.stringify(expectedZipEntries)) {
  throw new Error('official ZIP entry list mismatch');
}
parsedZipEntries.forEach(function (entry) {
  var standalone = fs.readFileSync(path.join(root, 'submission', entry.name));
  if (!entry.payload.equals(standalone)) {
    throw new Error('official ZIP entry differs from standalone artifact: ' + entry.name);
  }
});

function walkJsonl(directory, output) {
  fs.readdirSync(directory).forEach(function (name) {
    var full = path.join(directory, name);
    var stat = fs.statSync(full);
    if (stat.isDirectory()) {
      walkJsonl(full, output);
    } else if (/\.jsonl$/.test(name)) {
      output.push(full);
    }
  });
}

var logFiles = [];
walkJsonl(path.join(root, 'logs', 'cabcenturywave'), logFiles);
var eventCount = 0;
var sawMimo25 = false;
logFiles.forEach(function (full) {
  var lines = fs.readFileSync(full, 'utf8').split(/\r?\n/).filter(Boolean);
  eventCount += lines.length;
  lines.forEach(function (line) {
    var event = JSON.parse(line);
    if (typeof event.model === 'string' && /mimo-v2\.5(?:-pro)?$/i.test(event.model)) {
      sawMimo25 = true;
    }
  });
});
if (logFiles.length !== 22 || eventCount !== 1618 || !sawMimo25) {
  throw new Error('OpenCode / MiMo log evidence mismatch');
}

// Compile and run IMU C Tool host stub
var out = path.join('/tmp', 'combatsense-imu-tool-stub');
cp.execFileSync('gcc', [
  '-DIMU_TOOL_HOST_STUB', '-Wall', '-Wextra', '-Werror', '-std=c11',
  '-o', out, path.join(root, 'app/imu_tool/imu_tool_main.c'), '-lm'
], {stdio: 'inherit'});
cp.execFileSync(out, [], {stdio: 'inherit'});

// Current-tree and nested-archive secret checks. Full reachable history is
// checked separately with: node scripts/security-scan.js --history
cp.execFileSync(process.execPath, [path.join(root, 'scripts/security-scan.js')], {stdio: 'inherit'});

console.log('contest verification passed');
