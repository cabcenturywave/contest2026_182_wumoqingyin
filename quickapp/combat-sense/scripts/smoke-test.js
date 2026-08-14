#!/usr/bin/env node
/**
 * CombatSense Edge — Beta 1.0 Static Contract / Semantic Checks
 *
 * Verifies data interface contract, demo data integrity, manifest structure,
 * page file existence, and session→review parameter flow.
 * Run: node scripts/smoke-test.js
 * Exit 0 = all pass, Exit 1 = failure
 */

'use strict';

var fs = require('fs');
var path = require('path');

var SRC = path.join(__dirname, '..', 'src');
var ROOT = path.join(__dirname, '..', '..', '..');
var passed = 0;
var failed = 0;
var errors = [];

function assert(cond, msg) {
  if (cond) {
    passed++;
  } else {
    failed++;
    errors.push(msg);
    console.error('  FAIL: ' + msg);
  }
}

function readJSON(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function fileExists(p) {
  try { fs.statSync(p); return true; } catch (e) { return false; }
}

function readFile(p) {
  return fs.readFileSync(p, 'utf8');
}

// ---- 1. Manifest structure ----
console.log('\n[1] Manifest structure');
var manifest = readJSON(path.join(SRC, 'manifest.json'));
assert(manifest.package === 'com.openvela.combatsense', 'manifest.package');
assert(manifest.name === 'CombatSense Edge', 'manifest.name');
assert(manifest.deviceTypeList && manifest.deviceTypeList.indexOf('watch') >= 0, 'manifest.deviceTypeList includes watch');
assert(manifest.features, 'manifest.features exists');
var featureNames = manifest.features.map(function (f) { return f.name; });
assert(featureNames.indexOf('system.router') >= 0, 'manifest features include system.router');
assert(featureNames.indexOf('system.sensor') >= 0, 'manifest features include system.sensor');
assert(manifest.router && manifest.router.entry === 'pages/index', 'manifest.router.entry');
assert(manifest.router.pages['pages/session'], 'manifest.router.pages has session');
assert(manifest.router.pages['pages/review'], 'manifest.router.pages has review');
assert(manifest.router.pages['pages/settings'], 'manifest.router.pages has settings');

// ---- 2. Page files exist ----
console.log('\n[2] Page files exist');
var pages = ['index', 'session', 'review', 'settings'];
pages.forEach(function (p) {
  assert(fileExists(path.join(SRC, 'pages', p, 'index.ux')), 'pages/' + p + '/index.ux exists');
});
assert(fileExists(path.join(SRC, 'app.ux')), 'app.ux exists');
assert(fileExists(path.join(SRC, 'common', 'data-interface.js')), 'common/data-interface.js exists');
assert(fileExists(path.join(SRC, 'common', 'demo-data.js')), 'common/demo-data.js exists');
assert(fileExists(path.join(SRC, 'common', 'logo.png')), 'common/logo.png exists');

// ---- 3. Demo data integrity ----
console.log('\n[3] Demo data integrity');
var demoSrc = readFile(path.join(SRC, 'common', 'demo-data.js'));

// Check demoSession has required fields
assert(demoSrc.indexOf('demoSession') >= 0, 'demoSession exported');
assert(demoSrc.indexOf('demoEvents') >= 0, 'demoEvents exported');
assert(demoSrc.indexOf('defaultSettings') >= 0, 'defaultSettings exported');
assert(demoSrc.indexOf('PUNCH_TYPES') >= 0, 'PUNCH_TYPES exported');

// Check demoEvents count = 40
var eventMatches = demoSrc.match(/\{\s*offsetMs:/g);
assert(eventMatches && eventMatches.length === 40, 'demoEvents has exactly 40 entries (got ' + (eventMatches ? eventMatches.length : 0) + ')');

// Check punch type taxonomy
assert(demoSrc.indexOf("'jab'") >= 0 || demoSrc.indexOf('"jab"') >= 0, 'taxonomy includes jab');
assert(demoSrc.indexOf("'cross'") >= 0 || demoSrc.indexOf('"cross"') >= 0, 'taxonomy includes cross');
assert(demoSrc.indexOf("'hook'") >= 0 || demoSrc.indexOf('"hook"') >= 0, 'taxonomy includes hook');
assert(demoSrc.indexOf("'other'") >= 0 || demoSrc.indexOf('"other"') >= 0, 'taxonomy includes other');

// ---- 4. Data interface API contract ----
console.log('\n[4] Data interface API contract');
var diSrc = readFile(path.join(SRC, 'common', 'data-interface.js'));
var requiredAPIs = [
  'probeSensor', 'setMode', 'getMode', 'subscribePunches',
  'unsubscribePunches', 'getSessionSummary', 'getSettings', 'saveSettings',
  'replayDemoEvents'
];
requiredAPIs.forEach(function (fn) {
  assert(diSrc.indexOf('function ' + fn) >= 0 || diSrc.indexOf(fn + ':') >= 0,
    'data-interface exports ' + fn);
});

// Check hardware detection parameters exist (for documentation)
assert(diSrc.indexOf('GRAVITY_EMA_ALPHA') >= 0, 'GRAVITY_EMA_ALPHA parameter defined');
assert(diSrc.indexOf('PUNCH_LINEAR_THRESHOLD') >= 0, 'PUNCH_LINEAR_THRESHOLD parameter defined');
assert(diSrc.indexOf('COOLDOWN_MS') >= 0, 'COOLDOWN_MS parameter defined');
assert(diSrc.indexOf('PEAK_HOLDBACK_MS') >= 0, 'PEAK_HOLDBACK_MS parameter defined');
assert(diSrc.indexOf('CONFIDENCE_SCALE') >= 0, 'CONFIDENCE_SCALE parameter defined');

// ---- 5. Session → Review parameter contract ----
console.log('\n[5] Session → Review parameter contract');
var sessionSrc = readFile(path.join(SRC, 'pages', 'session', 'index.ux'));
var reviewSrc = readFile(path.join(SRC, 'pages', 'review', 'index.ux'));

// Session must send sessionId
assert(sessionSrc.indexOf("sessionId: 'session_' + Date.now()") >= 0,
  'session sends sessionId param');

// Session must send dataSource
assert(sessionSrc.indexOf('dataSource:') >= 0,
  'session sends dataSource param');

// Session must send all punch counts
['duration', 'jab', 'cross', 'hook', 'other', 'total', 'confidence', 'round'].forEach(function (field) {
  assert(sessionSrc.indexOf(field + ':') >= 0,
    'session sends ' + field + ' param to review');
});

// Review must receive sessionId
assert(reviewSrc.indexOf("params.sessionId") >= 0 || reviewSrc.indexOf('params.sessionId') >= 0,
  'review reads sessionId from params');

// Review must receive dataSource
assert(reviewSrc.indexOf("params.dataSource") >= 0 || reviewSrc.indexOf('params.dataSource') >= 0,
  'review reads dataSource from params');

// Review must distinguish demo vs hardware
assert(reviewSrc.indexOf("dataSource === 'hardware'") >= 0,
  'review checks dataSource === hardware');

// ---- 6. Banner correctness ----
console.log('\n[6] Banner / honesty assertions');
// Review must NOT claim hardware when in demo mode
assert(reviewSrc.indexOf('isRealSession') >= 0,
  'review uses isRealSession flag for honest banner display');
// No hardcoded "通过" or "verified" claims in source
assert(diSrc.indexOf('真机验证') < 0 && diSrc.indexOf('real device verified') < 0,
  'data-interface does not claim real device verification');
assert(sessionSrc.indexOf('真机验证') < 0,
  'session does not claim real device verification');

// ---- 7. No secrets in source ----
console.log('\n[7] Secret scan');
var secretPatterns = [
  /api[_-]?key\s*[:=]\s*['"][A-Za-z0-9]/i,
  /token\s*[:=]\s*['"][A-Za-z0-9]/i,
  /password\s*[:=]\s*['"][^\s'"]+/i,
  /secret\s*[:=]\s*['"][^\s'"]+/i,
  /BEGIN\s+(RSA|DSA|EC|OPENSSH)\s+PRIVATE\s+KEY/
];
var srcFiles = [
  path.join(SRC, 'common', 'data-interface.js'),
  path.join(SRC, 'common', 'demo-data.js'),
  path.join(SRC, 'pages', 'session', 'index.ux'),
  path.join(SRC, 'pages', 'review', 'index.ux'),
  path.join(SRC, 'pages', 'index', 'index.ux'),
  path.join(SRC, 'pages', 'settings', 'index.ux'),
  path.join(SRC, 'app.ux')
];
srcFiles.forEach(function (f) {
  var content = readFile(f);
  secretPatterns.forEach(function (pat) {
    assert(!pat.test(content), 'no secret in ' + path.basename(f) + ': ' + pat.source);
  });
});

// ---- 8. Package.json checks ----
console.log('\n[8] Package.json');
var pkg = readJSON(path.join(__dirname, '..', 'package.json'));
assert(pkg.scripts && pkg.scripts.build, 'package.json has build script');
assert(pkg.scripts && pkg.scripts.lint, 'package.json has lint script');
assert(pkg.devDependencies && pkg.devDependencies['aiot-toolkit'], 'aiot-toolkit in devDependencies');

// ---- 9. Version presence ----
console.log('\n[9] Version presence');
assert(manifest.versionName, 'manifest has versionName: ' + manifest.versionName);
assert(manifest.versionName.indexOf('Beta') >= 0 || manifest.versionName.indexOf('beta') >= 0,
  'manifest versionName contains Beta标识');
assert(pkg.version, 'package.json has version: ' + pkg.version);

// ---- 10. Beta 1.0 version consistency ----
console.log('\n[10] Beta 1.0 version consistency');
var settingsSrc = readFile(path.join(SRC, 'pages', 'settings', 'index.ux'));
assert(settingsSrc.indexOf('Beta 1.0') >= 0, 'settings footer shows Beta 1.0');
assert(settingsSrc.indexOf('v1.0.0') < 0, 'settings footer does not show old v1.0.0');

// ---- 11. LICENSE file ----
console.log('\n[11] LICENSE file');
var licensePath = path.join(ROOT, 'LICENSE');
assert(fileExists(licensePath), 'LICENSE file exists at repo root');
if (fileExists(licensePath)) {
  var licenseContent = readFile(licensePath);
  assert(licenseContent.indexOf('Apache License') >= 0, 'LICENSE is Apache 2.0');
  assert(licenseContent.indexOf('Version 2.0') >= 0, 'LICENSE specifies Version 2.0');
}

// ---- 12. Review banner completeness ----
console.log('\n[12] Review banner completeness');
assert(reviewSrc.indexOf('demo-banner') >= 0, 'review has demo-banner element');
assert(reviewSrc.indexOf('real-banner') >= 0, 'review has real-banner element');
assert(reviewSrc.indexOf('demo-session-banner') >= 0, 'review has demo-session-banner element');
assert(reviewSrc.indexOf('演示数据，非真实训练') >= 0, 'review demo banner text present');
assert(reviewSrc.indexOf('真机传感器训练回顾') >= 0, 'review hardware banner text present');
assert(reviewSrc.indexOf('本次训练使用演示事件，非真机采集') >= 0, 'review demo-session banner text present');

// ---- 13. Hand/fatigue/coach not-captured guards ----
console.log('\n[13] Not-captured guards for real sessions');
assert(reviewSrc.indexOf('handNotCaptured') >= 0, 'review uses handNotCaptured guard');
assert(reviewSrc.indexOf('fatigueNotCaptured') >= 0, 'review uses fatigueNotCaptured guard');
assert(reviewSrc.indexOf('coachNotCaptured') >= 0, 'review uses coachNotCaptured guard');
assert(reviewSrc.indexOf('本次未采集，待真机校准') >= 0, 'review not-captured text present');

// ---- 14. Data interface hardware parameters documented ----
console.log('\n[14] Hardware parameter documentation');
assert(diSrc.indexOf('INITIAL ESTIMATES') >= 0 || diSrc.indexOf('initial estimate') >= 0,
  'data-interface marks hardware params as initial estimates');
assert(diSrc.indexOf('MUST be recalibrated') >= 0 || diSrc.indexOf('must be recalibrated') >= 0,
  'data-interface notes params need recalibration');

// ---- Summary ----
console.log('\n========================================');
console.log('Passed: ' + passed + '  Failed: ' + failed);
if (failed > 0) {
  console.log('\nFailures:');
  errors.forEach(function (e) { console.log('  - ' + e); });
  process.exit(1);
} else {
  console.log('All smoke tests passed.');
  process.exit(0);
}
