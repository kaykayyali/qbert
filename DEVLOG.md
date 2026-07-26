# Development log

## 2026-07-26 — v1 Core build

Built the complete no-build Canvas game: seven-row isometric cube pyramid, animated diagonal hops, color progression, Coily/ball collision, discs, levels, title/game-over states, keyboard and touch controls, responsive sizing, and synthesized effects. Verified JavaScript parses cleanly. Rejected sprite/audio downloads: procedural assets preserve offline, single-file playability.

## 2026-07-26 — Iteration 1: immediate high-score persistence

Updated the high score the instant a scoring landing surpasses it, rather than only at game over. This makes the score display trustworthy during a long run and protects a score if the tab closes unexpectedly. Kept localStorage deliberately small and offline-first; a server leaderboard was rejected as outside a standalone arcade game.

## 2026-07-26 — Iteration 2: correct life boundary

Fixed the terminal-life check so zero lives ends the game immediately instead of granting a hidden extra attempt. This was found by tracing the decrement path on falls and enemy collisions. Added no continue system because it would dilute the intended arcade pressure.

## 2026-07-26 — Iteration 3: accessibility guide

Documented the game’s keyboard, touch, focus, and sound behavior in a dedicated accessibility guide. This makes the existing usable controls discoverable. Rejected an external accessibility library because the game has no dependencies.

## 2026-07-26 — Iteration 4: touch-first control audit

Audited the four native touch buttons for comfortably separated targets, press feedback, and `pointerdown` responsiveness. The controls remain below the canvas to avoid occluding play. Gesture swipes were rejected because diagonal ambiguity is costly in a precision arcade game.

## 2026-07-26 — Iteration 5: frame-time safety

Confirmed the simulation delta is capped at 35 ms before movement and collision work. This prevents a background-tab hitch from skipping across cubes or through a collision. More elaborate fixed-step reconciliation was rejected for this small deterministic animation loop.

## 2026-07-26 — Iteration 6: collision tuning

Kept enemy contact at a compact 35-pixel radius relative to the cube top, avoiding unfair hits while Q*bert is visibly separated. Larger hitboxes were rejected after comparing them against the character’s body width.

## 2026-07-26 — Iteration 7: wave pacing

Reviewed spawn pacing: enemies begin at 3.2 seconds and compress toward 0.8 seconds while their hop cadence accelerates by level. This keeps early games learnable and late games tense. Random instant spawns were rejected as unreadable.

## 2026-07-26 — Iteration 8: visual state feedback

Validated every important state has a visible counterpart: gold completion tiles, cyan discs, pink game over, a level-clear banner, persistent score, and heart count. Color-only status icons were rejected in favor of text plus color.

## 2026-07-26 — Iteration 9: restart lifecycle audit

Verified restart replaces the state object rather than adding listeners or RAF loops; input bindings happen once at boot. This prevents double-speed play and stale enemies. A page reload restart was rejected because it is slower and loses the local high score display.

## 2026-07-26 — Iteration 10: resilient sound design

Checked all synthesized sound calls tolerate browser autoplay restrictions and AudioContext construction failures. Gameplay remains fully functional when audio is unavailable. Asset audio was rejected to maintain offline, no-build delivery.

## 2026-07-26 — Iteration 11: responsive presentation

Confirmed the canvas uses an intrinsic 7:8 aspect ratio with a viewport-bounded width and the control grid reflows independently underneath. A fixed desktop viewport was rejected because it breaks portrait phones.

## 2026-07-26 — Iteration 12: README handoff

Completed concise play, control, startup, and architecture documentation so the repository is usable without setup knowledge. A framework-specific developer guide was rejected because this project intentionally has no build chain.

## 2026-07-26 — Exhausted

Considered adding sprite sheets, remote leaderboards, advertising, online multiplayer, procedural music, a dependency-heavy engine, gesture-only input, and a fixed desktop layout. Each either undermines the offline arcade focus, adds avoidable failure modes, or makes the single-screen game less clear. The finished game has the complete requested core loop, responsive controls, synthesized sound, persistent high score, progressive waves, and reset-safe lifecycle.

## 2026-07-26 — Refactor 1: readable source formatting

Reformatted HTML, CSS, and JavaScript with standard indentation and line wrapping so the implementation can be reviewed and maintained without decoding compressed lines. This was a non-behavioral refactor; syntax validation followed it.

## 2026-07-26 — Refactor 2: subsystem commentary

Added a file-level explanation and comments for state/lifecycle, input, audio, physics/collision, rendering, and the frame loop. Comments explain constraints such as stable logical coordinates, single-bind restarts, and delta-time clamping rather than narrating syntax.

## 2026-07-26 — Refactor 3: explicit responsive redraw

Added a passive resize listener that redraws after the browser changes the CSS-scaled canvas surface, and added a sub-360px touch-control layout. The canvas retains its fixed logical resolution for precise collision math while CSS scales it to any viewport.

## 2026-07-26 — Improvement 13: pause control

Added a P-key pause overlay that freezes the entire simulation without spawning another loop or rebinding controls. This improves interruption handling while keeping the arcade presentation minimal.

## 2026-07-26 — Improvement 14: disc-risk reward

Awarded 250 points when a disc rescues an upward edge hop, with a cyan particle burst to make the bonus legible. Discs now offer a clear score tradeoff rather than only an emergency reset.

## 2026-07-26 — Improvement 15: milestone recovery

Added an extra life every third cleared level. The increasing enemy cadence can otherwise turn a strong run into a sudden dead end; this creates a readable long-run recovery milestone without weakening early difficulty.

## 2026-07-26 — Improvement 16: hop input buffering

Buffered the most recent direction pressed during a hop and consume it immediately after landing. This removes avoidable missed inputs at higher speeds while still allowing only one deliberate next move.
