/*
 * Q*bert-inspired canvas arcade game.
 *
 * The game intentionally has no build step or external assets so opening index.html is
 * enough to play. Canvas coordinates stay at a stable logical resolution; CSS scales
 * that surface to the available viewport without changing physics precision.
 */
(() => {
  "use strict";
  const canvas = document.querySelector("#game"),
    ctx = canvas.getContext("2d");
  const W = 840,
    H = 960,
    rows = 7,
    dirs = { ul: [-1, -1], ur: [-1, 0], dl: [1, 0], dr: [1, 1] };
  canvas.width = W;
  canvas.height = H;
  // State is replaced on every new run instead of re-binding handlers. That keeps
  // restart deterministic and prevents duplicate input or animation work.
  let audio,
    state,
    last = 0,
    raf,
    high = Number(localStorage.qbertHigh || 0);
  // Offset each row by half a tile to project triangular row/column coordinates
  // into the isometric diamond layout.
  const center = (r, c) => [W / 2 + (c - r / 2) * 92, 230 + r * 72];
  const valid = (r, c) => r >= 0 && r < rows && c >= 0 && c <= r;
  // --- State and run lifecycle -------------------------------------------------
  function reset() {
    state = {
      mode: "title",
      score: 0,
      lives: 3,
      level: 1,
      tiles: Array.from({ length: rows }, (_, r) => Array(r + 1).fill(0)),
      player: {
        r: 0,
        c: 0,
        x: W / 2,
        y: 190,
        tx: W / 2,
        ty: 190,
        hop: 0,
        dir: null,
      },
      enemies: [],
      discs: [true, true],
      timer: 0,
      spawn: 2.4,
      flash: 0,
      particles: [],
      message: "PRESS SPACE OR TAP TO START",
    };
  }
  // --- Audio -------------------------------------------------------------------
  // Sound is best-effort: browsers can deny audio until a gesture, but silence
  // must never block the game.
  function beep(f = 440, d = 0.08, type = "square", vol = 0.04) {
    try {
      audio ??= new AudioContext();
      const o = audio.createOscillator(),
        g = audio.createGain();
      o.type = type;
      o.frequency.value = f;
      g.gain.setValueAtTime(vol, audio.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + d);
      o.connect(g).connect(audio.destination);
      o.start();
      o.stop(audio.currentTime + d);
    } catch (_) {}
  }
  function start() {
    reset();
    state.mode = "play";
    beep(660, 0.12, "triangle");
  }
  // --- Input and player movement -----------------------------------------------
  function move(name) {
    if (state.mode !== "play" || state.player.hop) return;
    const [dr, dc] = dirs[name],
      p = state.player,
      nr = p.r + dr,
      nc = p.c + dc;
    p.dir = name;
    p.hop = 0.22;
    beep(190, 0.05, "square");
    if (!valid(nr, nc)) {
      edge(name);
      return;
    }
    p.nr = nr;
    p.nc = nc;
    [p.tx, p.ty] = center(nr, nc);
  }
  function edge(name) {
    const p = state.player;
    const right = name === "ur" || name === "dr";
    const discIndex = right ? 1 : 0;
    if ((name === "ul" || name === "ur") && state.discs[discIndex]) {
      state.discs[discIndex] = false;
      p.nr = 0;
      p.nc = 0;
      p.tx = W / 2;
      p.ty = 190;
      p.rescue = true;
      beep(880, 0.22, "sine");
    } else {
      p.fall = true;
      beep(90, 0.25, "sawtooth");
    }
  }
  // --- Physics, scoring, and collision -----------------------------------------
  function land() {
    const p = state.player;
    if (p.fall) {
      lose();
      return;
    }
    p.r = p.nr;
    p.c = p.nc;
    p.rescue = false;
    const old = state.tiles[p.r][p.c];
    state.tiles[p.r][p.c] = Math.min(2, old + 1);
    state.score += old === 0 ? 25 : old === 1 ? 50 : 0;
    if (state.score > high) {
      high = state.score;
      localStorage.qbertHigh = high;
    }
    burst(p.x, p.y, "#ffec57");
    beep(old ? 420 : 520, 0.06, "triangle");
    if (state.tiles.flat().every((v) => v === 2)) {
      state.score += 1000 * state.level;
      state.level++;
      state.tiles.forEach((row) => row.fill(0));
      state.enemies = [];
      state.flash = 1.2;
      beep(1040, 0.25, "sine");
    }
  }
  function lose() {
    state.lives--;
    state.player.hop = 0;
    if (state.lives <= 0) {
      state.mode = "over";
      high = Math.max(high, state.score);
      localStorage.qbertHigh = high;
      return;
    }
    state.player = {
      r: 0,
      c: 0,
      x: W / 2,
      y: 190,
      tx: W / 2,
      ty: 190,
      hop: 0,
    };
    state.enemies = [];
    state.timer = 1;
  }
  function burst(x, y, color) {
    for (let i = 0; i < 10; i++)
      state.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 150,
        vy: (Math.random() - 0.7) * 150,
        t: 0.45,
        color,
      });
  }
  function enemyStep(e) {
    const p = state.player;
    let opts = [];
    for (const d of Object.keys(dirs)) {
      const [dr, dc] = dirs[d],
        r = e.r + dr,
        c = e.c + dc;
      if (valid(r, c)) opts.push([r, c]);
    }
    if (!opts.length) {
      e.dead = true;
      return;
    }
    opts.sort(
      (a, b) =>
        Math.hypot(a[0] - p.r, a[1] - p.c) - Math.hypot(b[0] - p.r, b[1] - p.c),
    );
    // Coily deliberately chooses the nearest hop; balls stay unpredictable.
    const n =
      e.kind === "coily" ? opts[0] : opts[(Math.random() * opts.length) | 0];
    e.r = n[0];
    e.c = n[1];
    [e.tx, e.ty] = center(...n);
    e.hop = 0.34;
  }
  // The per-frame cap makes long background-tab pauses harmless: an enemy cannot
  // leap through the player because one delayed frame simulated several seconds.
  function update(dt) {
    const s = state;
    s.flash = Math.max(0, s.flash - dt);
    for (const q of s.particles) {
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.vy += 350 * dt;
      q.t -= dt;
    }
    s.particles = s.particles.filter((q) => q.t > 0);
    if (s.mode !== "play") return;
    if (s.timer > 0) {
      s.timer -= dt;
      return;
    }
    const p = s.player;
    if (p.hop) {
      p.hop -= dt;
      const k = Math.min(1, dt * 8);
      p.x += (p.tx - p.x) * k;
      p.y += (p.ty - p.y) * k;
      if (p.fall) {
        p.y += dt * 500;
        p.x += (p.dir === "ur" || p.dir === "dr" ? 1 : -1) * dt * 360;
      }
      if (p.hop <= 0) land();
    }
    s.spawn -= dt;
    if (s.spawn <= 0) {
      s.spawn = Math.max(0.8, 3.2 - s.level * 0.22);
      const kind = Math.random() < 0.58 ? "coily" : "ball";
      s.enemies.push({
        kind,
        r: 0,
        c: 0,
        x: W / 2,
        y: 190,
        tx: W / 2,
        ty: 190,
        hop: 0.45,
        step: 0.65 + Math.random() * 0.35,
      });
    }
    for (const e of s.enemies) {
      e.step -= dt;
      if (e.hop) {
        e.hop -= dt;
        e.x += (e.tx - e.x) * Math.min(1, dt * 7);
        e.y += (e.ty - e.y) * Math.min(1, dt * 7);
      } else if (e.step <= 0) {
        e.step = Math.max(0.32, 0.75 - s.level * 0.035);
        enemyStep(e);
      }
      if (!e.dead && Math.hypot(e.x - p.x, e.y - p.y) < 35 && !p.hop) {
        burst(p.x, p.y, "#ff4cbb");
        lose();
      }
    }
    s.enemies = s.enemies.filter((e) => !e.dead);
  }
  // --- Rendering ----------------------------------------------------------------
  function cube(r, c) {
    const [x, y] = center(r, c),
      v = state.tiles[r][c],
      top = ["#5042a4", "#8356c7", "#f3d54e"][v],
      left = ["#26206b", "#472883", "#af7d25"][v],
      right = ["#352a83", "#643b9d", "#d9aa32"][v];
    ctx.beginPath();
    ctx.moveTo(x, y - 34);
    ctx.lineTo(x + 46, y - 12);
    ctx.lineTo(x, y + 11);
    ctx.lineTo(x - 46, y - 12);
    ctx.closePath();
    ctx.fillStyle = top;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x - 46, y - 12);
    ctx.lineTo(x, y + 11);
    ctx.lineTo(x, y + 55);
    ctx.lineTo(x - 46, y + 29);
    ctx.closePath();
    ctx.fillStyle = left;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x, y + 11);
    ctx.lineTo(x + 46, y - 12);
    ctx.lineTo(x + 46, y + 29);
    ctx.lineTo(x, y + 55);
    ctx.closePath();
    ctx.fillStyle = right;
    ctx.fill();
  }
  function text(t, y, size = 30, color = "#fff") {
    ctx.textAlign = "center";
    ctx.font = `900 ${size}px system-ui`;
    ctx.fillStyle = color;
    ctx.fillText(t, W / 2, y);
  }
  function drawQ(x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "#ff8b24";
    ctx.beginPath();
    ctx.ellipse(0, -11, 24, 28, 0, 0, 7);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.ellipse(-10, -20, 9, 11, 0, 0, 7);
    ctx.ellipse(10, -20, 9, 11, 0, 0, 7);
    ctx.fill();
    ctx.fillStyle = "#18132f";
    ctx.beginPath();
    ctx.arc(-8, -19, 4, 0, 7);
    ctx.arc(12, -19, 4, 0, 7);
    ctx.fill();
    ctx.strokeStyle = "#ff8b24";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(-14, 12);
    ctx.lineTo(-22, 28);
    ctx.moveTo(14, 12);
    ctx.lineTo(22, 28);
    ctx.stroke();
    ctx.restore();
  }
  function drawEnemy(e) {
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.fillStyle = e.kind === "coily" ? "#d842db" : "#6bdf5a";
    ctx.beginPath();
    ctx.arc(0, -8, 20, 0, 7);
    ctx.fill();
    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.arc(-7, -11, 4, 0, 7);
    ctx.arc(7, -11, 4, 0, 7);
    ctx.fill();
    if (e.kind === "coily") {
      ctx.strokeStyle = "#d842db";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(0, 10);
      ctx.quadraticCurveTo(25, 30, 12, 43);
      ctx.stroke();
    }
    ctx.restore();
  }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#08051b";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#ffffff08";
    for (let i = 0; i < 70; i++)
      ctx.fillRect((i * 83) % W, (i * 131) % H, 2, 2);
    text("Q*BERT", 53, 37, "#ff8b24");
    ctx.textAlign = "left";
    ctx.font = "bold 22px system-ui";
    ctx.fillStyle = "#fff";
    ctx.fillText(`SCORE  ${String(state.score).padStart(6, "0")}`, 28, 90);
    ctx.textAlign = "right";
    ctx.fillText(`HI  ${String(high).padStart(6, "0")}`, W - 28, 90);
    for (let r = rows - 1; r >= 0; r--) for (let c = 0; c <= r; c++) cube(r, c);
    for (const side of [-1, 1]) {
      const i = side === 1 ? 1 : 0;
      if (state.discs[i]) {
        ctx.fillStyle = "#55e8f4";
        ctx.beginPath();
        ctx.ellipse(
          W / 2 + side * (rows * 47 + 24),
          230 + rows * 38,
          35,
          12,
          0,
          0,
          7,
        );
        ctx.fill();
      }
    }
    for (const e of state.enemies) drawEnemy(e);
    if (state.mode === "play" || state.mode === "title")
      drawQ(state.player.x, state.player.y);
    for (const q of state.particles) {
      ctx.globalAlpha = Math.max(0, q.t * 2);
      ctx.fillStyle = q.color;
      ctx.fillRect(q.x, q.y, 5, 5);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = "center";
    ctx.font = "bold 22px system-ui";
    ctx.fillStyle = "#ffec57";
    ctx.fillText(
      `LEVEL ${state.level}   ♥ ${Math.max(0, state.lives)}`,
      W / 2,
      930,
    );
    if (state.flash) text("PYRAMID CLEARED!", 145, 31, "#ffec57");
    if (state.mode === "title") {
      ctx.fillStyle = "#08051bd9";
      ctx.fillRect(0, 115, W, 720);
      text("HOP THE PYRAMID", 500, 38, "#ffec57");
      text("CHANGE EVERY CUBE TWICE", 543, 22);
      text(state.message, 630, 25, "#55e8f4");
      text("ARROWS / TOUCH BUTTONS", 670, 18, "#d9caff");
    }
    if (state.mode === "over") {
      ctx.fillStyle = "#08051be8";
      ctx.fillRect(0, 115, W, 720);
      text("GAME OVER", 495, 51, "#ff4cbb");
      text(`FINAL SCORE ${state.score}`, 545, 26);
      text("TAP HERE OR PRESS SPACE TO RESTART", 630, 21, "#55e8f4");
    }
  }
  // --- Frame loop and DOM lifecycle ---------------------------------------------
  function loop(t) {
    // Clamp elapsed time to preserve playable hop and collision timing after a hitch.
    const dt = Math.min(0.035, (t - last) / 1000 || 0);
    last = t;
    update(dt);
    draw();
    raf = requestAnimationFrame(loop);
  }
  function input(k) {
    const map = {
      ArrowUp: "ul",
      ArrowLeft: "dl",
      ArrowRight: "dr",
      ArrowDown: "ur",
    };
    if (k === " " || k === "Enter") {
      if (state.mode !== "play") start();
      return;
    }
    if (map[k]) {
      k && move(map[k]);
    }
  }

  function handleResize() {
    // CSS owns the responsive scale; a redraw ensures the canvas never presents
    // an old frame while the browser is relaying out its display surface.
    draw();
  }

  // Listeners are attached once at boot; reset() only replaces state.
  addEventListener("keydown", (e) => {
    if (
      [
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        " ",
        "Enter",
      ].includes(e.key)
    )
      e.preventDefault();
    input(e.key);
  });
  canvas.addEventListener("pointerdown", () => {
    if (state.mode !== "play") start();
    canvas.focus();
  });
  addEventListener("resize", handleResize, { passive: true });
  document.querySelectorAll("[data-move]").forEach((b) =>
    b.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      if (state.mode !== "play") start();
      else move(b.dataset.move);
    }),
  );
  reset();
  raf = requestAnimationFrame(loop);
})();
