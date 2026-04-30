const homeScreen = document.getElementById("home-screen");
const gameScreen = document.getElementById("game-screen");
const teaserScreen = document.getElementById("teaser-screen");
const loadingScreen = document.getElementById("loading-screen");
const loadingText = document.getElementById("loading-text");
const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const gameTitle = document.getElementById("game-title");
const gameHint = document.getElementById("game-hint");
const statusEl = document.getElementById("status");
const popup = document.getElementById("popup");
const popupTitle = document.getElementById("popup-title");
const popupText = document.getElementById("popup-text");
const replayBtn = document.getElementById("replay-btn");
const popupSpotsBtn = document.getElementById("popup-spots-btn");
const backBtn = document.getElementById("back-btn");
const pauseBtn = document.getElementById("pause-btn");
const muteBtn = document.getElementById("mute-btn");
const teaserBackBtn = document.getElementById("teaser-back-btn");
const menuMessage = document.getElementById("menu-message");
const levelButtons = [...document.querySelectorAll(".level-card")];
const particles = document.getElementById("particles");

const W = canvas.width;
const H = canvas.height;
const SAVE_KEY = "tenToTwentyDeepGameProgress";

const COLORS = {
  ink: "#070712",
  night: "#10152a",
  plum: "#2d1530",
  rose: "#c63f5c",
  coral: "#ff7b54",
  teal: "#38c6b4",
  gold: "#f8cf68",
  cream: "#fff1d6",
  green: "#7cff9b",
  danger: "#ff5a6d",
  water: "#0d5a78"
};

const FRUIT = {
  pomegranate: { label: "pomegranate", color: "#c63f5c" },
  orange: { label: "orange", color: "#f89a2c" },
  grape: { label: "grape", color: "#7a3fc7", asset: "grapes" },
  berry: { label: "berry", color: "#8b2d63", asset: "berry" },
  lemonMint: { label: "lemon mint", color: "#98d65c", asset: "lemonMint" },
  mango: { label: "mango", color: "#ffc247", asset: "mango" },
  peach: { label: "peach", color: "#ffb08a", asset: "peach" },
  apple: { label: "apple", color: "#9bd36a", asset: "apple" },
  watermelon: { label: "watermelon", color: "#44b866", asset: "watermelon" }
};

const ASSET_SOURCES = {
  leopard: "leopard-bg.jpg",
  logo: "logo_juice_palace.png",
  egyptian: "egyptian.png",
  mountain: "scene_mountain.png",
  cruiseScene: "scene_cruise.png",
  cruiseBoat: "cruise.png",
  coastGuard: "coast_guard.png",
  rav4: "rav4.png",
  jojo: "jojo.png",
  chairs: "chairs.png",
  fries: "fries.png",
  steak: "steak.png",
  digicam: "digicam.png",
  cards: "playingcards.png",
  grape: "grapes.png",
  berry: "berry.png",
  lemonMint: "lemonmint.png",
  mango: "mango.png",
  peach: "peach.png",
  apple: "apple.png",
  watermelon: "watermelon.png"
};

const assets = {};
const keys = new Set();
const completed = new Set(loadSaved());

let currentLevel = 1;
let game = null;
let raf = null;
let lastTime = 0;
let clock = 0;
let paused = false;
let muted = false;
let pointer = { x: 0, y: 0, down: false };
let floaters = [];
let bursts = [];

function loadSaved() {
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
    /* Progress still works for the current session if storage is blocked. */
  }
}

function loadAsset(key, src) {
  const record = { img: new Image(), ready: false, failed: false };
  const done = new Promise((resolve) => {
    record.img.onload = () => {
      record.ready = true;
      resolve(record);
    };
    record.img.onerror = () => {
      record.failed = true;
      resolve(record);
    };
  });
  record.img.src = src;
  assets[key] = record;
  return done;
}

function bootAssets() {
  const jobs = Object.entries(ASSET_SOURCES).map(([key, src]) => loadAsset(key, src));
  Promise.all(jobs).then(() => {
    loadingText.textContent = "ready";
    setTimeout(() => loadingScreen.classList.add("hidden"), 220);
  });
}

bootAssets();

function cue(name) {
  if (muted) return;
  document.dispatchEvent(new CustomEvent("ten-to-twenty-sound", { detail: { name } }));
}

function ambientParticle() {
  const el = document.createElement("span");
  el.className = "particle";
  el.textContent = ["♥", "♡", "✦", "·"][Math.floor(Math.random() * 4)];
  el.style.left = `${Math.random() * 100}vw`;
  el.style.animationDuration = `${7 + Math.random() * 9}s`;
  el.style.fontSize = `${10 + Math.random() * 12}px`;
  el.style.color = [COLORS.gold, COLORS.rose, COLORS.teal, COLORS.cream][Math.floor(Math.random() * 4)];
  particles.appendChild(el);
  setTimeout(() => el.remove(), 17000);
}

setInterval(ambientParticle, 800);
for (let i = 0; i < 8; i += 1) setTimeout(ambientParticle, i * 150);

levelButtons.forEach((btn) => btn.addEventListener("click", () => startLevel(Number(btn.dataset.level))));
backBtn.addEventListener("click", goHome);
popupSpotsBtn.addEventListener("click", goHome);
teaserBackBtn.addEventListener("click", goHome);
replayBtn.addEventListener("click", () => {
  popup.classList.add("hidden");
  startLevel(currentLevel);
});
pauseBtn.addEventListener("click", togglePause);
muteBtn.addEventListener("click", () => {
  muted = !muted;
  muteBtn.textContent = muted ? "muted" : "mute";
});

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  keys.add(key);
  if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) event.preventDefault();
  if (key === "p") togglePause();
  if (key === "escape") goHome();
  if ((key === " " || key === "e") && game) {
    if (currentLevel === 3) game.captureHeld = true;
    else levelAction();
  }
});

window.addEventListener("keyup", (event) => {
  const key = event.key.toLowerCase();
  keys.delete(key);
  if ((key === " " || key === "e") && game && currentLevel === 3) game.captureHeld = false;
});

canvas.addEventListener("pointerdown", (event) => {
  pointer = { ...point(event), down: true };
  handlePointerDown(pointer);
});

canvas.addEventListener("pointermove", (event) => {
  pointer = { ...point(event), down: pointer.down };
  handlePointerMove(pointer);
});

window.addEventListener("pointerup", (event) => {
  const p = event.clientX === undefined ? pointer : pointFromClient(event.clientX, event.clientY);
  pointer.down = false;
  handlePointerUp(p);
});

function updateMenu() {
  levelButtons.forEach((btn) => btn.classList.toggle("done", completed.has(Number(btn.dataset.level))));
  menuMessage.textContent = completed.size ? `${completed.size}/3 spots saved.` : "Pick a spot to start.";
}

updateMenu();

function startLevel(level) {
  currentLevel = level;
  paused = false;
  pauseBtn.textContent = "pause";
  clock = 0;
  floaters = [];
  bursts = [];
  popup.classList.add("hidden");
  homeScreen.classList.add("hidden");
  teaserScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");
  document.body.classList.add("game-mode");
  if (level === 1) setupJuice();
  if (level === 2) setupMountain();
  if (level === 3) setupCruise();
  stopLoop();
  startLoop();
}

function goHome() {
  popup.classList.add("hidden");
  gameScreen.classList.add("hidden");
  teaserScreen.classList.add("hidden");
  homeScreen.classList.remove("hidden");
  document.body.classList.remove("game-mode");
  stopLoop();
  updateMenu();
}

function showTeaser() {
  popup.classList.add("hidden");
  gameScreen.classList.add("hidden");
  homeScreen.classList.add("hidden");
  teaserScreen.classList.remove("hidden");
  document.body.classList.remove("game-mode");
  stopLoop();
  updateMenu();
}

