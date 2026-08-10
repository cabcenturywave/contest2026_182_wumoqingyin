/**
 * CombatSense Edge — Data Interface Abstraction
 *
 * This module defines the data contract between the UI layer and the
 * motion-sensing backend. Supports two modes:
 *   - demo:      replays demoEvents from demo-data.js
 *   - hardware:  subscribes to real accelerometer via system.sensor
 *
 * Public API:
 *   probeSensor(successCb, failCb)  — check accelerometer availability
 *   setMode(mode) / getMode()       — switch between 'demo' and 'hardware'
 *   subscribePunches(callback, errorCallback, speed) — start receiving punch events
 *   unsubscribePunches()            — stop receiving events
 *   getSessionSummary()             — returns last session summary
 *   getSettings() / saveSettings(obj) — persistent settings
 *   replayDemoEvents(onEvent, speed)  — play demo events with timing
 */

import sensor from '@system.sensor';
import demoData from './demo-data';

var _punchCallback = null;
var _errorCallback = null;
var _replayTimer = null;
var _sensorAvailable = false;
var _mode = 'demo';

// --- Probe state (probeSensor only) ---
var _probing = false;
var _probeTimer = null;

// --- Hardware punch detection parameters ---
// All values below are INITIAL ESTIMATES for development only.
// They MUST be recalibrated on the real device with real users.
// See README "待真板校准" section.

var GRAVITY_EMA_ALPHA = 0.98;
var PUNCH_LINEAR_THRESHOLD = 2.0;
var COOLDOWN_MS = 200;
var PEAK_HOLDBACK_MS = 80;
var CONFIDENCE_SCALE = 0.08;

// --- Peak detection state machine ---
var PEAK_IDLE = 0;
var PEAK_RISING = 1;
var PEAK_HOLDING = 2;
var PEAK_COOLDOWN = 3;

var _gravity = 0;
var _peakState = PEAK_IDLE;
var _peakValue = 0;
var _peakStartTime = 0;
var _lastPunchTime = 0;

/**
 * Probe whether the accelerometer hardware is available.
 * Strategy: attempt a real subscribeAccelerometer. If fail callback fires
 * or 500ms elapse with no data, mark unavailable. If data arrives, mark
 * available and immediately unsubscribe the probe.
 *
 * @param {Function} successCb — called with true if sensor is available
 * @param {Function} failCb    — called with false if sensor is unavailable
 */
function probeSensor(successCb, failCb) {
  if (_probing) { return; }
  if (!(sensor && typeof sensor.subscribeAccelerometer === 'function')) {
    _sensorAvailable = false;
    if (failCb) { failCb(false); }
    return;
  }

  _probing = true;
  _sensorAvailable = false;

  function finish(available) {
    if (!_probing) { return; }
    _probing = false;
    if (_probeTimer) { clearTimeout(_probeTimer); _probeTimer = null; }
    try { sensor.unsubscribeAccelerometer(); } catch (e) { /* ignore */ }
    _sensorAvailable = available;
    if (available) { if (successCb) { successCb(true); } }
    else { if (failCb) { failCb(false); } }
  }

  _probeTimer = setTimeout(function () {
    finish(false);
  }, 500);

  try {
    sensor.subscribeAccelerometer({
      interval: 'game',
      callback: function () { finish(true); },
      fail: function () { finish(false); }
    });
  } catch (e) {
    finish(false);
  }
}

/**
 * Set the data source mode.
 * @param {string} m — 'demo' or 'hardware'
 */
function setMode(m) {
  _mode = (m === 'hardware') ? 'hardware' : 'demo';
}

/**
 * Get the current data source mode.
 * @returns {string} 'demo' or 'hardware'
 */
function getMode() {
  return _mode;
}

/**
 * Subscribe to real-time punch events.
 * In demo mode, replays demoEvents. In hardware mode, hooks into accelerometer.
 *
 * @param {Function} callback   — receives { type, hand, confidence, timestamp }
 * @param {Function} [errorCb]  — receives (message, code)
 * @param {number}   [speed=1]  — playback speed multiplier (demo only)
 */
function subscribePunches(callback, errorCb, speed) {
  _punchCallback = callback;
  _errorCallback = errorCb || function () {};
  var playbackSpeed = speed || 1;

  if (_mode === 'hardware') {
    if (!_sensorAvailable) {
      _errorCallback('传感器不可用，请检查设备或开启 Demo 模式', -1);
      return;
    }
    _resetPeakState();
    try {
      sensor.subscribeAccelerometer({
        interval: 'game',
        callback: _onAccelerometerData,
        fail: function (data, code) {
          _safeUnsubscribeAccel();
          _sensorAvailable = false;
          _resetPeakState();
          if (_errorCallback) {
            _errorCallback('传感器订阅失败: ' + data + ' (code ' + code + ')', code);
          }
        }
      });
    } catch (e) {
      _safeUnsubscribeAccel();
      _sensorAvailable = false;
      _resetPeakState();
      _errorCallback('传感器订阅异常: ' + e.message, -2);
    }
  } else {
    replayDemoEvents(callback, playbackSpeed);
  }
}

/**
 * Idempotent accelerometer unsubscribe.
 * Safe to call even if no subscription is active.
 */
function _safeUnsubscribeAccel() {
  try {
    if (sensor && typeof sensor.unsubscribeAccelerometer === 'function') {
      sensor.unsubscribeAccelerometer();
    }
  } catch (e) { /* ignore */ }
}

