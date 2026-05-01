/* Ten to Twenty: Three Games, One Memory Map */

const W = 960;
const H = 540;
const SAVE_KEY = "ten-to-twenty-memory-map-v3";

const COLORS = {
  ink: "#05050d",
  night: "#0c1020",
  panel: "#141225",
  plum: "#27162d",
  rose: "#d94d69",
  coral: "#ff7c55",
  teal: "#39d1c2",
  gold: "#ffd36b",
  cream: "#fff0d2",
  green: "#7cff9b",
  danger: "#ff5e75",
  road: "#161922",
  water: "#0b3453"
};

const ASSET_SOURCES = {
  leopard: "leopard-bg.jpg",
  juiceLogo: "logo_juice_palace.png",
  egyptian: "egyptian.png",
  mountain: "scene_mountain.png",
  cruiseScene: "scene_cruise.png",
  rav4: "rav4.png",
  jojo: "jojo.png",
  cruiseBoat: "cruise.png",
  coastGuard: "coast_guard.png",
  digicam: "digicam.png",
  playingCards: "playingcards.png",
  grapes: "grapes.png",
  berry: "berry.png",
  lemonMint: "lemonmint.png",
  mango: "mango.png",
  peach: "peach.png",
  apple: "apple.png",
  watermelon: "watermelon.png"
};

const FRUITS = {
  pomegranate: { label: "Pomegranate", short: "pome", arabic: "رمان", color: "#c63f5c" },
  orange: { label: "Orange", short: "orange", arabic: "برتقال", color: "#f7942f" },
  grape: { label: "Grape", short: "grape", arabic: "عنب", color: "#7e4bd6", asset: "grapes" },
  berry: { label: "Berry", short: "berry", arabic: "توت", color: "#9d2f68", asset: "berry" },
  lemonMint: { label: "Lemon Mint", short: "mint", arabic: "ليمون نعناع", color: "#98d65c", asset: "lemonMint" },
  mango: { label: "Mango", short: "mango", arabic: "مانجو", color: "#ffc247", asset: "mango" },
  peach: { label: "Peach", short: "peach", arabic: "خوخ", color: "#ffb08a", asset: "peach" },
  apple: { label: "Apple", short: "apple", arabic: "تفاح", color: "#8bcf58", asset: "apple" },
  watermelon: { label: "Watermelon", short: "water", arabic: "بطيخ", color: "#44b866", asset: "watermelon" }
};

const WORKER_LINES = [
  "الرمان أكيد.",
  "والله يمكن برتقال.",
  "توت؟ أو عنب؟ واحد منهم.",
  "ليمون نعناع شئ.",
  "مانجو أكيد.",
  "أنا فاكر الطلب، أنتم بس ركزوا معي.",
  "نسبة وتناسب تحتاج ثقة."
];

const dom = {
  loading: document.getElementById("loading-screen"),
  loadingText: document.getElementById("loading-text"),
  home: document.getElementById("home-screen"),
  game: document.getElementById("game-screen"),
  final: document.getElementById("final-screen"),
  canvas: document.getElementById("game-canvas"),
  title: document.getElementById("game-title"),
  hint: document.getElementById("game-hint"),
  status: document.getElementById("status"),
  popup: document.getElementById("popup"),
  popupTitle: document.getElementById("popup-title"),
  popupText: document.getElementById("popup-text"),
  replay: document.getElementById("replay-btn"),
  popupSpots: document.getElementById("popup-spots-btn"),
  back: document.getElementById("back-btn"),
  pause: document.getElementById("pause-btn"),
  mute: document.getElementById("mute-btn"),
  finalBack: document.getElementById("final-back-btn"),
  menuMessage: document.getElementById("menu-message"),
  levelCards: [...document.querySelectorAll(".level-card")],
  particles: document.getElementById("particles")
};

const ctx = dom.canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const assets = {};
const completed = new Set(loadProgress());
const keys = new Set();

let rngState = (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
let currentLevel = 0;
let game = null;
let raf = null;
let lastTime = 0;
let clock = 0;
let paused = false;
let muted = false;
let pointer = { x: W / 2, y: H / 2, down: false };
let floaters = [];
let bursts = [];

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(SAVE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveProgress() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify([...completed]));
  } catch {
    /* localStorage can be disabled; session progress still works. */
  }
}

function preloadAssets() {
  const jobs = Object.entries(ASSET_SOURCES).map(([key, src]) => new Promise((resolve) => {
    const img = new Image();
    const record = { img, ready: false, failed: false };
    assets[key] = record;
    img.onload = () => {
      record.ready = true;
      resolve(record);
    };
    img.onerror = () => {
      record.failed = true;
      resolve(record);
    };
    img.src = src;
  }));

  Promise.all(jobs).then(() => {
    dom.loadingText.textContent = "ready";
    setTimeout(() => dom.loading.classList.add("hidden"), 220);
  });
}

function cue(name) {
  if (muted) return;
  document.dispatchEvent(new CustomEvent("ten-to-twenty-sound", { detail: { name } }));
}

function ambientParticle() {
  const el = document.createElement("span");
  el.className = "particle";
  el.textContent = randomChoice(["♥", "♡", "✦", "·", "Q", "K"]);
  el.style.left = `${Math.random() * 100}vw`;
  el.style.animationDuration = `${7 + Math.random() * 9}s`;
  el.style.fontSize = `${10 + Math.random() * 13}px`;
  el.style.color = randomChoice([COLORS.gold, COLORS.rose, COLORS.teal, COLORS.cream]);
  dom.particles.appendChild(el);
  setTimeout(() => el.remove(), 17000);
}

function bindUi() {
  dom.levelCards.forEach((btn) => {
    btn.addEventListener("click", () => startLevel(Number(btn.dataset.level)));
  });

  dom.back.addEventListener("click", goHome);
  dom.finalBack.addEventListener("click", goHome);
  dom.replay.addEventListener("click", () => {
    dom.popup.classList.add("hidden");
    startLevel(currentLevel);
  });
  dom.popupSpots.addEventListener("click", () => {
    if (completed.size >= 3 && game?.finished) showFinal();
    else goHome();
  });
  dom.pause.addEventListener("click", togglePause);
  dom.mute.addEventListener("click", () => {
    muted = !muted;
    dom.mute.textContent = muted ? "muted" : "mute";
    cue("mute-toggle");
  });

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  dom.canvas.addEventListener("pointerdown", onPointerDown);
  dom.canvas.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
}

function onKeyDown(event) {
  const key = event.key.toLowerCase();
  if (["arrowleft", "arrowright", "arrowup", "arrowdown", " "].includes(key)) {
    event.preventDefault();
  }
  if (!keys.has(key)) {
    if ((key === " " || key === "enter") && currentLevel === 1) stopJuiceRatio();
    if ((key === " " || key === "enter") && currentLevel === 3) beginCruiseCapture();
  }
  keys.add(key);
  if (key === "p") togglePause();
  if (key === "escape") goHome();
}

function onKeyUp(event) {
  const key = event.key.toLowerCase();
  keys.delete(key);
  if ((key === " " || key === "enter") && currentLevel === 3) releaseCruiseCapture();
}

function onPointerDown(event) {
  pointer = { ...point(event), down: true };
  try {
    dom.canvas.setPointerCapture(event.pointerId);
  } catch {
    /* Some browsers do not support capture on all pointer types. */
  }
  if (!game || paused || !dom.popup.classList.contains("hidden")) return;
  if (currentLevel === 1) juicePointerDown(pointer);
  if (currentLevel === 2) roadPointerDown(pointer);
  if (currentLevel === 3) cruisePointerDown(pointer);
}

function onPointerMove(event) {
  pointer = { ...point(event), down: pointer.down };
  if (!game || paused || !dom.popup.classList.contains("hidden")) return;
  if (currentLevel === 2) roadPointerMove(pointer);
  if (currentLevel === 3) cruisePointerMove(pointer);
}

function onPointerUp(event) {
  const p = event.clientX === undefined ? pointer : pointFromClient(event.clientX, event.clientY);
  pointer.down = false;
  if (!game || paused) return;
  if (currentLevel === 2) roadPointerUp(p);
  if (currentLevel === 3) cruisePointerUp(p);
}

function updateMenu() {
  dom.levelCards.forEach((btn) => btn.classList.toggle("done", completed.has(Number(btn.dataset.level))));
  dom.menuMessage.textContent = completed.size ? `${completed.size}/3 memories saved.` : "Pick a spot to start.";
}

function startLevel(level) {
  currentLevel = level;
  paused = false;
  dom.pause.textContent = "pause";
  clock = 0;
  floaters = [];
  bursts = [];
  pointer = { x: W / 2, y: H / 2, down: false };
  dom.popup.classList.add("hidden");
  dom.home.classList.add("hidden");
  dom.final.classList.add("hidden");
  dom.game.classList.remove("hidden");
  document.body.classList.add("game-mode");
  if (level === 1) setupJuice();
  if (level === 2) setupRoad();
  if (level === 3) setupCruise();
  stopLoop();
  startLoop();
}

