# Development log

## 2026-07-26 — v1 Core build

Built the complete no-build Canvas game: seven-row isometric cube pyramid, animated diagonal hops, color progression, Coily/ball collision, discs, levels, title/game-over states, keyboard and touch controls, responsive sizing, and synthesized effects. Verified JavaScript parses cleanly. Rejected sprite/audio downloads: procedural assets preserve offline, single-file playability.

## 2026-07-26 — Iteration 1: immediate high-score persistence

Updated the high score the instant a scoring landing surpasses it, rather than only at game over. This makes the score display trustworthy during a long run and protects a score if the tab closes unexpectedly. Kept localStorage deliberately small and offline-first; a server leaderboard was rejected as outside a standalone arcade game.

## 2026-07-26 — Iteration 2: correct life boundary

Fixed the terminal-life check so zero lives ends the game immediately instead of granting a hidden extra attempt. This was found by tracing the decrement path on falls and enemy collisions. Added no continue system because it would dilute the intended arcade pressure.
