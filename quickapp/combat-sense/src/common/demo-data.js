/**
 * CombatSense Edge — Demo Data Module
 *
 * Contains a complete demo session JSON and replayable action events.
 * All data is deterministic (no randomness) for reproducible demos.
 *
 * PUNCH_TYPE taxonomy:
 *   jab    — lead-hand straight punch
 *   cross  — rear-hand straight punch
 *   hook   — circular punch (lead or rear)
 *   other  — uppercut, body shot, or unclassified
 */

var PUNCH_TYPES = ['jab', 'cross', 'hook', 'other'];

/**
 * Full demo session — simulates a 3-round, 3-minute boxing session
 * with realistic punch distribution and metadata.
 */
var demoSession = {
  sessionId: 'demo-session-001',
  date: '2026-08-03T10:00:00Z',
  durationSec: 180,
  rounds: 3,
  roundDurationSec: 60,
  restBetweenRoundsSec: 30,
  trainingType: 'heavy_bag',
  hand: 'right',
  stance: 'orthodox',

  punchCounts: {
    jab: 42,
    cross: 35,
    hook: 28,
    other: 12
  },
  totalPunches: 117,

  handDistribution: {
    left: 48,
    right: 69
  },

  roundBreakdown: [
    {
      round: 1,
      durationSec: 60,
      punches: { jab: 18, cross: 14, hook: 8, other: 3 },
      total: 43,
      avgConfidence: 0.87,
      peakPunchesPerMin: 52
    },
    {
      round: 2,
      durationSec: 60,
      punches: { jab: 15, cross: 12, hook: 11, other: 5 },
      total: 43,
      avgConfidence: 0.84,
      peakPunchesPerMin: 48
    },
    {
      round: 3,
      durationSec: 60,
      punches: { jab: 9, cross: 9, hook: 9, other: 4 },
      total: 31,
      avgConfidence: 0.79,
      peakPunchesPerMin: 38
    }
  ],

  fatigueTrend: [
    { timeSec: 0, punchRate: 43, confidence: 0.90 },
    { timeSec: 15, punchRate: 50, confidence: 0.89 },
    { timeSec: 30, punchRate: 48, confidence: 0.88 },
    { timeSec: 45, punchRate: 44, confidence: 0.87 },
    { timeSec: 60, punchRate: 43, confidence: 0.86 },
    { timeSec: 75, punchRate: 46, confidence: 0.85 },
    { timeSec: 90, punchRate: 44, confidence: 0.84 },
    { timeSec: 105, punchRate: 40, confidence: 0.82 },
    { timeSec: 120, punchRate: 43, confidence: 0.81 },
    { timeSec: 135, punchRate: 38, confidence: 0.80 },
    { timeSec: 150, punchRate: 35, confidence: 0.79 },
    { timeSec: 165, punchRate: 30, confidence: 0.78 },
    { timeSec: 180, punchRate: 31, confidence: 0.79 }
  ],

  coachSuggestions: [
    'Cross 出拳速度在第三回合下降明显，建议加强后手力量耐力训练。',
    'Hook 占比偏低（24%），可在组合拳中多加入 Hook 练习。',
    '左手出拳占比 41%，右手 59%，左右手较为均衡，继续保持。',
    '整体置信度稳定在 0.79–0.90，传感器佩戴良好。'
  ]
};

/**
 * Replayable demo action events — simulates real-time punch detection.
 * Each event has: timestamp offset (ms), punch type, hand, confidence.
 * Spans ~30 seconds for quick demo playback.
 */
var demoEvents = [
  { offsetMs: 500, type: 'jab', hand: 'left', confidence: 0.92 },
  { offsetMs: 1200, type: 'cross', hand: 'right', confidence: 0.89 },
  { offsetMs: 2100, type: 'jab', hand: 'left', confidence: 0.91 },
  { offsetMs: 2800, type: 'hook', hand: 'left', confidence: 0.85 },
  { offsetMs: 3600, type: 'jab', hand: 'left', confidence: 0.90 },
  { offsetMs: 4300, type: 'cross', hand: 'right', confidence: 0.88 },
  { offsetMs: 5000, type: 'jab', hand: 'left', confidence: 0.87 },
  { offsetMs: 5800, type: 'hook', hand: 'right', confidence: 0.83 },
  { offsetMs: 6500, type: 'cross', hand: 'right', confidence: 0.86 },
  { offsetMs: 7200, type: 'jab', hand: 'left', confidence: 0.91 },
  { offsetMs: 8000, type: 'other', hand: 'right', confidence: 0.72 },
  { offsetMs: 8800, type: 'jab', hand: 'left', confidence: 0.89 },
  { offsetMs: 9500, type: 'cross', hand: 'right', confidence: 0.87 },
  { offsetMs: 10200, type: 'hook', hand: 'left', confidence: 0.84 },
  { offsetMs: 11000, type: 'jab', hand: 'left', confidence: 0.90 },
  { offsetMs: 11800, type: 'cross', hand: 'right', confidence: 0.88 },
  { offsetMs: 12500, type: 'jab', hand: 'left', confidence: 0.86 },
  { offsetMs: 13200, type: 'hook', hand: 'right', confidence: 0.81 },
  { offsetMs: 14000, type: 'jab', hand: 'left', confidence: 0.88 },
  { offsetMs: 14800, type: 'cross', hand: 'right', confidence: 0.85 },
  { offsetMs: 15500, type: 'other', hand: 'left', confidence: 0.70 },
  { offsetMs: 16200, type: 'jab', hand: 'left', confidence: 0.87 },
  { offsetMs: 17000, type: 'cross', hand: 'right', confidence: 0.86 },
  { offsetMs: 17800, type: 'hook', hand: 'left', confidence: 0.82 },
  { offsetMs: 18500, type: 'jab', hand: 'left', confidence: 0.85 },
  { offsetMs: 19200, type: 'cross', hand: 'right', confidence: 0.84 },
  { offsetMs: 20000, type: 'jab', hand: 'left', confidence: 0.86 },
  { offsetMs: 20800, type: 'hook', hand: 'right', confidence: 0.79 },
  { offsetMs: 21500, type: 'cross', hand: 'right', confidence: 0.83 },
  { offsetMs: 22200, type: 'jab', hand: 'left', confidence: 0.84 },
  { offsetMs: 23000, type: 'other', hand: 'right', confidence: 0.68 },
  { offsetMs: 23800, type: 'jab', hand: 'left', confidence: 0.82 },
  { offsetMs: 24500, type: 'cross', hand: 'right', confidence: 0.81 },
  { offsetMs: 25200, type: 'hook', hand: 'left', confidence: 0.78 },
  { offsetMs: 26000, type: 'jab', hand: 'left', confidence: 0.80 },
  { offsetMs: 26800, type: 'cross', hand: 'right', confidence: 0.79 },
  { offsetMs: 27500, type: 'jab', hand: 'left', confidence: 0.78 },
  { offsetMs: 28200, type: 'hook', hand: 'right', confidence: 0.75 },
  { offsetMs: 29000, type: 'jab', hand: 'left', confidence: 0.77 },
  { offsetMs: 29800, type: 'cross', hand: 'right', confidence: 0.76 }
];

/**
 * Default settings for the application.
 */
var defaultSettings = {
  hand: 'right',
  stance: 'orthodox',
  trainingType: 'heavy_bag',
  demoMode: true
};

export default {
  PUNCH_TYPES: PUNCH_TYPES,
  demoSession: demoSession,
  demoEvents: demoEvents,
  defaultSettings: defaultSettings
};