function goHome() {
  dom.popup.classList.add("hidden");
  dom.game.classList.add("hidden");
  dom.final.classList.add("hidden");
  dom.home.classList.remove("hidden");
  document.body.classList.remove("game-mode");
  stopLoop();
  updateMenu();
}

function showFinal() {
  dom.popup.classList.add("hidden");
  dom.game.classList.add("hidden");
  dom.home.classList.add("hidden");
  dom.final.classList.remove("hidden");
  document.body.classList.remove("game-mode");
  stopLoop();
  updateMenu();
}

function togglePause() {
  if (!game || !dom.popup.classList.contains("hidden")) return;
  paused = !paused;
  dom.pause.textContent = paused ? "resume" : "pause";
}

function setHint(text) {
  dom.hint.textContent = text;
}

function setStatus(text) {
  dom.status.innerHTML = text.replace(/\n/g, "<br>");
}

function startLoop() {
  lastTime = performance.now();
  const loop = (now) => {
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    if (!paused) {
      clock += dt;
      updateGame(dt);
    }
    drawGame();
    if (paused) drawPauseOverlay();
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
}

function stopLoop() {
  if (raf) cancelAnimationFrame(raf);
  raf = null;
}

function updateGame(dt) {
  if (!game || game.finished) {
    updateEffects(dt);
    return;
  }
  if (currentLevel === 1) updateJuice(dt);
  if (currentLevel === 2) updateRoad(dt);
  if (currentLevel === 3) updateCruise(dt);
  updateEffects(dt);
}

function drawGame() {
  if (!game) return;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, W, H);
  if (currentLevel === 1) drawJuice();
  if (currentLevel === 2) drawRoad();
  if (currentLevel === 3) drawCruise();
}

function finishLevel(text) {
  if (!game || game.finished) return;
  game.finished = true;
  cue("memory-saved");
  completed.add(currentLevel);
  saveProgress();
  updateMenu();
  dom.popupTitle.textContent = "memory kept";
  dom.popupText.textContent = text;
  dom.popupSpots.textContent = completed.size >= 3 ? "cards" : "spots";
  dom.popup.classList.remove("hidden");
}

function loseHeart(text) {
  if (!game || game.finished || game.hurtCooldown > 0) return;
  game.hearts -= 1;
  game.hurtCooldown = 0.7;
  shake();
  cue("mistake");
  floatText(text, W / 2, 106, COLORS.danger);
  if (game.hearts <= 0) {
    game.finished = true;
    setHint("Resetting this one.");
    setTimeout(() => startLevel(currentLevel), 850);
  }
}

/* LEVEL 01: FALLING ORDER CHAOS */

function setupJuice() {
  dom.title.textContent = "01";
  setHint("Read him. Mix it right.");
  const recipe = ["pomegranate", "orange", "grape", "berry"];
  game = {
    id: "juice",
    phase: "flash",
    phaseTime: 0,
    hearts: 3,
    hurtCooldown: 0,
    recipe,
    receiptOrder: shuffle(recipe),
    accepted: [],
    mistakes: 0,
    queue: makeJuiceQueue(),
    currentDrop: null,
    dropDelay: 0.4,
    dropsHandled: 0,
    workerLine: "الرمان أكيد.",
    blender: [],
    muddy: 0,
    ratioPos: randRange(0.1, 0.9),
    ratioCenter: randRange(0.54, 0.64),
    ratioDir: maybe(0.5) ? 1 : -1,
    ratioSpeed: randRange(0.95, 1.22),
    ratioDone: false,
    workerBlink: 0
  };
}

function makeJuiceQueue() {
  const decoys = shuffle(["lemonMint", "mango", "peach", "apple", "watermelon"]).slice(0, 4);
  const traps = shuffle(["pomegranate", "lemonMint", "mango"]).slice(0, 2);
  const middle = shuffle(["orange", "grape", "berry", ...decoys, ...traps]);
  const queue = [{ fruit: "pomegranate", line: "الرمان أكيد.", first: true }];
  middle.forEach((fruit) => queue.push({ fruit, line: lineForFruit(fruit) }));
  queue.splice(3 + Math.floor(rand() * 4), 0, { fruit: "pomegranate", line: "رمان مرة ثانية؟ خلاص أهم شي." });
  return queue;
}

function lineForFruit(fruit) {
  if (fruit === "orange") return "والله يمكن برتقال.";
  if (fruit === "grape" || fruit === "berry") return "توت؟ أو عنب؟ واحد منهم.";
  if (fruit === "lemonMint") return "ليمون نعناع شئ.";
  if (fruit === "mango") return "مانجو أكيد.";
  return randomChoice(WORKER_LINES);
}

function updateJuice(dt) {
  game.phaseTime += dt;
  game.hurtCooldown = Math.max(0, game.hurtCooldown - dt);
  game.workerBlink = Math.max(0, game.workerBlink - dt);

  if (game.phase === "flash") {
    const remain = Math.ceil(Math.max(0, 5 - game.phaseTime));
    setStatus(`receipt ${remain}\n${heartText(game.hearts)}`);
    if (game.phaseTime >= 5) {
      game.phase = "mix";
      game.phaseTime = 0;
      setHint("Watch the fruit, not his confidence. Tap only the lies.");
    }
    return;
  }

  if (game.phase === "mix") {
    updateJuiceMix(dt);
    setStatus(`mix ${game.accepted.length}/4\n${heartText(game.hearts)}`);
    return;
  }

  if (game.phase === "ratio") {
    game.ratioPos += game.ratioDir * game.ratioSpeed * dt;
    if (game.ratioPos < 0 || game.ratioPos > 1) {
      game.ratioDir *= -1;
      game.ratioPos = clamp(game.ratioPos, 0, 1);
    }
    setStatus(`ratio\n${heartText(game.hearts)}`);
  }
}

function updateJuiceMix(dt) {
  if (!game.currentDrop) {
    game.dropDelay -= dt;
    if (game.dropDelay <= 0) spawnJuiceDrop();
    return;
  }

  const drop = game.currentDrop;
  if (drop.rejected) {
    drop.x += drop.vx * dt;
    drop.y += drop.vy * dt;
    drop.vy += 520 * dt;
    drop.spin += drop.spinSpeed * dt;
    if (drop.y > H + 80 || drop.x < -80 || drop.x > W + 80) {
      game.currentDrop = null;
      game.dropDelay = 0.28;
    }
    return;
  }

  drop.y += drop.speed * dt;
  drop.spin += drop.spinSpeed * dt;
  if (drop.y >= 316) acceptOrSpillDrop();
}

function spawnJuiceDrop() {
  if (!game.queue.length) {
    const missing = game.recipe.filter((fruit) => !game.accepted.includes(fruit));
    const fillers = shuffle(["lemonMint", "mango", "peach", "apple", "watermelon"]).slice(0, 2);
    game.queue.push(...shuffle([...missing, ...fillers]).map((fruit) => ({ fruit, line: lineForFruit(fruit) })));
  }
  const next = game.queue.shift();
  game.workerLine = next.line;
  game.workerBlink = 0.12;
  const lane = randomChoice([208, 320, 436, 552, 668]);
  game.currentDrop = {
    fruit: next.fruit,
    x: lane + randRange(-22, 22),
    y: -62,
    size: 76,
    speed: Math.min(282, 138 + game.dropsHandled * 17 + randRange(0, 28)),
    revealY: randRange(94, 132),
    spin: 0,
    spinSpeed: randRange(-3, 3),
    rejected: false,
    vx: 0,
    vy: 0
  };
}

function neededFruit(fruit) {
  return game.recipe.includes(fruit) && !game.accepted.includes(fruit);
}

function acceptOrSpillDrop() {
  const drop = game.currentDrop;
  const needed = neededFruit(drop.fruit);
  game.dropsHandled += 1;
  if (needed) {
    game.accepted.push(drop.fruit);
    game.blender.push(drop.fruit);
    burst(480, 330, 14, FRUITS[drop.fruit].color);
    floatText(FRUITS[drop.fruit].short, 480, 292, COLORS.green);
    cue("fruit-good");
  } else {
    game.mistakes += 1;
    game.muddy = clamp(game.muddy + 0.22, 0, 1);
    game.blender.push("mud");
    loseHeart(drop.fruit === "pomegranate" ? "too much pomegranate" : "wrong splash");
  }
  game.currentDrop = null;
  game.dropDelay = 0.34;
  if (game.accepted.length >= 4 && game.hearts > 0) {
    game.phase = "ratio";
    game.phaseTime = 0;
    game.workerLine = "نسبة وتناسب تحتاج ثقة.";
    setHint("Stop the marker inside نسبة وتناسب.");
  }
}

