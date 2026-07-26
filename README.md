# Q*bert — Neon Pyramid

A standalone, Canvas-powered homage to Gottlieb's 1982 arcade classic. Open `index.html` in a modern browser—no install or build step is needed.

## How to play

Hop diagonally across cubes to change each cube twice. Avoid Coily and bouncing balls; use a side disc to escape an upward edge. Clear the pyramid to advance to a faster level.

- Keyboard: arrow keys (each direction maps to a diagonal hop); Space/Enter starts or restarts.
- Touch: use the four large directional buttons; tap the game to start/restart.

## Architecture

`game.js` owns a single requestAnimationFrame loop and one resettable state object. Canvas rendering is procedural; tile positions are derived from pyramid row/column coordinates. Input listeners are bound once, while `reset()` replaces game state to prevent restart leaks. All effects use Web Audio oscillators—there are no asset files.