function togglePause() {
  if (!game || popup.classList.contains("hidden") === false) return;
  paused = !paused;
  pauseBtn.textContent = paused ? "resume" : "pause";
}

function setHint(text) {
  gameHint.textContent = text;
}

function setStatus(text) {
  statusEl.innerHTML = text.replace(/\n/g, "<br>");
}

function startLoop() {
  lastTime = performance.now();
  function loop(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    if (!paused) {
      clock += dt;
      updateGame(dt);
    }
    drawGame();
    if (paused) drawPauseOverlay();
    raf = requestAnimationFrame(loop);
  }
  raf = requestAnimationFrame(loop);
}

function stopLoop() {
  if (raf) cancelAnimationFrame(raf);
  raf = null;
}

function finishLevel(text) {
  if (!game || game.finished) return;
  game.finished = true;
  cue("level-saved");
  completed.add(currentLevel);
  saveProgress();
  popupTitle.textContent = "memory kept";
  popupText.textContent = text;
  popup.classList.remove("hidden");
  if (completed.size >= 3) {
    popupSpotsBtn.textContent = "map";
  } else {
    popupSpotsBtn.textContent = "spots";
  }
}

function hurt(text, amount = 1) {
  game.hearts -= amount;
  shake();
  cue("mistake");
  floatText(text, W / 2, 112, COLORS.danger);
  if (game.hearts <= 0) {
    setHint("Resetting this tiny disaster.");
    setTimeout(() => startLevel(currentLevel), 760);
  }
}

function updateGame(dt) {
  if (!game || game.finished) return;
  if (currentLevel === 1) updateJuice(dt);
  if (currentLevel === 2) updateMountain(dt);
  if (currentLevel === 3) updateCruise(dt);
  updateEffects(dt);
}

function drawGame() {
  if (!game) return;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, W, H);
  if (currentLevel === 1) drawJuice();
  if (currentLevel === 2) drawMountain();
  if (currentLevel === 3) drawCruise();
}

function levelAction() {
  if (!game || paused) return;
  if (currentLevel === 1) juiceAction();
  if (currentLevel === 2) mountainAction();
}

function handlePointerDown(p) {
  if (!game || paused) return;
  if (currentLevel === 1) juicePointer(p);
  if (currentLevel === 2) mountainPointerDown(p);
  if (currentLevel === 3) cruisePointerDown(p);
}

function handlePointerMove(p) {
  if (!game || paused) return;
  if (currentLevel === 2) mountainPointerMove(p);
  if (currentLevel === 3) cruisePointerMove(p);
}

function handlePointerUp(p) {
  if (!game || paused) return;
  if (currentLevel === 2) mountainPointerUp(p);
  if (currentLevel === 3) game.captureHeld = false;
}

/* LEVEL 01: MEMORY, DECEPTION, TIMING */

function setupJuice() {
  gameTitle.textContent = "01";
  setHint("Memorize the order. Catch the lies.");
  const statements = shuffle([
    { text: "He says lemon mint is part of نسبة وتناسب.", truth: false },
    { text: "He says pomegranate belongs in the order.", truth: true },
    { text: "He says orange is not in the order.", truth: false },
    { text: "He says grape comes before berry.", truth: true },
    { text: "He says berry is the last ingredient.", truth: true }
  ]).slice(0, 4);

  game = {
    phase: "preview",
    phaseTime: 3,
    hearts: 3,
    mistakes: 0,
    recipeName: "نسبة وتناسب",
    recipe: ["pomegranate", "orange", "grape", "berry"],
    buildGoal: 3,
    selected: [],
    statements,
    statementIndex: 0,
    statementTimer: 7,
    workerLine: "رمان صح؟ خلاص أهم شي.",
    workerTimer: 2.2,
    cup: 0,
    ratio: 0,
    ratioDir: 1,
    finalQueue: shuffle(["pomegranate", "lemonMint", "berry"]),
    finalIndex: 0,
    finalTimer: 1.9,
    fruit: [
      fruitBox("lemonMint", 120, 390),
      fruitBox("pomegranate", 250, 454),
      fruitBox("mango", 365, 384),
      fruitBox("grape", 492, 454),
      fruitBox("berry", 616, 384),
      fruitBox("orange", 742, 454),
      fruitBox("peach", 850, 384)
    ]
  };
}

function fruitBox(name, x, y) {
  return { name, x, y, w: 88, h: 78 };
}

function juicePointer(p) {
  if (game.phase === "statements") {
    if (inside(p, trueBox())) answerStatement(true);
    if (inside(p, falseBox())) answerStatement(false);
    return;
  }

  if (game.phase === "build") {
    if (game.sneak && inside(p, rejectBox())) {
      game.sneak = false;
      game.workerLine = "أنا ما نسيت، أنا بس أختبركم.";
      floatText("rejected", 742, 174, COLORS.green);
      return;
    }
    if (game.sneak && inside(p, acceptBox())) {
      game.sneak = false;
      hurt("pomegranate again?", 1);
      return;
    }
    const hit = game.fruit.find((f) => insideFruit(p, f));
    if (hit) chooseJuiceFruit(hit.name, hit.x, hit.y);
    return;
  }

  if (game.phase === "ratio") {
    juiceAction();
    return;
  }

  if (game.phase === "final") {
    if (inside(p, finalAcceptBox())) finalAnswer(true);
    if (inside(p, finalRejectBox())) finalAnswer(false);
  }
}

function juiceAction() {
  if (game.phase !== "ratio") return;
  const width = ratioWidth();
  const min = 0.5 - width / 2;
  const max = 0.5 + width / 2;
  if (game.ratio >= min && game.ratio <= max) {
    game.phase = "final";
    game.phaseTime = 0;
    game.workerLine = "نسبة وتناسب تحتاج ثقة، مش ذاكرة.";
    floatText("balanced.", W / 2, 330, COLORS.green);
    burst(W / 2, 330, 20);
    cue("balanced");
  } else {
    game.mistakes += 1;
    game.phase = "final";
    game.phaseTime = 0;
    game.workerLine = "المشروب عاش... بالعافية.";
    floatText("drink survived, barely.", W / 2, 330, COLORS.gold);
    shake();
  }
}

function answerStatement(answer) {
  const statement = game.statements[game.statementIndex];
  if (!statement) return;
  if (answer === statement.truth) {
    game.cup = Math.min(1, game.cup + 0.18);
    floatText("caught it", W / 2, 236, COLORS.green);
    burst(W / 2, 236, 8);
    cue("correct");
  } else {
    game.mistakes += 1;
    hurt("he sounded confident", 1);
  }
  game.statementIndex += 1;
  game.statementTimer = 7;
  if (game.statementIndex >= game.statements.length) {
    game.phase = "build";
    game.phaseTime = 0;
    game.workerLine = "برتقال؟ يمكن… بس الرمان أكيد.";
    setHint("Build the first three from memory. Berry comes later.");
  }
}

function missStatement() {
  game.mistakes += 1;
  hurt("too slow", 1);
  game.statementIndex += 1;
  game.statementTimer = 7;
  if (game.statementIndex >= game.statements.length) {
    game.phase = "build";
    game.phaseTime = 0;
    game.workerLine = "برتقال؟ يمكن… بس الرمان أكيد.";
    setHint("Build the first three from memory. Berry comes later.");
  }
}