function juicePointerDown(p) {
  if (game.phase === "mix" && game.currentDrop && !game.currentDrop.rejected) {
    const drop = game.currentDrop;
    if (dist(p.x, p.y, drop.x, drop.y) < drop.size * 0.62) rejectJuiceDrop();
  }
  if (game.phase === "ratio") stopJuiceRatio();
}

function rejectJuiceDrop() {
  const drop = game.currentDrop;
  const needed = neededFruit(drop.fruit);
  drop.rejected = true;
  drop.vx = drop.x < W / 2 ? -260 : 260;
  drop.vy = -260;
  game.dropsHandled += 1;
  if (needed) {
    game.mistakes += 1;
    game.queue.splice(Math.floor(rand() * (game.queue.length + 1)), 0, { fruit: drop.fruit, line: lineForFruit(drop.fruit) });
    loseHeart("rejected truth");
  } else {
    floatText("caught it", drop.x, drop.y - 20, COLORS.green);
    burst(drop.x, drop.y, 10, COLORS.teal);
    cue("fruit-reject");
  }
}

function stopJuiceRatio() {
  if (!game || currentLevel !== 1 || game.phase !== "ratio" || game.ratioDone) return;
  game.ratioDone = true;
  const zone = juiceRatioZone();
  const distance = Math.abs(game.ratioPos - zone.center);
  if (distance <= zone.width * 0.28) {
    burst(W / 2, 356, 34, COLORS.green);
    finishLevel("He still asked about pomegranate, but the cup came out perfectly yours.");
  } else if (distance <= zone.width / 2) {
    burst(W / 2, 356, 22, COLORS.gold);
    finishLevel("Balanced enough. Somehow even his pomegranate obsession helped.");
  } else {
    game.muddy = clamp(game.muddy + 0.2, 0, 1);
    shake();
    finishLevel("The ratio limped across the line. He nodded like pomegranate did all the work.");
  }
}

function juiceRatioZone() {
  return {
    center: game.ratioCenter,
    width: clamp(0.17 - game.mistakes * 0.032, 0.075, 0.17)
  };
}

function drawJuice() {
  drawJuiceScene();
  drawJuiceWorker();
  drawJuiceBlender();
  if (game.phase === "flash") drawJuiceReceipt();
  if (game.phase === "mix") drawJuiceDrop();
  if (game.phase === "ratio") drawJuiceRatio();
  drawJuiceHud();
  drawHearts(812, 28, game.hearts);
  drawEffects();
}

function drawJuiceScene() {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#160b24");
  sky.addColorStop(0.55, "#24172c");
  sky.addColorStop(1, "#0c1020");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  drawImageCover("juiceLogo", 66, 42, 308, 136);
  ctx.fillStyle = "rgba(5,5,13,.58)";
  ctx.fillRect(62, 38, 316, 144);
  drawImageCover("juiceLogo", 74, 48, 292, 124);
  ctx.fillStyle = "rgba(255,211,107,.16)";
  for (let i = 0; i < 11; i += 1) ctx.fillRect(420 + i * 42, 82 + Math.sin(clock + i) * 4, 22, 52);
  ctx.fillStyle = "#211629";
  ctx.fillRect(0, 365, W, 175);
  drawImageCover("leopard", 0, 365, W, 54);
  ctx.fillStyle = "rgba(5,5,13,.42)";
  ctx.fillRect(0, 365, W, 54);
  ctx.fillStyle = "#110c18";
  ctx.fillRect(0, 420, W, 120);
  drawPixelPanel(42, 206, 246, 132, "juice palace");
  ctx.fillStyle = COLORS.cream;
  ctx.font = "bold 12px Courier New";
  ctx.fillText("order: نسبة وتناسب", 64, 248);
  ctx.fillText("reject the lies before the blender", 64, 274);
}

function drawJuiceWorker() {
  const bob = Math.sin(clock * 2.1) * 4;
  if (!drawImageContain("egyptian", 628, 104 + bob, 172, 266)) {
    drawPerson(710, 266 + bob, COLORS.gold, COLORS.rose);
  }
  drawSpeechBubble(554, 46, 330, 76, game.workerLine);
}

function drawJuiceBlender() {
  ctx.fillStyle = "rgba(255,240,210,.11)";
  ctx.fillRect(414, 270, 132, 110);
  ctx.strokeStyle = COLORS.cream;
  ctx.lineWidth = 3;
  ctx.strokeRect(414, 270, 132, 110);
  ctx.fillStyle = "#29324a";
  ctx.fillRect(432, 382, 96, 24);
  ctx.fillStyle = "#10131d";
  ctx.fillRect(448, 406, 64, 26);
  const liquidH = 92 * clamp(game.accepted.length / 4, 0, 1);
  if (liquidH > 0 || game.muddy > 0) {
    const grad = ctx.createLinearGradient(418, 374, 418, 276);
    grad.addColorStop(0, mixColor("#7e4bd6", "#5b4031", game.muddy));
    grad.addColorStop(0.45, mixColor("#f7942f", "#5b4031", game.muddy));
    grad.addColorStop(1, mixColor("#c63f5c", "#5b4031", game.muddy));
    ctx.fillStyle = grad;
    ctx.fillRect(420, 374 - liquidH, 120, liquidH);
  }
  ctx.fillStyle = COLORS.gold;
  ctx.font = "bold 11px Courier New";
  center(`${game.accepted.length}/4`, 480, 404);
}

function drawJuiceReceipt() {
  ctx.fillStyle = "rgba(255,246,220,.96)";
  ctx.fillRect(330, 96, 300, 250);
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 3;
  ctx.strokeRect(330, 96, 300, 250);
  ctx.fillStyle = COLORS.plum;
  ctx.font = "bold 24px Courier New";
  center("نسبة وتناسب", 480, 138);
  game.receiptOrder.forEach((fruit, index) => {
    drawFruit(fruit, 382, 178 + index * 38, 0.7);
    ctx.fillStyle = COLORS.plum;
    ctx.font = "bold 16px Courier New";
    ctx.fillText(`${index + 1}. ${FRUITS[fruit].label}`, 420, 184 + index * 38);
  });
  ctx.fillStyle = "rgba(39,22,45,.72)";
  ctx.fillRect(358, 304, 244, 20);
  ctx.fillStyle = COLORS.cream;
  ctx.font = "bold 11px Courier New";
  center("memorize it, then it disappears", 480, 318);
}

function drawJuiceDrop() {
  if (!game.currentDrop) return;
  const d = game.currentDrop;
  ctx.save();
  ctx.translate(d.x, d.y);
  ctx.rotate(d.spin);
  if (d.y < d.revealY) {
    ctx.fillStyle = "rgba(255,240,210,.88)";
    ctx.fillRect(-34, -28, 68, 56);
    ctx.strokeStyle = COLORS.gold;
    ctx.strokeRect(-34, -28, 68, 56);
    ctx.fillStyle = COLORS.plum;
    ctx.font = "bold 18px Courier New";
    center("؟", 0, 8);
  } else {
    drawFruit(d.fruit, 0, 0, 1.15);
  }
  ctx.restore();
  if (d.y < d.revealY) {
    ctx.fillStyle = "rgba(5,5,13,.76)";
    ctx.fillRect(d.x - 58, d.y + 36, 116, 22);
    ctx.strokeStyle = "rgba(255,211,107,.38)";
    ctx.strokeRect(d.x - 58, d.y + 36, 116, 22);
    ctx.fillStyle = COLORS.cream;
    ctx.font = "bold 10px Courier New";
    center("listen first", d.x, d.y + 51);
  }
}

function drawJuiceRatio() {
  const bar = { x: 242, y: 130, w: 476, h: 34 };
  const zone = juiceRatioZone();
  drawPixelPanel(212, 96, 536, 112, "ratio lock");
  ctx.fillStyle = "rgba(0,0,0,.55)";
  ctx.fillRect(bar.x, bar.y, bar.w, bar.h);
  ctx.strokeStyle = COLORS.cream;
  ctx.strokeRect(bar.x, bar.y, bar.w, bar.h);
  ctx.fillStyle = "rgba(124,255,155,.32)";
  ctx.fillRect(bar.x + bar.w * (zone.center - zone.width / 2), bar.y, bar.w * zone.width, bar.h);
  ctx.strokeStyle = COLORS.green;
  ctx.strokeRect(bar.x + bar.w * (zone.center - zone.width / 2), bar.y, bar.w * zone.width, bar.h);
  ctx.fillStyle = COLORS.gold;
  ctx.fillRect(bar.x + bar.w * game.ratioPos - 4, bar.y - 10, 8, bar.h + 20);
  ctx.fillStyle = COLORS.cream;
  ctx.font = "bold 14px Courier New";
  center("نسبة وتناسب", W / 2, 191);
}

function drawJuiceHud() {
  drawPixelPanel(34, 28, 174, 82, "digicam");
  ctx.fillStyle = COLORS.cream;
  ctx.font = "bold 11px Courier New";
  ctx.fillText(`mistakes ${game.mistakes}`, 58, 78);
}

