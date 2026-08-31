#!/usr/bin/env node
'use strict';

var fs = require('fs');
var path = require('path');
var cp = require('child_process');
var root = path.join(__dirname, '..');

// Required files for contest submission
var required = [
  'LICENSE',
  'CONTEST_SUBMISSION.md',
  '.claude/skills/combat-sense-imu/SKILL.md',
  '.claude/skills/combat-sense-agent/SKILL.md',
  'app/imu_tool/imu_tool_main.c',
  'app/imu_tool/Makefile',
  'app/imu_tool/CMakeLists.txt',
  'app/imu_tool/Kconfig',
  'logs/cabcenturywave/manifest.json'
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
var requiredStatusWords = ['VERIFIED', 'HOLD', 'ENOSYS'];
requiredStatusWords.forEach(function (word) {
  if (submission.indexOf(word) < 0) {
    throw new Error('submission matrix missing status word: ' + word);
  }
});

// Check submission matrix covers required submission items
var requiredMatrixItems = ['源码', 'release', '文档', '视频', '日志', 'Skill', 'LICENSE'];
requiredMatrixItems.forEach(function (item) {
  if (submission.indexOf(item) < 0) {
    throw new Error('submission matrix missing required item: ' + item);
  }
});

// Compile and run IMU C Tool host stub
var out = path.join('/tmp', 'combatsense-imu-tool-stub');
cp.execFileSync('gcc', [
  '-DIMU_TOOL_HOST_STUB', '-Wall', '-Wextra', '-Werror', '-std=c11',
  '-o', out, path.join(root, 'app/imu_tool/imu_tool_main.c'), '-lm'
], {stdio: 'inherit'});
cp.execFileSync(out, [], {stdio: 'inherit'});

console.log('contest verification passed');