function chooseJuiceFruit(name, x, y) {
  const expected = game.recipe[game.selected.length];
  if (name === "lemonMint") {
    game.workerLine = "ليمون نعناع؟ لا لا… يمكن؟";
    hurt("tempting, wrong order", 1);
    return;
  }
  if (name === expected && game.selected.length < game.buildGoal) {
    game.selected.push(name);
    game.cup = Math.min(1, game.cup + 0.2);
    game.workerLine = randomWorkerLine();
    floatText(FRUIT[name].label, x, y - 50, COLORS.green);
    burst(x, y, 10);
    cue("correct");
    if (game.selected.length >= game.buildGoal) {
      game.phase = "ratio";
      game.phaseTime = 0;
      setHint("Stop the balance meter inside the sweet zone.");
    }
  } else {
    game.mistakes += 1;
    game.selected = [];
    game.cup = Math.max(0, game.cup - 0.18);
    hurt("order reset", 1);
  }
}

function finalAnswer(accept) {
  const item = game.finalQueue[game.finalIndex];
  const correct = item === "berry";
  if (accept && correct) {
    game.selected.push("berry");
    game.cup = 1;
    burst(W / 2, 300, 28);
    finishLevel("The cup finally made sense. Lemon mint stayed beloved, just not today.");
    return;
  }
  if (!accept && !correct) {
    floatText("good call", W / 2, 236, COLORS.green);
    game.finalIndex += 1;
    game.finalTimer = 1.9;
    cue("correct");
  } else {
    game.mistakes += 1;
    hurt(correct ? "you rejected berry" : "wrong add-on", 1);
    game.finalIndex += 1;
    game.finalTimer = 1.9;
  }
  if (game.finalIndex >= game.finalQueue.length && !game.selected.includes("berry")) {
    setTimeout(() => startLevel(1), 760);
  }
}

function updateJuice(dt) {
  game.phaseTime += dt;
  game.workerTimer -= dt;
  if (game.workerTimer <= 0 && game.phase !== "preview") {
    game.workerLine = randomWorkerLine();
    game.workerTimer = 2.6 + Math.random() * 1.8;
  }

  if (game.phase === "preview") {
    game.phaseTime = Math.max(0, game.phaseTime);
    setStatus(`MEMO ${Math.ceil(Math.max(0, 3 - game.phaseTime))}\n${heartText(game.hearts)}`);
    if (game.phaseTime >= 3) {
      game.phase = "statements";
      game.phaseTime = 0;
      setHint("True or false. Do not trust the worker voice.");
    }
  } else if (game.phase === "statements") {
    game.statementTimer -= dt;
    setStatus(`LIE ${game.statementIndex + 1}/${game.statements.length}\n${heartText(game.hearts)}`);
    if (game.statementTimer <= 0) missStatement();
  } else if (game.phase === "build") {
    setStatus(`ORDER ${game.selected.length}/3\n${heartText(game.hearts)}`);
    if (!game.sneak && game.selected.includes("pomegranate") && Math.sin(clock * 1.4) > 0.985) {
      game.sneak = true;
      game.workerLine = "رمان مرة ثانية؟ خلاص أهم شي.";
    }
  } else if (game.phase === "ratio") {
    game.ratio += game.ratioDir * dt * (0.7 + game.mistakes * 0.08);
    if (game.ratio < 0 || game.ratio > 1) {
      game.ratioDir *= -1;
      game.ratio = clamp(game.ratio, 0, 1);
    }
    setStatus(`BALANCE\n${heartText(game.hearts)}`);
  } else if (game.phase === "final") {
    game.finalTimer -= dt;
    setStatus(`ADD-ON ${game.finalIndex + 1}/3\n${heartText(game.hearts)}`);
    if (game.finalTimer <= 0) finalAnswer(false);
  }
}

function randomWorkerLine() {
  const lines = [
    "رمان صح؟ خلاص أهم شي.",
    "برتقال؟ يمكن… بس الرمان أكيد.",
    "أنا ما نسيت، أنا بس أختبركم.",
    "ليمون نعناع؟ لا لا… يمكن؟",
    "نسبة وتناسب تحتاج ثقة، مش ذاكرة."
  ];
  return lines[Math.floor(Math.random() * lines.length)];
}

function ratioWidth() {
  return clamp(0.24 - game.mistakes * 0.035, 0.12, 0.24);
}

function drawJuice() {
  drawJuiceBeach();
  drawJuicePalace();
  drawCup(728, 222, game.cup);
  if (game.phase === "preview") drawRecipePreview();
  if (game.phase === "statements") drawStatementChallenge();
  if (game.phase === "build") drawBuildFruit();
  if (game.phase === "ratio") drawRatioMeter();
  if (game.phase === "final") drawFinalAddOn();
  drawHearts(818, 28, game.hearts);
  drawEffects();
}

function drawJuiceBeach() {
  const sky = ctx.createLinearGradient(0, 0, 0, 280);
  sky.addColorStop(0, "#17345f");
  sky.addColorStop(0.55, "#db6d50");
  sky.addColorStop(1, "#f4b067");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, 280);
  circle(820, 82, 36, COLORS.gold);
  ctx.fillStyle = "#1292ad";
  ctx.fillRect(0, 218, W, 166);
  drawWave(250, "rgba(255,255,255,.25)");
  drawWave(298, "rgba(255,255,255,.18)");
  ctx.fillStyle = "#d8ad62";
  ctx.fillRect(0, 382, W, 158);
}

function drawJuicePalace() {
  ctx.fillStyle = "#124e5f";
  ctx.fillRect(52, 126, 404, 194);
  ctx.fillStyle = "#0d3441";
  ctx.fillRect(76, 162, 350, 142);
  ctx.fillStyle = COLORS.coral;
  ctx.fillRect(52, 126, 404, 24);
  ctx.fillStyle = COLORS.gold;
  for (let i = 0; i < 20; i += 1) triangle(52 + i * 20, 126, 62 + i * 20, 150, 72 + i * 20, 126);
  ctx.fillStyle = "#7d1f3a";
  ctx.fillRect(104, 230, 276, 52);
  ctx.strokeStyle = COLORS.gold;
  ctx.strokeRect(104, 230, 276, 52);
  drawAsset("logo", 118, 238, 248, 36, "contain");
  drawAsset("egyptian", 378, 192, 108, 140, "contain");
  drawBubble(474, 76, 284, 62, game.workerLine);
}

function drawRecipePreview() {
  drawPanel(502, 338, 382, 112, game.recipeName);
  game.recipe.forEach((name, index) => {
    const x = 534 + index * 84;
    ctx.fillStyle = "rgba(255,241,214,.1)";
    ctx.fillRect(x, 376, 64, 42);
    ctx.strokeStyle = "rgba(255,241,214,.28)";
    ctx.strokeRect(x, 376, 64, 42);
    drawFruit(name, x + 32, 392, 0.7);
    ctx.fillStyle = COLORS.cream;
    ctx.font = "bold 10px Trebuchet MS";
    center(FRUIT[name].label, x + 32, 437);
  });
}

function drawStatementChallenge() {
  const statement = game.statements[game.statementIndex];
  drawPanel(498, 338, 388, 148, "catch the lie");
  ctx.fillStyle = COLORS.cream;
  ctx.font = "bold 17px Trebuchet MS";
  wrapText(statement ? statement.text : "", 526, 384, 330, 22);
  drawChoiceButton(trueBox(), "TRUE", COLORS.green);
  drawChoiceButton(falseBox(), "FALSE", COLORS.danger);
  drawTimerBar(526, 462, 318, 10, game.statementTimer / 7, COLORS.gold);
}