/* LEVEL 02: RAV4 ROAD REUNION */

function setupRoad() {
  dom.title.textContent = "02";
  setHint("Park close. Build smart. Hold the vibe.");
  game = {
    id: "road",
    phase: "drive",
    hearts: 3,
    hurtCooldown: 0,
    distance: 1350,
    maxDistance: 1350,
    timer: 50,
    roadScroll: 0,
    player: { x: 480, y: 444, targetX: 480, w: 62, h: 96, boost: 0, slow: 0, invuln: 0 },
    cards: [],
    traffic: [],
    cardTimer: 0.2,
    trafficTimer: 1.0,
    noCardTime: 0,
    streak: 0,
    driftShield: false,
    lastSpecial: null,
    specialClock: 0,
    patrol: { active: false, cooldown: 1.25, x: -120, y: 392, nextY: randRange(334, 420), dir: 1, speed: 280, t: randRange(0, 6) },
    winAnim: 0
  };
}

function updateRoad(dt) {
  game.hurtCooldown = Math.max(0, game.hurtCooldown - dt);
  if (game.phase === "park") {
    game.winAnim += dt;
    setStatus(`parked\n${heartText(game.hearts)}`);
    if (game.winAnim > 2.4) finishLevel("Jojo stayed. The RAV4 found the spot beside it.");
    return;
  }

  moveRoadPlayer(dt);
  const progress = 1 - clamp(game.distance / game.maxDistance, 0, 1);
  const roadSpeed = 158 + progress * 72 + (game.player.boost > 0 ? 66 : 0) - (game.player.slow > 0 ? 56 : 0);
  const travel = 78 + progress * 28 + (game.player.boost > 0 ? 46 : 0) - (game.player.slow > 0 ? 34 : 0);
  game.distance -= Math.max(42, travel) * dt;
  game.timer -= dt;
  game.roadScroll = (game.roadScroll + roadSpeed * dt) % 80;
  game.player.boost = Math.max(0, game.player.boost - dt);
  game.player.slow = Math.max(0, game.player.slow - dt);
  game.player.invuln = Math.max(0, game.player.invuln - dt);
  game.noCardTime += dt;
  game.specialClock += dt;

  updateRoadSpawns(dt, roadSpeed);
  updatePatrolCar(dt, progress);
  updateRoadCollisions();
  updateJojoDrift();

  if (game.timer <= 0) {
    game.timer = 16;
    game.distance = Math.min(game.maxDistance + 120, game.distance + 72);
    game.streak = 0;
    floatText("Jojo drifted", W / 2, 112, COLORS.gold);
    shake();
  }

  if (game.distance <= 0 && game.hearts > 0) {
    game.phase = "park";
    game.winAnim = 0;
    burst(480, 270, 34, COLORS.rose);
    cue("parked");
  }

  setStatus(`distance ${Math.ceil(Math.max(0, game.distance))}\ntime ${Math.ceil(game.timer)} · ${heartText(game.hearts)}`);
}

function moveRoadPlayer(dt) {
  let steer = 0;
  if (keys.has("arrowleft") || keys.has("a")) steer -= 1;
  if (keys.has("arrowright") || keys.has("d")) steer += 1;
  if (steer) game.player.targetX = clamp(game.player.x + steer * 430 * dt, 278, 682);
  game.player.x = lerp(game.player.x, game.player.targetX, 1 - Math.pow(0.001, dt));
}

function roadPointerDown(p) {
  pointer.down = true;
  game.player.targetX = clamp(p.x, 278, 682);
}

function roadPointerMove(p) {
  if (pointer.down) game.player.targetX = clamp(p.x, 278, 682);
}

function roadPointerUp() {
  pointer.down = false;
}

function updateRoadSpawns(dt, roadSpeed) {
  game.cardTimer -= dt;
  game.trafficTimer -= dt;
  if (game.cardTimer <= 0) {
    spawnRoadCard();
    game.cardTimer = randRange(0.48, 0.86);
  }
  if (game.trafficTimer <= 0) {
    spawnTraffic();
    game.trafficTimer = randRange(1.35, 2.05);
  }
  game.cards.forEach((card) => { card.y += roadSpeed * dt; card.wobble += dt; });
  game.traffic.forEach((car) => { car.y += roadSpeed * dt; });
  game.cards = game.cards.filter((card) => card.y < H + 80);
  game.traffic = game.traffic.filter((car) => car.y < H + 110);
}

function spawnRoadCard() {
  const roll = rand();
  let label = randomChoice(["7♣", "9♦", "A♣", "4♦", "10♣"]);
  let special = false;
  if (roll > 0.72) {
    label = maybe(0.5) ? "Q♥" : "K♠";
    special = true;
  }
  const lanes = [304, 392, 480, 568, 656];
  game.cards.push({
    label,
    special,
    x: randomChoice(lanes) + randRange(-12, 12),
    y: -44,
    w: 42,
    h: 58,
    wobble: randRange(0, 6)
  });
}

function spawnTraffic() {
  const lanes = [304, 392, 480, 568, 656];
  game.traffic.push({
    x: randomChoice(lanes) + randRange(-10, 10),
    y: -96,
    w: 50,
    h: 76,
    color: randomChoice(["#384155", "#6a3147", "#2a5c60", "#775c31"])
  });
}

function updatePatrolCar(dt, progress) {
  const patrol = game.patrol;
  patrol.t += dt;
  if (!patrol.active) {
    patrol.cooldown -= dt;
    if (patrol.cooldown <= 0) {
      patrol.active = true;
      patrol.y = patrol.nextY;
      patrol.dir = maybe(0.5) ? 1 : -1;
      patrol.x = patrol.dir > 0 ? 172 : 788;
      patrol.speed = 250 + progress * 120 + randRange(0, 32);
    }
    return;
  }
  patrol.x += patrol.dir * patrol.speed * dt;
  if ((patrol.dir > 0 && patrol.x > 800) || (patrol.dir < 0 && patrol.x < 160)) {
    patrol.active = false;
    patrol.cooldown = randRange(1.8, 3.0 - progress * 0.5);
    patrol.nextY = randRange(334, 420);
  }
}

function updateRoadCollisions() {
  const playerBox = { x: game.player.x - 25, y: game.player.y - 42, w: 50, h: 84 };
  game.cards.forEach((card) => {
    if (card.collected) return;
    if (rectsOverlap(playerBox, { x: card.x - 20, y: card.y - 28, w: 40, h: 56 })) collectRoadCard(card);
  });
  game.traffic.forEach((car) => {
    if (car.hit) return;
    if (rectsOverlap(playerBox, { x: car.x - car.w / 2, y: car.y - car.h / 2, w: car.w, h: car.h })) {
      car.hit = true;
      game.player.slow = 1.5;
      game.streak = 0;
      floatText("slow", game.player.x, game.player.y - 70, COLORS.gold);
      cue("slow");
    }
  });
  const patrol = roadPatrolBox();
  if (game.player.invuln <= 0 && rectsOverlap(playerBox, patrol)) {
    game.player.invuln = 1.4;
    game.player.slow = 3;
    game.streak = 0;
    loseHeart("patrol clipped you");
  }
  game.cards = game.cards.filter((card) => !card.collected);
}

function collectRoadCard(card) {
  card.collected = true;
  game.timer = Math.min(55, game.timer + (card.special ? 2.4 : 1.8));
  game.distance = Math.max(0, game.distance - (card.special ? 92 : 44));
  game.player.boost = card.special ? 2.4 : 1.9;
  game.noCardTime = 0;
  game.streak += 1;
  if (game.streak >= 3) game.driftShield = true;
  burst(card.x, card.y, card.special ? 20 : 10, card.special ? COLORS.rose : COLORS.gold);
  floatText(card.special ? "+2.4s" : "+1.8s", card.x, card.y - 20, COLORS.green);
  cue("card");
  if (card.special) {
    if (game.lastSpecial && game.lastSpecial !== card.label && game.specialClock < 4.5) {
      burst(W / 2, 180, 34, COLORS.rose);
      floatText("Q + K", W / 2, 160, COLORS.rose);
    }
    game.lastSpecial = card.label;
    game.specialClock = 0;
  }
}

function updateJojoDrift() {
  if (game.noCardTime < 13) return;
  game.noCardTime = 0;
  if (game.driftShield) {
    game.driftShield = false;
    floatText("Jojo waited", W / 2, 112, COLORS.green);
    burst(480, 96, 16, COLORS.rose);
  } else {
    game.distance = Math.min(game.maxDistance + 140, game.distance + 78);
    floatText("Jojo rolled forward", W / 2, 112, COLORS.gold);
  }
  game.streak = 0;
}

function roadPatrolBox() {
  if (!game.patrol.active) return { x: -999, y: -999, w: 0, h: 0 };
  return { x: game.patrol.x - 38, y: game.patrol.y - 24, w: 76, h: 48 };
}