/**
 * Reset the peak detection state machine and gravity estimate.
 */
function _resetPeakState() {
  _gravity = 0;
  _peakState = PEAK_IDLE;
  _peakValue = 0;
  _peakStartTime = 0;
  _lastPunchTime = 0;
}

/**
 * Process a single accelerometer sample from hardware.
 * 1. Compute magnitude.
 * 2. Update gravity estimate via EMA.
 * 3. Compute linear acceleration (magnitude minus gravity).
 * 4. Run peak detection state machine.
 * 5. On confirmed peak, emit one punch event.
 *
 * @param {Object} res — { x, y, z } from system.sensor
 */
function _onAccelerometerData(res) {
  if (!_sensorAvailable || !_punchCallback) { return; }

  var x = res.x || 0;
  var y = res.y || 0;
  var z = res.z || 0;
  var mag = Math.sqrt(x * x + y * y + z * z);
  var now = Date.now();

  // 1. Update gravity estimate (EMA)
  if (_gravity === 0) {
    _gravity = mag;
  } else {
    _gravity = GRAVITY_EMA_ALPHA * _gravity + (1 - GRAVITY_EMA_ALPHA) * mag;
  }

  // 2. Linear acceleration = total minus gravity
  var linear = Math.abs(mag - _gravity);

  // 3. Peak detection state machine
  switch (_peakState) {
    case PEAK_IDLE:
      if (linear > PUNCH_LINEAR_THRESHOLD) {
        _peakState = PEAK_RISING;
        _peakValue = linear;
        _peakStartTime = now;
      }
      break;

    case PEAK_RISING:
      if (linear > _peakValue) {
        _peakValue = linear;
      } else {
        _peakState = PEAK_HOLDING;
        _peakStartTime = now;
      }
      break;

    case PEAK_HOLDING:
      if (linear > _peakValue) {
        _peakState = PEAK_RISING;
        _peakValue = linear;
      } else if (now - _peakStartTime >= PEAK_HOLDBACK_MS) {
        if (now - _lastPunchTime >= COOLDOWN_MS) {
          _lastPunchTime = now;
          var confidence = Math.min(0.95, 0.5 + _peakValue * CONFIDENCE_SCALE);
          confidence = Math.max(0.3, confidence);
          _punchCallback({
            type: 'other',
            hand: 'unknown',
            confidence: Math.round(confidence * 100) / 100,
            timestamp: now
          });
        }
        _peakState = PEAK_COOLDOWN;
        _peakStartTime = now;
      }
      break;

    case PEAK_COOLDOWN:
      if (now - _peakStartTime >= COOLDOWN_MS) {
        _peakState = PEAK_IDLE;
        _peakValue = 0;
      }
      break;
  }
}

/**
 * Stop receiving punch events.
 */
function unsubscribePunches() {
  if (_replayTimer) {
    clearTimeout(_replayTimer);
    _replayTimer = null;
  }
  try {
    if (sensor && typeof sensor.unsubscribeAccelerometer === 'function') {
      sensor.unsubscribeAccelerometer();
    }
  } catch (e) {
    // sensor may not have been subscribed
  }
  _punchCallback = null;
  _errorCallback = null;
  _resetPeakState();
}

/**
 * Replay demo events with realistic timing.
 *
 * @param {Function} onEvent — called for each event
 * @param {number} speed — playback speed multiplier
 */
function replayDemoEvents(onEvent, speed) {
  var events = demoData.demoEvents;
  var idx = 0;

  function playNext() {
    if (idx >= events.length) {
      return;
    }
    var evt = events[idx];
    var delay = idx === 0 ? evt.offsetMs : (events[idx].offsetMs - events[idx - 1].offsetMs);
    delay = Math.round(delay / speed);

    _replayTimer = setTimeout(function () {
      if (_punchCallback) {
        _punchCallback({
          type: evt.type,
          hand: evt.hand,
          confidence: evt.confidence,
          timestamp: Date.now()
        });
      }
      idx++;
      playNext();
    }, delay);
  }

  playNext();
}

/**
 * Returns a copy of the last completed session summary.
 * In demo mode, returns demoSession. In production, fetches from storage.
 *
 * @returns {Object} session summary
 */
function getSessionSummary() {
  return demoData.demoSession;
}

/**
 * Get persistent settings.
 *
 * @returns {Object} current settings (copy)
 */
function getSettings() {
  var s = demoData.defaultSettings;
  return {
    hand: s.hand,
    stance: s.stance,
    trainingType: s.trainingType,
    demoMode: s.demoMode
  };
}

/**
 * Save settings (in-memory; persists for session lifetime).
 *
 * @param {Object} obj — settings to merge
 */
function saveSettings(obj) {
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      demoData.defaultSettings[key] = obj[key];
    }
  }
  if (typeof obj.demoMode === 'boolean') {
    _mode = obj.demoMode ? 'demo' : 'hardware';
  }
}

export default {
  probeSensor: probeSensor,
  setMode: setMode,
  getMode: getMode,
  subscribePunches: subscribePunches,
  unsubscribePunches: unsubscribePunches,
  replayDemoEvents: replayDemoEvents,
  getSessionSummary: getSessionSummary,
  getSettings: getSettings,
  saveSettings: saveSettings
};