function drawBuildFruit() {
  game.fruit.forEach((box) => {
    const picked = game.selected.includes(box.name);
    ctx.fillStyle = picked ? "rgba(124,255,155,.18)" : "rgba(8,7,18,.58)";
    ctx.fillRect(box.x - box.w / 2, box.y - box.h / 2, box.w, box.h);
    ctx.strokeStyle = picked ? COLORS.green : box.name === "lemonMint" ? COLORS.gold : "rgba(255,241,214,.32)";
    ctx.lineWidth = picked ? 3 : 2;
    ctx.strokeRect(box.x - box.w / 2, box.y - box.h / 2, box.w, box.h);
    drawFruit(box.name, box.x, box.y - 7, 0.8);
    ctx.fillStyle = COLORS.cream;
    ctx.font = "bold 10px Trebuchet MS";
    center(FRUIT[box.name].label, box.x, box.y + 30);
  });

  drawPanel(512, 150, 210, 82, "remembered");
  game.selected.forEach((name, index) => drawFruit(name, 548 + index * 46, 198, 0.55));
  if (game.sneak) drawSneakPrompt();
}

function drawSneakPrompt() {
  drawPanel(620, 118, 250, 112, "worker tries it");
  ctx.fillStyle = COLORS.cream;
  ctx.font = "bold 15px Trebuchet MS";
  center("pomegranate again?", 745, 158);
  drawChoiceButton(acceptBox(), "ACCEPT", COLORS.green);
  drawChoiceButton(rejectBox(), "REJECT", COLORS.danger);
}

function drawRatioMeter() {
  drawRecipePreview();
  drawPanel(302, 340, 356, 114, "balance meter");
  ctx.fillStyle = "rgba(0,0,0,.48)";
  ctx.fillRect(348, 386, 264, 20);
  const width = ratioWidth();
  ctx.fillStyle = "rgba(124,255,155,.76)";
  ctx.fillRect(348 + 264 * (0.5 - width / 2), 386, 264 * width, 20);
  ctx.fillStyle = COLORS.gold;
  ctx.fillRect(348 + 264 * game.ratio - 5, 377, 10, 38);
  ctx.fillStyle = COLORS.cream;
  ctx.font = "bold 13px Trebuchet MS";
  center("click / space when balanced", 480, 434);
}

function drawFinalAddOn() {
  const item = game.finalQueue[game.finalIndex] || "berry";
  drawPanel(520, 332, 350, 152, "final add-on");
  ctx.fillStyle = COLORS.cream;
  ctx.font = "bold 16px Trebuchet MS";
  center(`Add ${FRUIT[item].label}?`, 695, 376);
  drawFruit(item, 695, 418, 0.9);
  drawChoiceButton(finalAcceptBox(), "ACCEPT", COLORS.green);
  drawChoiceButton(finalRejectBox(), "REJECT", COLORS.danger);
  drawTimerBar(556, 466, 278, 10, game.finalTimer / 1.9, COLORS.gold);
}

/* LEVEL 02: ROUTE, SEQUENCE, REACTION, DEDUCTION */

function setupMountain() {
  gameTitle.textContent = "02";
  setHint("Park Jojo. Build the setup. Protect the vibe.");
  const cards = makeDeductionCards();
  game = {
    phase: "park",
    hearts: 3,
    vibe: 100,
    route: [],
    drawingRoute: false,
    jojo: { x: 106, y: 423 },
    rav4: { x: 286, y: 424 },
    parkTarget: { x: 214, y: 422, r: 28 },
    obstacles: [
      { x: 174, y: 356, r: 28, label: "rock" },
      { x: 368, y: 382, r: 32, label: "palm" },
      { x: 462, y: 454, r: 26, label: "rock" }
    ],
    setupOrder: ["chairs", "drinks", "fries", "steak", "digicam", "cards"],
    setupIndex: 0,
    wind: null,
    windClock: 5,
    items: [
      setupItem("chairs", 198, 338, 102, 58),
      setupItem("drinks", 324, 350, 88, 54),
      setupItem("fries", 438, 350, 88, 54),
      setupItem("steak", 552, 350, 92, 54),
      setupItem("digicam", 676, 348, 98, 58),
      setupItem("cards", 806, 350, 88, 54)
    ],
    photo: { x: 260, y: 216, vx: 1, vy: 1, tries: 3, score: 0 },
    cards,
    flips: 5,
    foundQueen: false,
    foundKing: false
  };
}

function setupItem(id, x, y, w, h) {
  return { id, x, y, w, h, placed: false };
}

function makeDeductionCards() {
  const labels = ["fries", "Q♥", "cam", "RAV4", "steak", "Jojo", "K♠", "cards"];
  return labels.map((label, index) => ({
    label,
    open: false,
    solved: false,
    x: 252 + (index % 4) * 110,
    y: 268 + Math.floor(index / 4) * 78,
    w: 76,
    h: 58
  }));
}

function mountainPointerDown(p) {
  if (game.phase === "park") {
    game.drawingRoute = true;
    game.route = [{ x: game.jojo.x, y: game.jojo.y }, p];
    return;
  }

  if (game.phase === "setup") {
    if (game.wind && inside(p, game.wind.box)) {
      floatText("stabilized", game.wind.box.x + 40, game.wind.box.y - 12, COLORS.green);
      game.wind = null;
      game.vibe = Math.min(100, game.vibe + 8);
      cue("correct");
      return;
    }
    const hit = game.items.find((item) => inside(p, item));
    if (hit) chooseSetupItem(hit);
    return;
  }

  if (game.phase === "photo") {
    mountainAction();
    return;
  }

  if (game.phase === "cards") {
    const card = game.cards.find((c) => inside(p, c) && !c.solved && !c.open);
    if (card) flipDeductionCard(card);
  }
}

function mountainPointerMove(p) {
  if (game.phase === "park" && game.drawingRoute) {
    const last = game.route[game.route.length - 1];
    if (!last || dist(last.x, last.y, p.x, p.y) > 8) game.route.push({ x: p.x, y: p.y });
  }
}

function mountainPointerUp(p) {
  if (game.phase === "park" && game.drawingRoute) {
    game.drawingRoute = false;
    if (game.route.length > 1) game.route.push(p);
    validateParkingRoute();
  }
}

function mountainAction() {
  if (game.phase !== "photo") return;
  const frame = photoFrame();
  const target = photoTarget();
  const dx = Math.abs((frame.x + frame.w / 2) - (target.x + target.w / 2));
  const dy = Math.abs((frame.y + frame.h / 2) - (target.y + target.h / 2));
  if (dx < 34 && dy < 26) {
    game.photo.score += 1;
    game.phase = "cards";
    setHint("Use the clues. Find Q♥ and K♠ before flips run out.");
    burst(W / 2, 260, 16);
    cue("photo");
  } else {
    game.photo.tries -= 1;
    hurt("blurry frame", 0);
    if (game.photo.tries <= 0) hurt("memory missed", 1);
  }
}

function validateParkingRoute() {
  const end = game.route[game.route.length - 1];
  const reached = dist(end.x, end.y, game.parkTarget.x, game.parkTarget.y) < game.parkTarget.r + 18;
  const collision = game.route.some((p) => game.obstacles.some((o) => dist(p.x, p.y, o.x, o.y) < o.r));
  const tooLong = routeLength(game.route) > 520;
  if (reached && !collision && !tooLong) {
    game.jojo.x = game.parkTarget.x;
    game.jojo.y = game.parkTarget.y;
    game.phase = "setup";
    game.route = [];
    setHint("Place: chairs, drinks, fries, steak, digicam, cards.");
    burst((game.jojo.x + game.rav4.x) / 2, game.jojo.y - 36, 22);
    cue("park");
  } else {
    game.route = [];
    game.vibe = Math.max(0, game.vibe - 12);
    hurt(collision ? "route hit obstacle" : tooLong ? "route wandered" : "park closer", 0);
  }
}