function drawRoad() {
  drawRoadScene();
  if (game.phase === "park") drawRoadParkWin();
  else drawRoadObjects();
  drawRoadHud();
  drawHearts(812, 28, game.hearts);
  drawEffects();
}

function drawRoadScene() {
  ctx.fillStyle = "#060811";
  ctx.fillRect(0, 0, W, H);
  drawImageCover("mountain", 0, 0, W, H);
  ctx.fillStyle = "rgba(4,5,12,.68)";
  ctx.fillRect(0, 0, W, H);
  drawImageCover("leopard", 0, 0, 210, H);
  drawImageCover("leopard", 750, 0, 210, H);
  ctx.fillStyle = "rgba(5,5,13,.58)";
  ctx.fillRect(0, 0, 210, H);
  ctx.fillRect(750, 0, 210, H);
  ctx.fillStyle = COLORS.road;
  ctx.fillRect(220, 0, 520, H);
  ctx.strokeStyle = "rgba(255,240,210,.34)";
  ctx.lineWidth = 4;
  ctx.strokeRect(220, -4, 520, H + 8);
  ctx.strokeStyle = "rgba(255,211,107,.42)";
  ctx.lineWidth = 3;
  for (let y = -80 + game.roadScroll; y < H + 80; y += 80) {
    ctx.beginPath();
    ctx.moveTo(392, y);
    ctx.lineTo(392, y + 38);
    ctx.moveTo(568, y);
    ctx.lineTo(568, y + 38);
    ctx.stroke();
  }
  drawImageContain("jojo", 440, 42, 80, 120);
  if (!assets.jojo.ready) drawTopCar(480, 104, "#eee5d7", "J");
  drawPixelHeart(456, 168, COLORS.rose, 0.5);
  drawPixelHeart(494, 168, COLORS.rose, 0.5);
}

function drawRoadObjects() {
  game.cards.forEach(drawRoadCard);
  game.traffic.forEach(drawTrafficCar);
  drawPatrolCar();
  drawRav4(game.player.x, game.player.y, game.player.invuln > 0);
}

function drawRoadCard(card) {
  ctx.save();
  ctx.translate(card.x, card.y + Math.sin(card.wobble * 3) * 4);
  ctx.rotate(Math.sin(card.wobble * 2) * 0.08);
  drawPlayingCard(-18, -26, card.label, 0.55);
  ctx.restore();
}

function drawTrafficCar(car) {
  drawTopCar(car.x, car.y, car.hit ? "#343843" : car.color, "");
}

function drawPatrolCar() {
  if (!game.patrol.active) {
    if (game.patrol.cooldown < 0.95) {
      const y = game.patrol.nextY;
      const a = 0.22 + Math.sin(clock * 14) * 0.12;
      ctx.fillStyle = `rgba(255,211,107,${a})`;
      ctx.fillRect(222, y - 24, 516, 48);
      ctx.fillStyle = COLORS.gold;
      ctx.font = "bold 11px Courier New";
      center("patrol crossing", W / 2, y + 4);
    }
    return;
  }
  const box = roadPatrolBox();
  ctx.fillStyle = "rgba(255,211,107,.1)";
  ctx.fillRect(box.x - 18, box.y - 8, box.w + 36, box.h + 16);
  drawTopCar(box.x + box.w / 2, box.y + box.h / 2, "#e8f1fb", "P");
  ctx.fillStyle = COLORS.danger;
  ctx.fillRect(box.x + 18, box.y + 26, box.w - 36, 7);
}

function drawRav4(x, y, blink) {
  ctx.globalAlpha = blink && Math.floor(clock * 14) % 2 === 0 ? 0.48 : 1;
  if (!drawImageContain("rav4", x - 38, y - 62, 76, 124)) drawTopCar(x, y, "#d7ebf0", "R");
  ctx.globalAlpha = 1;
}

function drawRoadHud() {
  drawPixelPanel(30, 26, 238, 122, "digicam road");
  const progress = 1 - clamp(game.distance / game.maxDistance, 0, 1);
  drawMeter(58, 78, 142, 12, progress, COLORS.teal);
  drawMeter(58, 108, 142, 12, game.timer / 45, game.timer < 8 ? COLORS.danger : COLORS.gold);
  ctx.fillStyle = COLORS.cream;
  ctx.font = "bold 11px Courier New";
  ctx.fillText("distance", 208, 88);
  ctx.fillText("timer", 208, 118);
  ctx.fillText(game.driftShield ? "3-card promise held" : `streak ${game.streak}`, 58, 140);
}

function drawRoadParkWin() {
  const t = clamp(game.winAnim / 1.4, 0, 1);
  drawRav4(430 - (1 - t) * 140, 330, false);
  drawImageContain("jojo", 490 + (1 - t) * 140, 270, 82, 126);
  if (!assets.jojo.ready) drawTopCar(532 + (1 - t) * 140, 332, "#eee5d7", "J");
  drawPlayingCard(250 + t * 130, 130, "Q♥", 0.9);
  drawPlayingCard(668 - t * 130, 130, "K♠", 0.9);
  if (game.winAnim > 1.1) {
    drawImageContain("playingCards", 394, 96, 172, 116);
    burst(480, 230, 2, COLORS.rose);
  }
  ctx.strokeStyle = `rgba(255,211,107,${0.25 + Math.sin(clock * 8) * 0.15})`;
  ctx.lineWidth = 8;
  ctx.strokeRect(230, 62, 500, 392);
}

/* LEVEL 03: CRUISE DIGICAM */

function setupCruise() {
  dom.title.textContent = "03";
  setHint("Frame the memory. Dodge the patrol.");
  game = {
    id: "cruise",
    phase: "shoot",
    hearts: 3,
    hurtCooldown: 0,
    score: 0,
    momentCount: 0,
    queen: false,
    king: false,
    aim: { x: W / 2, y: H / 2 },
    holding: false,
    charge: 0,
    overheld: false,
    exposure: 0,
    shakeLevel: 0,
    lastAim: { x: W / 2, y: H / 2 },
    items: makeCruiseItems(),
    spawnTimer: 1.4,
    guard: makeGuardPass(),
    guardWait: randRange(1.4, 2.8),
    waterScroll: 0,
    film: [],
    flash: 0,
    completeTimer: 0
  };
}

function makeCruiseItems() {
  const labels = shuffle(["wave reflection", "floating lantern", "little smile", "silhouette", "almost-kiss", "ripple pattern", "blurry cute"]);
  const items = labels.slice(0, 7).map((label, i) => makeCruiseItem("moment", W + 120 + i * randRange(120, 178), label));
  items.splice(2, 0, makeCruiseItem("queen", W + 520, "Q♥"));
  items.splice(5, 0, makeCruiseItem("king", W + 960, "K♠"));
  return items;
}

function makeCruiseItem(kind, x, label) {
  const value = kind === "moment" ? randomChoice([1, 2, 2, 3]) : kind === "minor" ? 1 : 2;
  return {
    kind,
    label,
    x,
    y: randRange(210, 410),
    value,
    hold: kind === "minor" ? 0.58 : kind === "queen" || kind === "king" ? 0.72 : 0.56 + value * 0.12 + randRange(-0.05, 0.08),
    wobble: randRange(0, 6),
    captured: false
  };
}

function makeGuardPass() {
  const fromRight = maybe(0.7);
  return {
    active: false,
    x: fromRight ? W + 140 : -140,
    y: randRange(240, 330),
    vx: fromRight ? -randRange(112, 150) : randRange(106, 142),
    dir: fromRight ? -1 : 1,
    sweep: randRange(0, 6)
  };
}

function updateCruise(dt) {
  game.hurtCooldown = Math.max(0, game.hurtCooldown - dt);
  game.waterScroll = (game.waterScroll + dt * 64) % 120;
  game.flash = Math.max(0, game.flash - dt * 2.2);
  moveCruiseAim(dt);
  updateCruiseItems(dt);
  updateCruiseGuard(dt);
  updateCruiseCharge(dt);
  if (game.phase === "complete") {
    game.completeTimer += dt;
    if (game.completeTimer > 1.2) finishLevel("The filmstrip kept what the patrol missed.");
  }
  setStatus(`photos ${game.momentCount}/5 · Q ${game.queen ? "yes" : "no"} · K ${game.king ? "yes" : "no"}\nlight ${Math.round(game.exposure * 100)}% · ${heartText(game.hearts)}`);
}

