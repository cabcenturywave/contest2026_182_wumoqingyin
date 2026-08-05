---
name: combat-sense-quickapp
description: Implement, review, or validate CombatSense Edge changes in the openvela QuickApp project. Use for wearable training UI, Demo Data, IMU integration boundaries, RPK builds, documentation, and simulator-readiness work in quickapp/combat-sense.
---

# CombatSense Edge QuickApp

Work only in `quickapp/combat-sense/` unless a manifest mapping or repository README genuinely needs updating.

## Workflow

1. Read `quickapp/combat-sense/README.md`, `src/manifest.json`, and the target `.ux` page before changing behavior.
2. Keep training UI data behind `src/common/data-interface.js`. Use `demo-data.js` for deterministic replay; add hardware access only by replacing the data-interface implementation.
3. Keep action labels within the initial taxonomy: `jab`, `cross`, `hook`, `other`. Preserve session summary fields so Review continues to work.
4. When adding a page, use the existing `src/pages/<page>/index.ux` layout and register its route in `src/manifest.json`.
5. Validate code changes with `npm ci && npm run build` from `quickapp/combat-sense/`. Treat a generated debug RPK as a packaging result, not proof of simulator or hardware execution.
6. Update the root README when verification status or the `contest2026_182_wumoqingyin.xml` linkfile mapping changes.

## Guardrails

- Never put API keys, tokens, passwords, private endpoints, or personal data in source, Demo Data, README files, or logs.
- Do not create a production signing key or run `npm run release` without explicit organizer requirements and secure key handling.
- Do not claim IMU, simulator, or real-device verification unless it was actually performed and recorded.
- Before a Git commit, run `/home/boriswu/.local/bin/contest-log-secret-scan.py --all` from the contest repository.