function chooseSetupItem(item) {
  const expected = game.setupOrder[game.setupIndex];
  if (item.id === expected) {
    item.placed = true;
    game.setupIndex += 1;
    floatText(setupLine(item.id), item.x + item.w / 2, item.y - 10, COLORS.gold);
    cue("place");
    if (game.setupIndex >= game.setupOrder.length) {
      game.phase = "photo";
      setHint("Frame chairs + mountain + antenna.");
    } else {
      maybeStartWind(item);
    }
    return;
  }

  const message = item.id === "drinks" ? "drinks too early" :
    item.id === "cards" ? "cards scatter" :
    item.id === "fries" || item.id === "steak" ? "food timing slipped" :
    "wrong setup beat";
  game.vibe = Math.max(0, game.vibe - 14);
  hurt(message, 0);
  if (game.vibe <= 0) hurt("vibe gone", 1);
}

function maybeStartWind(item) {
  if (Math.random() < 0.75 || item.id === "cards") {
    game.wind = {
      box: { x: item.x - 6, y: item.y - 8, w: item.w + 12, h: item.h + 16 },
      t: 2.25
    };
    setHint("Gust. Stabilize the shaking item.");
  }
}

function flipDeductionCard(card) {
  if (game.flips <= 0) return;
  card.open = true;
  game.flips -= 1;
  if (card.label === "Q♥") {
    game.foundQueen = true;
    card.solved = true;
    cue("correct");
  } else if (card.label === "K♠") {
    game.foundKing = true;
    card.solved = true;
    cue("correct");
  } else {
    setTimeout(() => { card.open = false; }, 640);
  }
  if (game.foundQueen && game.foundKing) {
    finishLevel("Jojo stayed close, the setup held, and the cards knew who they were hiding.");
  } else if (game.flips <= 0) {
    hurt("out of flips", 1);
    setTimeout(() => startLevel(2), 760);
  }
}

function updateMountain(dt) {
  if (game.phase === "park") {
    setStatus(`ROUTE\n${heartText(game.hearts)}`);
  }

  if (game.phase === "setup") {
    game.windClock -= dt;
    if (game.wind) {
      game.wind.t -= dt;
      if (game.wind.t <= 0) {
        game.wind = null;
        game.vibe = Math.max(0, game.vibe - 16);
        hurt("gust won", 0);
      }
    } else if (game.windClock <= 0 && game.setupIndex > 0) {
      const placed = game.items.filter((i) => i.placed);
      if (placed.length) maybeStartWind(placed[Math.floor(Math.random() * placed.length)]);
      game.windClock = 5.5;
    }
    setStatus(`SETUP ${game.setupIndex}/6\nVIBE ${Math.ceil(game.vibe)}`);
  }

  if (game.phase === "photo") {
    game.photo.x += game.photo.vx * dt * 86;
    game.photo.y += game.photo.vy * dt * 42;
    if (game.photo.x < 224 || game.photo.x > 420) game.photo.vx *= -1;
    if (game.photo.y < 178 || game.photo.y > 262) game.photo.vy *= -1;
    setStatus(`FRAME\n${game.photo.tries} tries`);
  }

  if (game.phase === "cards") {
    setStatus(`FLIPS ${game.flips}\n${game.foundQueen ? "Q✓" : "Q?"} ${game.foundKing ? "K✓" : "K?"}`);
  }
}

function setupLine(id) {
  return {
    chairs: "anchor first",
    drinks: "weighted",
    fries: "still hot",
    steak: "priority",
    digicam: "ready",
    cards: "last, safe"
  }[id];
}

function photoFrame() {
  return { x: game.photo.x, y: game.photo.y, w: 250, h: 138 };
}

function photoTarget() {
  return { x: 314, y: 202, w: 246, h: 136 };
}

function drawMountain() {
  drawAsset("mountain", 0, 0, W, H, "cover");
  ctx.fillStyle = "rgba(8,7,18,.22)";
  ctx.fillRect(0, 0, W, H);
  drawMountainGround();
  if (game.phase === "park") drawParkingPuzzle();
  if (game.phase === "setup") drawSetupPuzzle();
  if (game.phase === "photo") drawMountainPhoto();
  if (game.phase === "cards") drawDeductionCards();
  drawHearts(818, 28, game.hearts);
  drawEffects();
}

function drawMountainGround() {
  ctx.fillStyle = "rgba(25, 16, 9, .36)";
  ctx.fillRect(0, 404, W, 136);
  drawAsset("rav4", game.rav4.x - 48, game.rav4.y - 34, 96, 68, "contain");
  drawAsset("jojo", game.jojo.x - 44, game.jojo.y - 34, 88, 68, "contain");
  ctx.fillStyle = "rgba(255,241,214,.18)";
  ctx.fillRect(game.parkTarget.x - 42, game.parkTarget.y - 28, 84, 56);
  ctx.strokeStyle = COLORS.teal;
  ctx.strokeRect(game.parkTarget.x - 42, game.parkTarget.y - 28, 84, 56);
}

function drawParkingPuzzle() {
  game.obstacles.forEach((o) => {
    circle(o.x, o.y, o.r, "rgba(38,30,24,.88)");
    ctx.strokeStyle = "rgba(255,241,214,.22)";
    ctx.strokeRect(o.x - o.r, o.y - o.r, o.r * 2, o.r * 2);
  });
  if (game.route.length > 1) {
    ctx.strokeStyle = COLORS.gold;
    ctx.lineWidth = 4;
    ctx.beginPath();
    game.route.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
    ctx.stroke();
  }
  drawPanel(36, 28, 292, 78, "draw jojo's route");
  ctx.fillStyle = COLORS.cream;
  ctx.font = "bold 13px Trebuchet MS";
  ctx.fillText("avoid rocks/palms; stop near RAV4", 58, 76);
}

function drawSetupPuzzle() {
  drawPanel(36, 28, 252, 196, "setup order");
  game.setupOrder.forEach((id, index) => {
    ctx.fillStyle = index < game.setupIndex ? COLORS.green : index === game.setupIndex ? COLORS.gold : "rgba(255,241,214,.5)";
    ctx.font = "bold 13px Trebuchet MS";
    ctx.fillText(`${index + 1}. ${id}`, 58, 72 + index * 23);
  });
  game.items.forEach((item) => {
    const active = game.setupOrder[game.setupIndex] === item.id;
    ctx.fillStyle = item.placed ? "rgba(124,255,155,.18)" : active ? "rgba(248,207,104,.18)" : "rgba(8,7,18,.48)";
    ctx.fillRect(item.x, item.y, item.w, item.h);
    ctx.strokeStyle = item.placed ? COLORS.green : active ? COLORS.gold : "rgba(255,241,214,.28)";
    ctx.lineWidth = active ? 3 : 2;
    ctx.strokeRect(item.x, item.y, item.w, item.h);
    drawSetupAsset(item.id, item.x + item.w / 2, item.y + item.h / 2 - 4);
    ctx.fillStyle = COLORS.cream;
    ctx.font = "bold 10px Trebuchet MS";
    center(item.id, item.x + item.w / 2, item.y + item.h - 8);
  });
  if (game.wind) {
    const b = game.wind.box;
    ctx.strokeStyle = COLORS.danger;
    ctx.lineWidth = 4;
    ctx.setLineDash([8, 6]);
    ctx.strokeRect(b.x, b.y, b.w, b.h);
    ctx.setLineDash([]);
    drawTimerBar(b.x, b.y - 12, b.w, 7, game.wind.t / 2.25, COLORS.danger);
  }
  drawTimerBar(752, 38, 150, 12, game.vibe / 100, COLORS.teal);
}