function moveCruiseAim(dt) {
  const oldX = game.aim.x;
  const oldY = game.aim.y;
  let dx = 0;
  let dy = 0;
  if (keys.has("arrowleft") || keys.has("a")) dx -= 1;
  if (keys.has("arrowright") || keys.has("d")) dx += 1;
  if (keys.has("arrowup") || keys.has("w")) dy -= 1;
  if (keys.has("arrowdown") || keys.has("s")) dy += 1;
  const len = Math.hypot(dx, dy) || 1;
  game.aim.x = clamp(game.aim.x + (dx / len) * 220 * dt, 88, W - 88);
  game.aim.y = clamp(game.aim.y + (dy / len) * 220 * dt, 150, H - 96);
  const moved = Math.hypot(game.aim.x - oldX, game.aim.y - oldY);
  if (game.holding && moved > 0.2) game.shakeLevel = clamp(game.shakeLevel + moved * 0.006, 0, 1.2);
  game.lastAim = { x: game.aim.x, y: game.aim.y };
}

function updateCruiseItems(dt) {
  const speed = 78;
  game.items.forEach((item) => {
    item.x -= speed * dt;
    item.wobble += dt;
  });
  game.items = game.items.filter((item) => item.x > -90 && !item.captured);
  game.spawnTimer -= dt;
  if (game.spawnTimer <= 0) {
    const kind = randomCruiseSpawnKind();
    game.items.push(makeCruiseItem(kind, W + randRange(60, 180), kind === "minor" ? randomChoice(["6♣", "9♦", "A♣"]) : randomChoice(["wave reflection", "quiet corner", "tiny smile", "ripple"])));
    game.spawnTimer = randRange(1.0, 1.8);
  }
  if (!game.queen && !game.items.some((item) => item.kind === "queen")) game.items.push(makeCruiseItem("queen", W + 220, "Q♥"));
  if (!game.king && !game.items.some((item) => item.kind === "king")) game.items.push(makeCruiseItem("king", W + 420, "K♠"));
}

function randomCruiseSpawnKind() {
  const r = rand();
  if (r > 0.78) return "minor";
  return "moment";
}

function updateCruiseGuard(dt) {
  const guard = game.guard;
  if (!guard.active) {
    game.guardWait -= dt;
    if (game.guardWait <= 0) {
      game.guard = makeGuardPass();
      game.guard.active = true;
    }
    return;
  }
  guard.x += guard.vx * dt;
  guard.y += Math.sin(clock * 1.3 + guard.sweep) * 12 * dt;
  guard.sweep += dt;
  if ((guard.dir < 0 && guard.x < -180) || (guard.dir > 0 && guard.x > W + 180)) {
    game.guard = makeGuardPass();
    game.guardWait = randRange(2.0, 3.6);
  }
}

function updateCruiseCharge(dt) {
  if (!game.holding) {
    game.charge = Math.max(0, game.charge - dt * 0.5);
    game.exposure = Math.max(0, game.exposure - dt * 0.48);
    game.shakeLevel = Math.max(0, game.shakeLevel - dt * 0.55);
    return;
  }
  game.charge += dt;
  game.shakeLevel = Math.max(0, game.shakeLevel - dt * 0.28);
  if (cruiseBeamHitsFrame(cruiseFrame())) {
    game.exposure = clamp(game.exposure + dt * 1.15, 0, 1);
    setHint("Light on the frame. Wait it out or release later.");
  } else {
    game.exposure = Math.max(0, game.exposure - dt * 0.42);
  }
  if (game.charge > 1.15) game.overheld = true;
  if (game.charge > 1.42) {
    game.charge = 1.42;
    shake();
  }
  if (game.exposure >= 1) {
    game.holding = false;
    game.charge = 0;
    game.exposure = 0.18;
    loseHeart("caught charging");
  }
}

function cruisePointerDown(p) {
  game.aim.x = p.x;
  game.aim.y = p.y;
  beginCruiseCapture();
}

function cruisePointerMove(p) {
  if (game.holding) game.shakeLevel = clamp(game.shakeLevel + dist(game.aim.x, game.aim.y, p.x, p.y) * 0.007, 0, 1.2);
  game.aim.x = clamp(p.x, 88, W - 88);
  game.aim.y = clamp(p.y, 150, H - 96);
}

function cruisePointerUp() {
  releaseCruiseCapture();
}

function beginCruiseCapture() {
  if (!game || currentLevel !== 3 || game.phase !== "shoot" || game.holding) return;
  game.holding = true;
  game.charge = 0;
  game.overheld = false;
  cue("camera-charge");
}

function releaseCruiseCapture() {
  if (!game || currentLevel !== 3 || !game.holding) return;
  const charge = game.charge;
  game.holding = false;
  game.charge = 0;
  const frame = cruiseFrame();
  const target = activeCruiseTarget(frame);
  if (charge < 0.26) {
    floatText("too quick", game.aim.x, game.aim.y - 58, COLORS.gold);
    return;
  }
  if (game.overheld || charge > 1.16) {
    floatText("camera shook", game.aim.x, game.aim.y - 58, COLORS.danger);
    game.shakeLevel = clamp(game.shakeLevel + 0.35, 0, 1.2);
    shake();
    cue("camera-shake");
    return;
  }
  if (game.shakeLevel > 0.64) {
    floatText("too blurry", game.aim.x, game.aim.y - 58, COLORS.danger);
    game.shakeLevel = Math.max(0.2, game.shakeLevel - 0.3);
    shake();
    return;
  }
  if (cruiseBeamHitsFrame(frame)) {
    if (target) target.captured = true;
    game.exposure = 0.25;
    loseHeart("flash seen");
    return;
  }
  if (!target) {
    floatText("empty frame", game.aim.x, game.aim.y - 58, COLORS.gold);
    cue("empty-photo");
    return;
  }
  if (charge < target.hold * 0.58) {
    floatText("underexposed", game.aim.x, game.aim.y - 58, COLORS.gold);
    return;
  }
  if (charge > target.hold + 0.42) {
    floatText("missed the moment", game.aim.x, game.aim.y - 58, COLORS.gold);
    return;
  }
  captureCruiseTarget(target, Math.abs(charge - target.hold) <= 0.16 && game.shakeLevel < 0.36);
}

function activeCruiseTarget(frame) {
  return game.items.find((item) => !item.captured && item.x >= frame.x && item.x <= frame.x + frame.w && item.y >= frame.y && item.y <= frame.y + frame.h);
}

function captureCruiseTarget(target, perfect) {
  target.captured = true;
  game.flash = 1;
  const points = perfect ? 3 : 1;
  if (target.kind === "moment") {
    game.momentCount += 1;
    game.score += points;
    game.film.push(perfect ? "★" : "·");
    floatText(perfect ? "+3 crisp" : "+1 saved", target.x, target.y - 32, perfect ? COLORS.green : COLORS.gold);
  } else if (target.kind === "queen") {
    game.queen = true;
    game.film.push("Q");
    floatText("queen kept", target.x, target.y - 32, COLORS.rose);
  } else if (target.kind === "king") {
    game.king = true;
    game.film.push("K");
    floatText("king kept", target.x, target.y - 32, COLORS.gold);
  } else {
    game.score += 1;
    game.film.push("♣");
    floatText("+1", target.x, target.y - 32, COLORS.teal);
  }
  burst(target.x, target.y, perfect ? 22 : 12, perfect ? COLORS.green : COLORS.gold);
  cue("photo");
  if (game.momentCount >= 5 && game.queen && game.king) {
    game.phase = "complete";
    game.completeTimer = 0;
    setHint("Filmstrip full. Hold the frame.");
  }
}

function cruiseFrame() {
  return { x: game.aim.x - 86, y: game.aim.y - 56, w: 172, h: 104 };
}

function cruiseSpotlight() {
  const guard = game.guard;
  const angle = guard.dir < 0 ? Math.PI + Math.sin(clock * 1.4 + guard.sweep) * 0.48 : Math.sin(clock * 1.4 + guard.sweep) * 0.48;
  return { x: guard.x - guard.dir * 38, y: guard.y + 10, angle, range: 300, width: 0.34 };
}

function cruiseBeamHitsFrame(frame) {
  if (!game.guard.active) return false;
  const points = [
    { x: frame.x + frame.w / 2, y: frame.y + frame.h / 2 },
    { x: frame.x, y: frame.y },
    { x: frame.x + frame.w, y: frame.y },
    { x: frame.x, y: frame.y + frame.h },
    { x: frame.x + frame.w, y: frame.y + frame.h }
  ];
  return points.some((p) => inCruiseSpotlight(p.x, p.y));
}

function inCruiseSpotlight(x, y) {
  const s = cruiseSpotlight();
  const dx = x - s.x;
  const dy = y - s.y;
  const d = Math.hypot(dx, dy);
  if (d > s.range || d < 20) return false;
  return Math.abs(angleDiff(Math.atan2(dy, dx), s.angle)) < s.width;
}

function drawCruise() {
  drawCruiseScene();
  drawCruiseItems();
  drawCruiseGuard();
  drawCruiseBoat();
  drawCruiseCamera();
  drawCruiseHud();
  drawHearts(812, 28, game.hearts);
  if (game.flash > 0) {
    ctx.fillStyle = `rgba(255,255,255,${game.flash * 0.28})`;
    ctx.fillRect(0, 0, W, H);
  }
  drawEffects();
}

