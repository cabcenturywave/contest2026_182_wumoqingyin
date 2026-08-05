/**
 * CombatSense Edge — Data Interface Abstraction
 *
 * This module defines the data contract between the UI layer and the
 * motion-sensing backend. Currently backed by demo data; swap the
 * implementation to connect real IMU / sensor input in the future.
 *
 * Public API:
 *   subscribePunches(callback, errorCallback) — start receiving punch events
 *   unsubscribePunches()                      — stop receiving events
 *   getSessionSummary()                       — returns last session summary
 *   getSettings() / saveSettings(obj)         — persistent settings
 *   replayDemoEvents(onEvent, speed)          — play demo events with timing
 */

import demoData from './demo-data';

var _punchCallback = null;
var _errorCallback = null;
var _replayTimer = null;

/**
 * Subscribe to real-time punch events.
 * In demo mode, replays demoEvents. In production, hooks into IMU stream.
 *
 * @param {Function} callback - receives { type, hand, confidence, timestamp }
 * @param {Function} [errorCb] - receives error info
 * @param {number} [speed=1] - playback speed multiplier (demo only)
 */
function subscribePunches(callback, errorCb, speed) {
  _punchCallback = callback;
  _errorCallback = errorCb || function () {};
  var playbackSpeed = speed || 1;
  replayDemoEvents(callback, playbackSpeed);
}

/**
 * Stop receiving punch events.
 */
function unsubscribePunches() {
  if (_replayTimer) {
    clearTimeout(_replayTimer);
    _replayTimer = null;
  }
  _punchCallback = null;
  _errorCallback = null;
}

/**
 * Replay demo events with realistic timing.
 *
 * @param {Function} onEvent - called for each event
 * @param {number} speed - playback speed multiplier
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
 * @returns {Object} current settings
 */
function getSettings() {
  return demoData.defaultSettings;
}

/**
 * Save settings (placeholder for storage persistence).
 *
 * @param {Object} obj - settings to merge
 */
function saveSettings(obj) {
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      demoData.defaultSettings[key] = obj[key];
    }
  }
}

export default {
  subscribePunches: subscribePunches,
  unsubscribePunches: unsubscribePunches,
  replayDemoEvents: replayDemoEvents,
  getSessionSummary: getSessionSummary,
  getSettings: getSettings,
  saveSettings: saveSettings
};