function drawMountainPhoto() {
  drawSetupPuzzle();
  const target = photoTarget();
  const frame = photoFrame();
  ctx.strokeStyle = "rgba(124,255,155,.55)";
  ctx.lineWidth = 3;
  ctx.strokeRect(target.x, target.y, target.w, target.h);
  drawAsset("digicam", 72, 336, 112, 84, "contain");
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 5;
  ctx.strokeRect(frame.x, frame.y, frame.w, frame.h);
  ctx.fillStyle = "rgba(8,7,18,.55)";
  ctx.fillRect(frame.x + 10, frame.y + 10, 86, 26);
  ctx.fillStyle = COLORS.cream;
  ctx.font = "bold 12px Trebuchet MS";
  ctx.fillText("SPACE / TAP", frame.x + 18, frame.y + 28);
}

function drawDeductionCards() {
  drawPanel(36, 28, 318, 142, "deduction clues");
  ctx.fillStyle = COLORS.cream;
  ctx.font = "bold 13px Trebuchet MS";
  ctx.fillText("Queen is not beside the steak.", 58, 72);
  ctx.fillText("King is closer to antenna side.", 58, 98);
  ctx.fillText("Find Q♥ + K♠ in limited flips.", 58, 124);
  game.cards.forEach((card) => {
    const open = card.open || card.solved;
    ctx.fillStyle = card.solved ? "rgba(124,255,155,.86)" : open ? COLORS.cream : COLORS.plum;
    ctx.fillRect(card.x, card.y, card.w, card.h);
    ctx.strokeStyle = open ? COLORS.gold : "rgba(255,241,214,.48)";
    ctx.lineWidth = 2;
    ctx.strokeRect(card.x, card.y, card.w, card.h);
    ctx.fillStyle = open ? COLORS.plum : COLORS.gold;
    ctx.font = "bold 18px Trebuchet MS";
    center(open ? card.label : "?", card.x + card.w / 2, card.y + 36);
  });
}

function drawSetupAsset(id, x, y) {
  const map = { chairs: "chairs", fries: "fries", steak: "steak", digicam: "digicam", cards: "cards" };
  if (map[id]) {
    drawAsset(map[id], x - 32, y - 28, 64, 48, "contain");
    return;
  }
  if (id === "drinks") {
    ctx.fillStyle = COLORS.teal;
    ctx.fillRect(x - 18, y - 16, 14, 28);
    ctx.fillStyle = COLORS.coral;
    ctx.fillRect(x + 4, y - 16, 14, 28);
  }
}

/* LEVEL 03: STEALTH, CAMERA, ROUTE CHOICE */

function setupCruise() {
  gameTitle.textContent = "03";
  setHint("Frame the memories. Avoid the patrol.");
  game = {
    phase: "memories",
    hearts: 3,
    score: 0,
    targetScore: 8,
    exposure: 0,
    player: { x: 118, y: 430, vx: 0, vy: 0 },
    target: null,
    guard: { x: 805, y: 356, dir: -1 },
    captureHeld: false,
    captureProgress: 0,
    blur: 0,
    memories: [
      memory("wave reflection", 226, 372, 2, 0.75),
      memory("quiet corner", 374, 470, 2, 0.75),
      memory("tiny smile", 522, 392, 3, 0.9),
      memory("almost-kiss moment", 730, 438, 4, 1.05),
      memory("blurry-but-cute shot", 842, 348, 1, 0.6)
    ],
    hides: [
      { x: 318, y: 414, w: 128, h: 58 },
      { x: 590, y: 472, w: 145, h: 48 }
    ],
    exit: { x: 884, y: 460, w: 54, h: 54 },
    wake: []
  };
}

function memory(label, x, y, score, hold) {
  return { label, x, y, score, hold, captured: false };
}

function cruisePointerDown(p) {
  if (inside(p, captureButton())) {
    game.captureHeld = true;
    return;
  }
  game.target = { x: p.x, y: p.y };
}

function cruisePointerMove(p) {
  if (game.captureHeld) return;
  if (pointer.down) game.target = { x: p.x, y: p.y };
}

function updateCruise(dt) {
  moveCruisePlayer(dt);
  updatePatrol(dt);
  updateExposure(dt);
  updateCapture(dt);
  const exitOpen = game.score >= game.targetScore;
  if (exitOpen && inside({ x: game.player.x, y: game.player.y }, game.exit)) {
    finishLevel("Enough proof. The rest can stay between the waves.");
  }
  setStatus(`MEMORY ${game.score}/${game.targetScore}\n${heartText(game.hearts)}`);
}

function moveCruisePlayer(dt) {
  let dx = 0;
  let dy = 0;
  if (keys.has("arrowleft") || keys.has("a")) dx -= 1;
  if (keys.has("arrowright") || keys.has("d")) dx += 1;
  if (keys.has("arrowup") || keys.has("w")) dy -= 1;
  if (keys.has("arrowdown") || keys.has("s")) dy += 1;
  if (!dx && !dy && game.target) {
    dx = game.target.x - game.player.x;
    dy = game.target.y - game.player.y;
    if (Math.hypot(dx, dy) < 8) {
      game.target = null;
      dx = 0;
      dy = 0;
    }
  }
  const len = Math.hypot(dx, dy) || 1;
  const speed = game.captureHeld ? 42 : 126;
  game.player.vx = dx ? (dx / len) * speed : 0;
  game.player.vy = dy ? (dy / len) * speed : 0;
  game.player.x = clamp(game.player.x + game.player.vx * dt, 50, 910);
  game.player.y = clamp(game.player.y + game.player.vy * dt, 328, 506);
  if (dx || dy) game.wake.push({ x: game.player.x - 22, y: game.player.y + 18, age: 0 });
  game.wake.forEach((w) => { w.age += dt; });
  game.wake = game.wake.filter((w) => w.age < 0.8);
}

function updatePatrol(dt) {
  game.guard.x += game.guard.dir * (74 + game.score * 3) * dt;
  game.guard.y += Math.sin(clock * 1.2) * 13 * dt;
  if (game.guard.x < 520) game.guard.dir = 1;
  if (game.guard.x > 880) game.guard.dir = -1;
  game.guard.y = clamp(game.guard.y, 336, 450);
}

function updateExposure(dt) {
  const hidden = game.hides.some((h) => inside({ x: game.player.x, y: game.player.y }, h));
  const spotted = inSpotlight(game.player.x, game.player.y) && !hidden;
  if (spotted) {
    game.exposure += dt * (game.captureHeld ? 0.52 : 0.36);
    if (game.exposure > 0.55) setHint("Warning. Break the light or hide.");
  } else {
    game.exposure -= dt * (hidden ? 0.62 : 0.28);
  }
  game.exposure = clamp(game.exposure, 0, 1);
  if (game.exposure >= 1) {
    game.exposure = 0.25;
    game.player.x = 118;
    game.player.y = 430;
    game.target = null;
    hurt("caught in light", 1);
  }
}

function updateCapture(dt) {
  if (!game.captureHeld) {
    game.captureProgress = Math.max(0, game.captureProgress - dt * 0.65);
    game.blur = Math.max(0, game.blur - dt * 0.8);
    return;
  }
  const target = activeMemory();
  const speed = Math.hypot(game.player.vx, game.player.vy);
  if (!target) {
    game.blur += dt * 0.6;
    game.captureProgress = Math.max(0, game.captureProgress - dt);
    return;
  }
  const steady = speed < 52 && game.exposure < 0.72;
  if (steady) {
    game.captureProgress += dt;
    game.blur = Math.max(0, game.blur - dt);
    if (game.captureProgress >= target.hold) {
      target.captured = true;
      game.score += target.score;
      game.captureProgress = 0;
      game.blur = 0;
      burst(target.x, target.y, 16);
      cue("photo");
      setHint(game.score >= game.targetScore ? "Exit path open. Leave clean." : "Memory framed. Choose the next risk.");
    }
  } else {
    game.blur += dt;
    game.captureProgress = Math.max(0, game.captureProgress - dt * 0.8);
    if (game.blur > 1.1) {
      game.blur = 0;
      hurt("blurry shot", 0);
    }
  }
}