function drawCruiseScene() {
  drawImageCover("cruiseScene", 0, 0, W, H);
  ctx.fillStyle = "rgba(3,8,24,.58)";
  ctx.fillRect(0, 0, W, H);
  const water = ctx.createLinearGradient(0, 170, 0, H);
  water.addColorStop(0, "rgba(11,52,83,.52)");
  water.addColorStop(1, "rgba(3,10,24,.92)");
  ctx.fillStyle = water;
  ctx.fillRect(0, 178, W, H - 178);
  for (let i = 0; i < 7; i += 1) {
    ctx.strokeStyle = `rgba(137,225,236,${0.2 - i * 0.018})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = -20; x <= W + 20; x += 8) {
      const y = 210 + i * 42 + Math.sin(x * 0.024 + clock * 1.5 + i) * 6;
      if (x === -20) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  for (let i = 0; i < 18; i += 1) {
    const x = (i * 77 - game.waterScroll * 0.7 + W) % W;
    const y = 195 + (i * 37) % 290;
    ctx.fillStyle = `rgba(255,211,107,${0.12 + Math.sin(clock * 2 + i) * 0.06})`;
    ctx.fillRect(x, y, 12, 2);
  }
}

function drawCruiseItems() {
  game.items.forEach((item) => {
    const y = item.y + Math.sin(item.wobble * 2.4) * 5;
    if (item.kind === "queen") drawPlayingCard(item.x - 20, y - 28, "Q♥", 0.62);
    else if (item.kind === "king") drawPlayingCard(item.x - 20, y - 28, "K♠", 0.62);
    else if (item.kind === "minor") drawPlayingCard(item.x - 16, y - 22, item.label, 0.48);
    else {
      ctx.strokeStyle = item.value >= 3 ? COLORS.rose : COLORS.teal;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.strokeRect(item.x - 36, y - 26, 72, 52);
      ctx.setLineDash([]);
      drawPixelHeart(item.x - 12, y - 12, item.value >= 3 ? COLORS.rose : COLORS.gold, 0.58);
      ctx.fillStyle = COLORS.cream;
      ctx.font = "bold 10px Courier New";
      center(`${item.label} · ${item.value}pt`, item.x, y + 42);
    }
  });
}

function drawCruiseGuard() {
  if (!game.guard.active) return;
  const s = cruiseSpotlight();
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate(s.angle);
  const beam = ctx.createLinearGradient(0, 0, s.range, 0);
  beam.addColorStop(0, "rgba(255,231,150,.38)");
  beam.addColorStop(0.74, "rgba(255,231,150,.13)");
  beam.addColorStop(1, "rgba(255,231,150,0)");
  ctx.fillStyle = beam;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(s.range, Math.tan(s.width) * s.range);
  ctx.lineTo(s.range, -Math.tan(s.width) * s.range);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  drawImageContain("coastGuard", game.guard.x - 74, game.guard.y - 42, 148, 76);
  if (!assets.coastGuard.ready) {
    ctx.fillStyle = "#eaf4f8";
    ctx.fillRect(game.guard.x - 58, game.guard.y - 14, 116, 30);
    ctx.fillStyle = COLORS.danger;
    ctx.fillRect(game.guard.x - 64, game.guard.y + 14, 128, 7);
  }
}

function drawCruiseBoat() {
  const bob = Math.sin(clock * 1.7) * 5;
  drawImageContain("cruiseBoat", 98, 292 + bob, 238, 116);
  if (!assets.cruiseBoat.ready) {
    ctx.fillStyle = "#f6f1e8";
    ctx.fillRect(120, 350 + bob, 190, 38);
    ctx.fillStyle = COLORS.teal;
    ctx.fillRect(104, 385 + bob, 222, 8);
  }
  drawImageCover("leopard", 198, 326 + bob, 54, 22);
  ctx.fillStyle = "rgba(5,5,13,.25)";
  ctx.fillRect(198, 326 + bob, 54, 22);
}

function drawCruiseCamera() {
  const frame = cruiseFrame();
  const target = activeCruiseTarget(frame);
  ctx.fillStyle = "rgba(0,0,0,.22)";
  ctx.fillRect(0, 0, W, frame.y);
  ctx.fillRect(0, frame.y + frame.h, W, H - frame.y - frame.h);
  ctx.fillRect(0, frame.y, frame.x, frame.h);
  ctx.fillRect(frame.x + frame.w, frame.y, W - frame.x - frame.w, frame.h);
  ctx.strokeStyle = target ? COLORS.green : cruiseBeamHitsFrame(frame) ? COLORS.danger : COLORS.gold;
  ctx.lineWidth = 4;
  ctx.strokeRect(frame.x, frame.y, frame.w, frame.h);
  ctx.strokeStyle = "rgba(255,240,210,.34)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(frame.x + frame.w / 2, frame.y + 8);
  ctx.lineTo(frame.x + frame.w / 2, frame.y + frame.h - 8);
  ctx.moveTo(frame.x + 8, frame.y + frame.h / 2);
  ctx.lineTo(frame.x + frame.w - 8, frame.y + frame.h / 2);
  ctx.stroke();
  drawImageContain("digicam", 718, 350, 196, 142);
  const charge = clamp(game.charge / 1.15, 0, 1);
  drawMeter(756, 474, 118, 10, charge, game.overheld ? COLORS.danger : charge > 0.7 ? COLORS.green : COLORS.gold);
  if (target) {
    const notch = clamp(target.hold / 1.15, 0, 1);
    ctx.fillStyle = COLORS.cream;
    ctx.fillRect(756 + notch * 118 - 2, 469, 4, 20);
  }
  drawMeter(756, 492, 118, 7, game.exposure, game.exposure > 0.55 ? COLORS.danger : COLORS.gold);
  drawMeter(756, 505, 118, 7, game.shakeLevel, game.shakeLevel > 0.55 ? COLORS.danger : COLORS.teal);
}

function drawCruiseHud() {
  drawPixelPanel(30, 26, 270, 124, "digicam");
  drawMeter(58, 78, 142, 12, game.momentCount / 5, COLORS.teal);
  drawMeter(58, 108, 142, 12, (game.queen ? 0.5 : 0) + (game.king ? 0.5 : 0), COLORS.rose);
  drawMeter(58, 138, 142, 8, game.exposure, game.exposure > 0.55 ? COLORS.danger : COLORS.gold);
  ctx.fillStyle = COLORS.cream;
  ctx.font = "bold 11px Courier New";
  ctx.fillText("moments", 210, 88);
  ctx.fillText("Q + K", 210, 118);
  ctx.fillText("light", 210, 146);
  drawFilmstrip();
}

function drawFilmstrip() {
  const x = 316;
  const y = 488;
  ctx.fillStyle = "rgba(5,5,13,.76)";
  ctx.fillRect(x, y, 328, 36);
  ctx.strokeStyle = "rgba(255,240,210,.34)";
  ctx.strokeRect(x, y, 328, 36);
  for (let i = 0; i < 8; i += 1) {
    const label = game.film[i] || "";
    ctx.fillStyle = label ? "rgba(255,211,107,.22)" : "rgba(255,240,210,.07)";
    ctx.fillRect(x + 10 + i * 38, y + 8, 28, 20);
    ctx.fillStyle = label === "Q" ? COLORS.rose : label === "K" ? COLORS.gold : COLORS.cream;
    ctx.font = "bold 12px Courier New";
    center(label, x + 24 + i * 38, y + 23);
  }
}

/* SHARED DRAWING */

function drawPixelPanel(x, y, w, h, title) {
  ctx.fillStyle = "rgba(5,5,13,.76)";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "rgba(255,211,107,.42)";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = COLORS.gold;
  ctx.font = "bold 12px Courier New";
  ctx.fillText(title.toUpperCase(), x + 16, y + 26);
}

function drawMeter(x, y, w, h, amount, color) {
  ctx.fillStyle = "rgba(0,0,0,.54)";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w * clamp(amount, 0, 1), h);
  ctx.strokeStyle = "rgba(255,240,210,.34)";
  ctx.strokeRect(x, y, w, h);
}

function drawHearts(x, y, hearts) {
  ctx.fillStyle = "rgba(5,5,13,.72)";
  ctx.fillRect(x, y, 116, 36);
  ctx.strokeStyle = "rgba(255,240,210,.3)";
  ctx.strokeRect(x, y, 116, 36);
  for (let i = 0; i < 3; i += 1) {
    drawPixelHeart(x + 16 + i * 34, y + 9, i < hearts ? COLORS.rose : "rgba(255,240,210,.22)", 0.66);
  }
}

function drawPlayingCard(x, y, label, scale = 1) {
  const w = 44 * scale;
  const h = 62 * scale;
  ctx.fillStyle = "#fff8e8";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "#150d18";
  ctx.lineWidth = Math.max(1, 2 * scale);
  ctx.strokeRect(x, y, w, h);
  const red = label.includes("♥") || label.includes("♦");
  ctx.fillStyle = red ? "#c82448" : "#15151e";
  ctx.font = `bold ${Math.max(10, 17 * scale)}px Courier New`;
  center(label, x + w / 2, y + h / 2 + 5 * scale);
}

function drawTopCar(x, y, color, label) {
  ctx.fillStyle = color;
  ctx.fillRect(x - 26, y - 42, 52, 84);
  ctx.fillStyle = "rgba(255,255,255,.52)";
  ctx.fillRect(x - 16, y - 26, 32, 20);
  ctx.fillRect(x - 16, y + 10, 32, 18);
  ctx.fillStyle = "#10131d";
  ctx.fillRect(x - 30, y - 30, 7, 20);
  ctx.fillRect(x + 23, y - 30, 7, 20);
  ctx.fillRect(x - 30, y + 12, 7, 20);
  ctx.fillRect(x + 23, y + 12, 7, 20);
  if (label) {
    ctx.fillStyle = COLORS.ink;
    ctx.font = "bold 14px Courier New";
    center(label, x, y + 5);
  }
}

function drawFruit(name, x, y, scale = 1) {
  const fruit = FRUITS[name];
  const size = 58 * scale;
  if (fruit.asset && drawImageContain(fruit.asset, x - size / 2, y - size / 2, size, size)) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  if (name === "pomegranate") {
    circle(0, 0, 24, fruit.color);
    ctx.fillStyle = "#9b1736";
    ctx.fillRect(-14, -6, 28, 16);
    ctx.fillStyle = COLORS.gold;
    triangle(-8, -21, 0, -32, 8, -21);
    ctx.fillStyle = "#ffd6de";
    ctx.fillRect(-8, 4, 4, 4);
    ctx.fillRect(4, -2, 4, 4);
    ctx.fillRect(7, 8, 4, 4);
  } else if (name === "orange") {
    circle(0, 0, 24, fruit.color);
    ctx.fillStyle = "rgba(255,255,255,.25)";
    ctx.fillRect(-10, -13, 12, 8);
    ctx.fillStyle = "#5dbb56";
    ctx.fillRect(2, -28, 14, 7);
  } else {
    circle(0, 0, 23, fruit.color);
  }
  ctx.restore();
}

function drawPixelHeart(x, y, color, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = color;
  [
    [8, 0], [12, 0], [24, 0], [28, 0],
    [4, 4], [8, 4], [12, 4], [16, 4], [20, 4], [24, 4], [28, 4], [32, 4],
    [4, 8], [8, 8], [12, 8], [16, 8], [20, 8], [24, 8], [28, 8], [32, 8],
    [8, 12], [12, 12], [16, 12], [20, 12], [24, 12],
    [12, 16], [16, 16], [20, 16],
    [16, 20]
  ].forEach(([hx, hy]) => ctx.fillRect(hx, hy, 4, 4));
  ctx.restore();
}

function drawPerson(x, y, shirt, apron) {
  ctx.fillStyle = "#c78b58";
  ctx.fillRect(x - 18, y - 76, 36, 34);
  ctx.fillStyle = "#2b1a22";
  ctx.fillRect(x - 22, y - 82, 44, 12);
  ctx.fillStyle = shirt;
  ctx.fillRect(x - 30, y - 42, 60, 78);
  ctx.fillStyle = apron;
  ctx.fillRect(x - 22, y - 28, 44, 64);
}

function drawSpeechBubble(x, y, w, h, text) {
  ctx.fillStyle = "rgba(255,246,225,.96)";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "rgba(255,246,225,.96)";
  triangle(x + 44, y + h, x + 76, y + h, x + 56, y + h + 22);
  ctx.strokeStyle = COLORS.plum;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = COLORS.plum;
  ctx.font = "bold 16px Courier New";
  wrapText(text, x + 16, y + 29, w - 32, 20);
}

function drawImageCover(key, x, y, w, h) {
  return drawImageMode(key, x, y, w, h, "cover");
}

function drawImageContain(key, x, y, w, h) {
  return drawImageMode(key, x, y, w, h, "contain");
}

function drawImageMode(key, x, y, w, h, mode) {
  const record = assets[key];
  if (!record || !record.ready) return false;
  const img = record.img;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if (!iw || !ih) return false;
  const scale = mode === "contain" ? Math.min(w / iw, h / ih) : Math.max(w / iw, h / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  if (mode === "contain") {
    ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  } else {
    const sx = Math.max(0, (iw - w / scale) / 2);
    const sy = Math.max(0, (ih - h / scale) / 2);
    ctx.drawImage(img, sx, sy, Math.min(iw, w / scale), Math.min(ih, h / scale), x, y, w, h);
  }
  return true;
}

function drawPauseOverlay() {
  ctx.fillStyle = "rgba(5,5,13,.62)";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = COLORS.gold;
  ctx.font = "bold 30px Courier New";
  center("PAUSED", W / 2, H / 2);
}

function updateEffects(dt) {
  floaters.forEach((f) => {
    f.age += dt;
    f.y -= dt * 30;
  });
  floaters = floaters.filter((f) => f.age < 1.05);
  bursts.forEach((b) => { b.age += dt; });
  bursts = bursts.filter((b) => b.age < 0.72);
}

function drawEffects() {
  floaters.forEach((f) => {
    ctx.globalAlpha = 1 - f.age / 1.05;
    ctx.fillStyle = f.color;
    ctx.font = "bold 14px Courier New";
    center(f.text, f.x, f.y);
    ctx.globalAlpha = 1;
  });
  bursts.forEach((b) => {
    const alpha = 1 - b.age / 0.72;
    for (let i = 0; i < b.count; i += 1) {
      const angle = (i / b.count) * Math.PI * 2 + b.seed;
      const r = b.age * 86;
      ctx.fillStyle = rgba(b.color, alpha);
      ctx.fillRect(b.x + Math.cos(angle) * r, b.y + Math.sin(angle) * r, 4, 4);
    }
  });
}

function floatText(text, x, y, color = COLORS.cream) {
  floaters.push({ text, x, y, color, age: 0 });
}

function burst(x, y, count = 12, color = COLORS.gold) {
  bursts.push({ x, y, count, color, age: 0, seed: randRange(0, Math.PI * 2) });
}

function shake() {
  dom.canvas.classList.remove("shake");
  void dom.canvas.offsetWidth;
  dom.canvas.classList.add("shake");
}

/* UTILITIES */

function point(event) {
  return pointFromClient(event.clientX, event.clientY);
}

function pointFromClient(clientX, clientY) {
  const rect = dom.canvas.getBoundingClientRect();
  return {
    x: ((clientX - rect.left) / rect.width) * W,
    y: ((clientY - rect.top) / rect.height) * H
  };
}

function heartText(hearts) {
  return Array.from({ length: 3 }, (_, i) => (i < hearts ? "♥" : "♡")).join(" ");
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function dist(x1, y1, x2, y2) {
  return Math.hypot(x1 - x2, y1 - y2);
}

function triangle(x1, y1, x2, y2, x3, y3) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x3, y3);
  ctx.closePath();
  ctx.fill();
}

function circle(x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function center(text, x, y) {
  ctx.textAlign = "center";
  ctx.fillText(text, x, y);
  ctx.textAlign = "left";
}

function wrapText(text, x, y, maxWidth, lineHeight) {
  const words = String(text).split(" ");
  let line = "";
  words.forEach((word) => {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      line = word;
      y += lineHeight;
    } else {
      line = test;
    }
  });
  if (line) ctx.fillText(line, x, y);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(a, b, t) {
  return a + (b - a) * clamp(t, 0, 1);
}

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function randomChoice(list) {
  return list[Math.floor(rand() * list.length)];
}

function maybe(chance) {
  return rand() < chance;
}

function randRange(min, max) {
  return min + rand() * (max - min);
}

function rand() {
  rngState += 0x6D2B79F5;
  let t = rngState;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function rgba(hex, alpha) {
  if (!hex.startsWith("#")) return hex;
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

function mixColor(hexA, hexB, amount) {
  const a = parseInt(hexA.slice(1), 16);
  const b = parseInt(hexB.slice(1), 16);
  const ar = (a >> 16) & 255;
  const ag = (a >> 8) & 255;
  const ab = a & 255;
  const br = (b >> 16) & 255;
  const bg = (b >> 8) & 255;
  const bb = b & 255;
  const r = Math.round(lerp(ar, br, amount));
  const g = Math.round(lerp(ag, bg, amount));
  const bl = Math.round(lerp(ab, bb, amount));
  return `rgb(${r}, ${g}, ${bl})`;
}

function angleDiff(a, b) {
  return Math.atan2(Math.sin(a - b), Math.cos(a - b));
}

preloadAssets();
bindUi();
updateMenu();
setInterval(ambientParticle, 800);
for (let i = 0; i < 9; i += 1) setTimeout(ambientParticle, i * 140);
