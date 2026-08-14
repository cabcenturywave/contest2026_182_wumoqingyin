---
name: combat-sense-agent
description: Design, implement, or review the CombatSense Agent coaching pipeline — multi-step reasoning, tool orchestration, and hardware evidence boundaries for real-time boxing training feedback.
---

# CombatSense Edge — Agent Coaching Skill

This skill governs the LLM-based coaching agent that sits between raw punch data and the user-facing Review page. It defines the reasoning loop, tool contracts, and strict honesty rules about what has and has not been verified on real hardware.

## Scope

- Agent reasoning loop (multi-step inference from punch stream to coaching advice)
- Tool definitions and orchestration (IMU probe, session stats, rule-based advisor)
- Evidence boundary enforcement — what the agent may and may not claim
- Integration point with `data-interface.js` and the Review page coach section

## Agent Architecture

```
┌────────────┐     ┌──────────────┐     ┌─────────────────┐
│  IMU Probe │────▶│  Agent Core  │────▶│  Coach Output   │
│  (tool 1)  │     │  (reasoning) │     │  (Review page)  │
└────────────┘     └──────┬───────┘     └─────────────────┘
                          │
                 ┌────────┴────────┐
                 │                 │
          ┌──────▼──────┐  ┌──────▼──────┐
          │ Session     │  │ Rule-Based  │
          │ Stats       │  │ Advisor     │
          │ (tool 2)    │  │ (tool 3)    │
          └─────────────┘  └─────────────┘
```

### Tool 1: IMU Probe

Returns sensor availability and current mode. Used by the agent to decide whether to trust real-time data or fall back to demo-only advice.

```text
Input:  (none — reads state from data-interface)
Output: { available: bool, mode: 'demo'|'hardware', calibrated: false }
```

- `calibrated` is ALWAYS `false` in the current build. The agent must never treat demo data as calibrated hardware output.
- When `available` is false and mode is `'hardware'`, the agent must surface an error banner, not fabricated advice.

### Tool 2: Session Statistics

Aggregates punch counts, confidence distribution, hand ratio, and timing from the current session event stream.

```text
Input:  { events: Array<{type, hand, confidence, timestamp}>, duration: number }
Output: { jab, cross, hook, other, total, avgConfidence, leftRatio, fatigueIndex }
```

- `fatigueIndex` is derived from confidence decay over time (demo data only in current build).
- The agent must not present `fatigueIndex` as a medical or physiological measurement.

### Tool 3: Rule-Based Advisor

Applies a fixed set of coaching rules to the session statistics. No LLM inference — deterministic output.

```text
Input:  Session Statistics output
Output: { tips: string[], intensity: 'low'|'moderate'|'high', balance: string }
```

Rules (current build, demo-only):
1. If `jab + cross < 10` → tip: "增加直拳基础训练量"
2. If `leftRatio < 0.3 || leftRatio > 0.7` → tip: "注意左右手均衡"
3. If `avgConfidence < 0.5` → tip: "放慢速度，专注动作质量"
4. If `fatigueIndex > 0.7` → tip: "疲劳指数偏高，建议休息"
5. Intensity derived from `total / duration` ratio

## Multi-Step Reasoning Loop

The agent follows a strict 4-step loop per coaching cycle:

1. **Probe** — Call Tool 1 to confirm sensor state. If unavailable in hardware mode, emit error and stop.
2. **Aggregate** — Call Tool 2 to compute session statistics from the event stream.
3. **Advise** — Call Tool 3 to generate rule-based coaching tips from statistics.
4. **Bound** — Apply evidence boundary checks before emitting any output (see below).

Steps 1–3 are sequential. Step 4 runs on every output candidate.

## Evidence Boundary Rules

These rules are **non-negotiable** and must be enforced in every agent output:

| Claim | Permitted? | Reason |
|-------|-----------|--------|
| "Demo 数据显示出拳节奏良好" | YES | Demo data is verified on simulator |
| "真机 IMU 校准已完成" | NO | No real device calibration has occurred |
| "疲劳趋势表明训练强度适中" | YES (demo) | Derived from verified demo session data |
| "传感器数据显示手腕角度正常" | NO | No wrist sensor, no real IMU data |
| "建议增加 20% 出拳力度" | YES | Rule-based advice from stats, not medical |
| "心率区间建议" | NO | No heart rate sensor in scope |
| "本次训练使用演示事件，非真机采集" | REQUIRED | Must appear in every demo-mode output |

### Required Disclaimers

Every agent output MUST include one of:
- Demo mode: `"本次训练使用演示事件，非真机采集"` (or equivalent)
- Hardware mode (future): `"真机传感器训练回顾，参数待校准"`

If the agent cannot determine the mode, it MUST default to the demo disclaimer.

## Integration with data-interface.js

The agent consumes events from `data-interface.js` via the same `subscribePunches` callback. It does NOT access `@system.sensor` directly — all sensor access goes through the data interface abstraction.

```text
Agent reads:  data-interface.subscribePunches → events array
Agent reads:  data-interface.getMode() → 'demo' | 'hardware'
Agent reads:  data-interface.probeSensor() → availability
Agent writes: nothing to data-interface (read-only consumer)
```

## Workflow for Developers

1. Read this SKILL.md before modifying agent logic.
2. When adding a new tool, define its Input/Output contract in this file AND in the tool's source comment.
3. When adding a new coaching rule, add it to the Rule-Based Advisor section above and update the rule count.
4. Never bypass the evidence boundary checks — they exist to prevent false hardware claims.
5. Run `cd quickapp/combat-sense && npm test` after changes to verify smoke tests pass.

## Guardrails

- Never fabricate hardware verification results or claim real-device data was used when it was not.
- Never add LLM API calls, API keys, or network endpoints to the agent pipeline without explicit organizer approval.
- Never present demo data as medical, physiological, or clinical advice.
- The agent is a training assistant, not a medical device. All outputs are informational only.
- Before a Git commit, run the secret scan: `/home/boriswu/.local/bin/contest-log-secret-scan.py --all`