function activeMemory() {
  const frame = cameraFrame();
  return game.memories.find((m) => !m.captured && m.x >= frame.x && m.x <= frame.x + frame.w && m.y >= frame.y && m.y <= frame.y + frame.h);
}

function cameraFrame() {
  return { x: game.player.x - 72, y: game.player.y - 72, w: 144, h: 92 };
}

function spotlight() {
  const angle = Math.PI + Math.sin(clock * 1.25) * 0.62;
  return { x: game.guard.x - 16, y: game.guard.y + 8, angle, range: 265, width: 0.42 };
}

function inSpotlight(x, y) {
  const s = spotlight();
  const dx = x - s.x;
  const dy = y - s.y;
  const d = Math.hypot(dx, dy);
  if (d > s.range || d < 20) return false;
  return Math.abs(angleDiff(Math.atan2(dy, dx), s.angle)) < s.width;
}

function drawCruise() {
  drawAsset("cruiseScene", 0, 0, W, H, "cover");
  ctx.fillStyle = "rgba(3,12,32,.25)";
  ctx.fillRect(0, 310, W, 230);
  drawCruiseWater();
  drawHideZones();
  drawCruiseMemories();
  drawSpotlight();
  drawCruiseWake();
  drawCruiseBoat();
  drawCoastGuard();
  if (game.captureHeld) drawCameraFrame();
  drawCruiseHud();
  drawHearts(818, 28, game.hearts);
  drawEffects();
}

function drawCruiseWater() {
  for (let i = 0; i < 7; i += 1) {
    ctx.strokeStyle = `rgba(126,215,230,${0.18 - i * 0.015})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 8) {
      const y = 330 + i * 30 + Math.sin(x * 0.024 + clock * 1.8 + i) * 6;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

function drawHideZones() {
  game.hides.forEach((h) => {
    ctx.fillStyle = "rgba(8,7,18,.34)";
    ctx.fillRect(h.x, h.y, h.w, h.h);
    ctx.strokeStyle = "rgba(56,198,180,.34)";
    ctx.strokeRect(h.x, h.y, h.w, h.h);
  });
}

function drawCruiseMemories() {
  game.memories.forEach((m) => {
    if (m.captured) return;
    ctx.strokeStyle = m.score >= 4 ? COLORS.danger : m.score >= 3 ? COLORS.gold : COLORS.teal;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.strokeRect(m.x - 30, m.y - 22, 60, 44);
    ctx.setLineDash([]);
    drawPixelHeart(m.x - 11, m.y - 10, ctx.strokeStyle, 0.58);
    ctx.fillStyle = COLORS.cream;
    ctx.font = "bold 10px Trebuchet MS";
    center(`${m.score}pt`, m.x, m.y + 34);
  });
  const open = game.score >= game.targetScore;
  ctx.fillStyle = open ? "rgba(124,255,155,.25)" : "rgba(255,241,214,.1)";
  ctx.fillRect(game.exit.x, game.exit.y, game.exit.w, game.exit.h);
  ctx.strokeStyle = open ? COLORS.green : "rgba(255,241,214,.28)";
  ctx.strokeRect(game.exit.x, game.exit.y, game.exit.w, game.exit.h);
  ctx.fillStyle = open ? COLORS.green : COLORS.cream;
  ctx.font = "bold 10px Trebuchet MS";
  center(open ? "EXIT" : "LOCK", game.exit.x + game.exit.w / 2, game.exit.y + 34);
}

function drawSpotlight() {
  const s = spotlight();
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate(s.angle);
  const beam = ctx.createLinearGradient(0, 0, s.range, 0);
  beam.addColorStop(0, "rgba(255,240,150,.34)");
  beam.addColorStop(0.75, "rgba(255,240,150,.12)");
  beam.addColorStop(1, "rgba(255,240,150,0)");
  ctx.fillStyle = beam;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(s.range, Math.tan(s.width) * s.range);
  ctx.lineTo(s.range, -Math.tan(s.width) * s.range);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawCruiseWake() {
  game.wake.forEach((w) => {
    const a = 1 - w.age / 0.8;
    ctx.strokeStyle = `rgba(255,255,255,${a * 0.34})`;
    ctx.beginPath();
    ctx.arc(w.x, w.y, 10 + w.age * 22, 0.2, Math.PI - 0.2);
    ctx.stroke();
  });
}

function drawCruiseBoat() {
  drawAsset("cruiseBoat", game.player.x - 36, game.player.y - 28, 72, 56, "contain");
  if (!assets.cruiseBoat.ready) {
    ctx.fillStyle = "#f6f1e8";
    ctx.fillRect(game.player.x - 30, game.player.y - 8, 60, 22);
    ctx.fillStyle = COLORS.teal;
    ctx.fillRect(game.player.x - 36, game.player.y + 12, 72, 7);
  }
}

function drawCoastGuard() {
  drawAsset("coastGuard", game.guard.x - 34, game.guard.y - 34, 68, 68, "contain");
  if (!assets.coastGuard.ready) {
    ctx.fillStyle = "#eff6fb";
    ctx.fillRect(game.guard.x - 34, game.guard.y - 8, 68, 24);
    ctx.fillStyle = COLORS.danger;
    ctx.fillRect(game.guard.x - 39, game.guard.y + 15, 78, 6);
  }
}

function drawCameraFrame() {
  const frame = cameraFrame();
  const target = activeMemory();
  ctx.strokeStyle = target ? COLORS.green : game.blur > 0.55 ? COLORS.danger : COLORS.gold;
  ctx.lineWidth = 4;
  ctx.strokeRect(frame.x, frame.y, frame.w, frame.h);
  ctx.fillStyle = "rgba(8,7,18,.48)";
  ctx.fillRect(frame.x, frame.y - 28, frame.w, 22);
  drawTimerBar(frame.x + 10, frame.y - 21, frame.w - 20, 8, target ? game.captureProgress / target.hold : 0, target ? COLORS.green : COLORS.danger);
}

function drawCruiseHud() {
  drawPanel(30, 26, 246, 132, "digicam");
  drawTimerBar(58, 78, 152, 12, game.score / game.targetScore, COLORS.teal);
  drawTimerBar(58, 108, 152, 12, game.exposure, game.exposure > 0.55 ? COLORS.danger : COLORS.gold);
  ctx.fillStyle = COLORS.cream;
  ctx.font = "bold 11px Trebuchet MS";
  ctx.fillText("score", 218, 88);
  ctx.fillText("patrol", 218, 118);
  const b = captureButton();
  ctx.fillStyle = game.captureHeld ? COLORS.green : "rgba(255,241,214,.12)";
  ctx.fillRect(b.x, b.y, b.w, b.h);
  ctx.strokeStyle = COLORS.gold;
  ctx.strokeRect(b.x, b.y, b.w, b.h);
  ctx.fillStyle = game.captureHeld ? COLORS.ink : COLORS.cream;
  ctx.font = "bold 13px Trebuchet MS";
  center("HOLD SHOT", b.x + b.w / 2, b.y + 28);
}

function captureButton() {
  return { x: 792, y: 454, w: 132, h: 48 };
}

/* SHARED DRAWING AND UTILITY */

function updateEffects(dt) {
  floaters.forEach((f) => {
    f.age += dt;
    f.y -= dt * 28;
  });
  floaters = floaters.filter((f) => f.age < 1.1);
  bursts.forEach((b) => { b.age += dt; });
  bursts = bursts.filter((b) => b.age < 0.75);
}

function drawEffects() {
  drawFloaters();
  drawBursts();
}

function drawFloaters() {
  floaters.forEach((f) => {
    ctx.globalAlpha = 1 - f.age / 1.1;
    ctx.fillStyle = f.color;
    ctx.font = "bold 14px Trebuchet MS";
    center(f.text, f.x, f.y);
    ctx.globalAlpha = 1;
  });
}

function drawBursts() {
  bursts.forEach((b) => {
    const alpha = 1 - b.age / 0.75;
    for (let i = 0; i < b.count; i += 1) {
      const angle = (i / b.count) * Math.PI * 2;
      const r = b.age * 70;
      ctx.fillStyle = rgba(b.color, alpha);
      ctx.fillRect(b.x + Math.cos(angle) * r, b.y + Math.sin(angle) * r, 4, 4);
    }
  });
}

function floatText(text, x, y, color = COLORS.cream) {
  floaters.push({ text, x, y, color, age: 0 });
}

function burst(x, y, count = 12, color = COLORS.gold) {
  bursts.push({ x, y, count, color, age: 0 });
}

function shake() {
  canvas.classList.remove("shake");
  void canvas.offsetWidth;
  canvas.classList.add("shake");
}

function drawPauseOverlay() {
  ctx.fillStyle = "rgba(8,7,18,.58)";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = COLORS.gold;
  ctx.font = "bold 28px Trebuchet MS";
  center("PAUSED", W / 2, H / 2);
}

function drawPanel(x, y, w, h, title) {
  ctx.fillStyle = "rgba(8,7,18,.72)";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "rgba(248,207,104,.38)";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = COLORS.gold;
  ctx.font = "bold 12px Trebuchet MS";
  ctx.fillText(title.toUpperCase(), x + 16, y + 28);
}

function drawTimerBar(x, y, w, h, amount, color) {
  ctx.fillStyle = "rgba(0,0,0,.5)";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w * clamp(amount, 0, 1), h);
  ctx.strokeStyle = "rgba(255,241,214,.3)";
  ctx.strokeRect(x, y, w, h);
}

function drawChoiceButton(box, label, color) {
  ctx.fillStyle = color;
  ctx.fillRect(box.x, box.y, box.w, box.h);
  ctx.strokeStyle = COLORS.cream;
  ctx.lineWidth = 2;
  ctx.strokeRect(box.x, box.y, box.w, box.h);
  ctx.fillStyle = COLORS.ink;
  ctx.font = "bold 13px Trebuchet MS";
  center(label, box.x + box.w / 2, box.y + 27);
}

function drawHearts(x, y, hearts) {
  ctx.fillStyle = "rgba(8,7,18,.66)";
  ctx.fillRect(x, y, 110, 34);
  ctx.strokeStyle = "rgba(255,241,214,.28)";
  ctx.strokeRect(x, y, 110, 34);
  for (let i = 0; i < 3; i += 1) drawPixelHeart(x + 14 + i * 32, y + 8, i < hearts ? COLORS.rose : "rgba(255,241,214,.22)", 0.7);
}

function drawAsset(key, x, y, w, h, mode = "cover") {
  const asset = assets[key];
  if (!asset || !asset.ready) return false;
  const img = asset.img;
  const scale = mode === "contain" ? Math.min(w / img.naturalWidth, h / img.naturalHeight) : Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const sw = w / scale;
  const sh = h / scale;
  const sx = (img.naturalWidth - sw) / 2;
  const sy = (img.naturalHeight - sh) / 2;
  if (mode === "contain") {
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  } else {
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  }
  return true;
}

function drawFruit(name, x, y, scale = 1) {
  const fruit = FRUIT[name];
  if (fruit.asset && drawAsset(fruit.asset, x - 28 * scale, y - 26 * scale, 56 * scale, 52 * scale, "contain")) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  if (name === "pomegranate") {
    circle(0, 0, 22, fruit.color);
    ctx.fillStyle = COLORS.gold;
    triangle(-6, -20, 0, -30, 6, -20);
  } else if (name === "orange") {
    circle(0, 0, 23, fruit.color);
    ctx.fillStyle = "rgba(255,255,255,.25)";
    ctx.fillRect(-9, -13, 12, 7);
  } else {
    circle(0, 0, 22, fruit.color);
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

function drawCup(x, y, fill) {
  ctx.strokeStyle = COLORS.cream;
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, 68, 92);
  ctx.fillStyle = "rgba(255,241,214,.12)";
  ctx.fillRect(x + 4, y + 4, 60, 84);
  const fh = 84 * clamp(fill, 0, 1);
  const grad = ctx.createLinearGradient(x, y + 92, x, y);
  grad.addColorStop(0, "#7a3fc7");
  grad.addColorStop(0.5, "#f89a2c");
  grad.addColorStop(1, "#c63f5c");
  ctx.fillStyle = grad;
  ctx.fillRect(x + 4, y + 88 - fh, 60, fh);
}

function drawBubble(x, y, w, h, text) {
  ctx.fillStyle = "rgba(255,241,214,.94)";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "rgba(255,241,214,.94)";
  triangle(x + 24, y + h, x + 48, y + h, x + 30, y + h + 20);
  ctx.strokeStyle = COLORS.plum;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = COLORS.plum;
  ctx.font = "bold 16px Trebuchet MS";
  wrapText(text, x + 16, y + 26, w - 32, 19);
}

function drawWave(y, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = 0; x <= W; x += 8) {
    const yy = y + Math.sin(x * 0.02 + clock * 1.3) * 5;
    if (x === 0) ctx.moveTo(x, yy);
    else ctx.lineTo(x, yy);
  }
  ctx.stroke();
}

function person(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x - 6, y - 18, 12, 22);
  ctx.fillStyle = COLORS.cream;
  ctx.fillRect(x - 5, y - 30, 10, 10);
}

function trueBox() { return { x: 548, y: 426, w: 120, h: 38 }; }
function falseBox() { return { x: 704, y: 426, w: 120, h: 38 }; }
function acceptBox() { return { x: 654, y: 180, w: 92, h: 36 }; }
function rejectBox() { return { x: 762, y: 180, w: 92, h: 36 }; }
function finalAcceptBox() { return { x: 574, y: 438, w: 112, h: 36 }; }
function finalRejectBox() { return { x: 704, y: 438, w: 112, h: 36 }; }

function insideFruit(p, box) {
  return p.x >= box.x - box.w / 2 && p.x <= box.x + box.w / 2 && p.y >= box.y - box.h / 2 && p.y <= box.y + box.h / 2;
}

function point(event) {
  return pointFromClient(event.clientX, event.clientY);
}

function pointFromClient(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((clientX - rect.left) / rect.width) * W,
    y: ((clientY - rect.top) / rect.height) * H
  };
}

function inside(p, box) {
  return p.x >= box.x && p.x <= box.x + box.w && p.y >= box.y && p.y <= box.y + box.h;
}

function dist(x1, y1, x2, y2) {
  return Math.hypot(x1 - x2, y1 - y2);
}

function routeLength(points) {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) total += dist(points[i - 1].x, points[i - 1].y, points[i].x, points[i].y);
  return total;
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
  for (let i = 0; i < words.length; i += 1) {
    const test = line ? `${line} ${words[i]}` : words[i];
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      line = words[i];
      y += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, y);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function heartText(hearts) {
  return Array.from({ length: 3 }, (_, i) => i < hearts ? "♥" : "♡").join(" ");
}

function rgba(hex, alpha) {
  if (!hex.startsWith("#")) return hex;
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

function angleDiff(a, b) {
  return Math.atan2(Math.sin(a - b), Math.cos(a - b));
}

updateMenu();
