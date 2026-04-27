const quizScreen = document.getElementById("quiz-screen");
const levelScreen = document.getElementById("level-screen");
const gameScreen = document.getElementById("game-screen");
const teaserScreen = document.getElementById("teaser-screen");

const optionsEl = document.getElementById("options");
const submitQuiz = document.getElementById("submit-quiz");
const quizMessage = document.getElementById("quiz-message");

const levelButtons = document.querySelectorAll(".level-btn");
const levelMessage = document.getElementById("level-message");

const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

const gameTitle = document.getElementById("game-title");
const gameHint = document.getElementById("game-hint");
const backBtn = document.getElementById("back-btn");

const popup = document.getElementById("complete-popup");
const completeTitle = document.getElementById("complete-title");
const completeText = document.getElementById("complete-text");
const continueBtn = document.getElementById("continue-btn");

const ingredients = [
  "Grape",
  "Mango",
  "Passion",
  "Orange",
  "Pomegranate",
  "Berry",
  "Peach",
  "Lemon",
  "Mint",
  "Vanilla",
  "Strawberry",
  "Cherry",
  "Watermelon",
  "Blueberry",
  "Apple",
  "Pineapple"
];

const correctIngredients = ["Grape", "Passion", "Pomegranate", "Berry", "Orange"];

let selectedIngredients = [];
let currentLevel = 1;
let completedLevels = new Set();
let animationFrameId = null;

let levelComplete = false;
let lastTime = 0;

const levels = {
  1: {
    title: "LEVEL 1: JUICE + BEACH",
    hint: "Start at Juice Palace.",
    setting: "beach"
  },
  2: {
    title: "LEVEL 2: MOUNTAIN HIDEOUT",
    hint: "Avoid the coast guard. Fill the bars.",
    setting: "mountain"
  },
  3: {
    title: "LEVEL 3: ALAM CRUISE",
    hint: "Click the moments in order.",
    setting: "cruise"
  }
};

/* ---------- QUIZ ---------- */

function renderOptions() {
  optionsEl.innerHTML = "";

  ingredients.forEach(item => {
    const btn = document.createElement("button");
    btn.className = "option";
    btn.textContent = item;

    btn.addEventListener("click", () => {
      if (selectedIngredients.includes(item)) {
        selectedIngredients = selectedIngredients.filter(x => x !== item);
        btn.classList.remove("selected");
      } else {
        selectedIngredients.push(item);
        btn.classList.add("selected");
      }
    });

    optionsEl.appendChild(btn);
  });
}

submitQuiz.addEventListener("click", () => {
  const sortedSelected = [...selectedIngredients].sort().join(",");
  const sortedCorrect = [...correctIngredients].sort().join(",");

  document.querySelectorAll(".option").forEach(btn => {
    if (correctIngredients.includes(btn.textContent)) {
      btn.classList.add("correct");
    }
  });

  if (sortedSelected === sortedCorrect) {
    quizMessage.textContent = "perfect mix.";

    setTimeout(() => {
      quizScreen.classList.add("hidden");
      levelScreen.classList.remove("hidden");
      document.body.classList.add("game-mode");
      updateLevelButtons();
    }, 900);
  } else {
    quizMessage.textContent = "almost... something’s missing.";
  }
});

/* ---------- LEVEL SELECT ---------- */

levelButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    startLevel(Number(btn.dataset.level));
  });
});

backBtn.addEventListener("click", () => {
  stopGameLoop();
  gameScreen.classList.add("hidden");
  levelScreen.classList.remove("hidden");
  updateLevelButtons();
});

continueBtn.addEventListener("click", () => {
  popup.classList.add("hidden");
  completedLevels.add(currentLevel);

  if (completedLevels.size >= 3) {
    gameScreen.classList.add("hidden");
    teaserScreen.classList.remove("hidden");
    return;
  }

  gameScreen.classList.add("hidden");
  levelScreen.classList.remove("hidden");
  updateLevelButtons();
});

function updateLevelButtons() {
  levelButtons.forEach(btn => {
    const level = Number(btn.dataset.level);
    btn.classList.toggle("done", completedLevels.has(level));
  });

  levelMessage.textContent =
    completedLevels.size === 0
      ? "Pick any spot."
      : `${completedLevels.size}/3 spots cleared.`;
}

/* ---------- LEVEL 1 BEACH ---------- */

let beachPhase = "juice";
let beachTimer = 18;
let beachSpotTaken = false;
let juiceItems = [
  { name: "Grape", x: 140, y: 350, chosen: false },
  { name: "Passion", x: 260, y: 350, chosen: false },
  { name: "Orange", x: 380, y: 350, chosen: false }
];

let beachSpots = [
  { x: 700, y: 310, w: 95, h: 70, taken: false, good: true },
  { x: 610, y: 360, w: 90, h: 65, taken: false, good: false },
  { x: 800, y: 370, w: 90, h: 65, taken: false, good: false }
];

/* ---------- LEVEL 2 MOUNTAIN ---------- */

let mountain = {
  lives: 3,
  photos: 0,
  smoke: 0,
  kiss: 0,
  fries: false,
  steak: false,
  guardX: 120,
  guardDir: 1,
  spottedCooldown: 0,
  message: "Click the food truck first."
};

/* ---------- LEVEL 3 CRUISE ---------- */

let cruiseStep = 0;
let cruiseWave = 0;

const cruiseSteps = [
  { hint: "Click the private boat.", x: 100, y: 330, w: 135, h: 80 },
  { hint: "Catch the calm wave.", x: 390, y: 320, w: 180, h: 70 },
  { hint: "Click Alam Palace.", x: 650, y: 170, w: 235, h: 120 },
  { hint: "Take the quiet moment.", x: 720, y: 300, w: 140, h: 100 }
];

/* ---------- START GAME ---------- */

function startLevel(level) {
  currentLevel = level;
  levelComplete = false;

  const info = levels[level];
  gameTitle.textContent = info.title;
  gameHint.textContent = info.hint;

  levelScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");

  stopGameLoop();

  if (level === 1) setupBeach();
  if (level === 2) setupMountain();
  if (level === 3) setupCruise();

  startGameLoop();
}

function stopGameLoop() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}

function startGameLoop() {
  lastTime = performance.now();

  function loop(time) {
    const delta = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;

    update(delta);
    draw();

    animationFrameId = requestAnimationFrame(loop);
  }

  loop(lastTime);
}

/* ---------- SETUPS ---------- */

function setupBeach() {
  beachPhase = "juice";
  beachTimer = 18;
  beachSpotTaken = false;

  juiceItems.forEach(i => i.chosen = false);
  beachSpots.forEach(i => i.taken = false);

  gameHint.textContent = "At Juice Palace: pick the 3 visible juice ingredients.";
  canvas.onclick = handleBeachClick;
}

function setupMountain() {
  mountain = {
    lives: 3,
    photos: 0,
    smoke: 0,
    kiss: 0,
    fries: false,
    steak: false,
    guardX: 120,
    guardDir: 1,
    spottedCooldown: 0,
    message: "Click the food truck first."
  };

  gameHint.textContent = mountain.message;
  canvas.onclick = handleMountainClick;
}

function setupCruise() {
  cruiseStep = 0;
  cruiseWave = 0;
  gameHint.textContent = cruiseSteps[0].hint;
  canvas.onclick = handleCruiseClick;
}

/* ---------- UPDATES ---------- */

function update(delta) {
  if (levelComplete) return;

  if (currentLevel === 1) updateBeach(delta);
  if (currentLevel === 2) updateMountain(delta);
}

function updateBeach(delta) {
  if (beachPhase !== "spot") return;

  beachTimer -= delta;

  if (beachTimer <= 0) {
    beachSpotTaken = true;
    gameHint.textContent = "Someone took the best spot. Try again.";
    setTimeout(setupBeach, 1000);
  }
}

function updateMountain(delta) {
  mountain.guardX += mountain.guardDir * 70 * delta;

  if (mountain.guardX > 820) mountain.guardDir = -1;
  if (mountain.guardX < 100) mountain.guardDir = 1;

  if (mountain.spottedCooldown > 0) {
    mountain.spottedCooldown -= delta;
  }

  const inDanger =
    mountain.guardX > 560 &&
    mountain.guardX < 780 &&
    mountain.spottedCooldown <= 0;

  const doingRisky = mountain.smoke > 0 || mountain.kiss > 0;

  if (inDanger && doingRisky) {
    mountain.lives--;
    mountain.spottedCooldown = 2;
    mountain.message = "Coast guard saw you. Act normal.";
    gameHint.textContent = mountain.message;

    if (mountain.lives <= 0) {
      mountain.message = "You got caught. Restarting mountain...";
      gameHint.textContent = mountain.message;
      setTimeout(setupMountain, 1100);
    }
  }

  if (
    mountain.fries &&
    mountain.steak &&
    mountain.photos >= 4 &&
    mountain.smoke >= 100 &&
    mountain.kiss >= 100
  ) {
    showComplete();
  }
}

/* ---------- CLICKS ---------- */

function handleBeachClick(e) {
  const p = getCanvasPoint(e);

  if (beachPhase === "juice") {
    juiceItems.forEach(item => {
      if (distance(p.x, p.y, item.x, item.y) < 45) {
        item.chosen = true;
      }
    });

    if (juiceItems.every(i => i.chosen)) {
      beachPhase = "spot";
      beachTimer = 18;
      gameHint.textContent = "Find the best beach spot before someone takes it.";
    }

    return;
  }

  if (beachPhase === "spot") {
    const clicked = beachSpots.find(s => isInside(p, s));

    if (!clicked) {
      gameHint.textContent = "Not a beach spot.";
      return;
    }

    if (clicked.good) {
      showComplete();
    } else {
      clicked.taken = true;
      gameHint.textContent = "That spot is okay... but not the one.";
    }
  }
}

function handleMountainClick(e) {
  const p = getCanvasPoint(e);

  if (isInside(p, { x: 95, y: 300, w: 210, h: 130 })) {
    mountain.fries = true;
    mountain.steak = true;
    mountain.message = "Fries and steak secured. Now take 4 digicam photos.";
  }

  if (isInside(p, { x: 355, y: 250, w: 120, h: 110 })) {
    mountain.photos = Math.min(4, mountain.photos + 1);
    mountain.message = `Photo ${mountain.photos}/4 captured.`;
  }

  if (isInside(p, { x: 570, y: 330, w: 130, h: 90 })) {
    mountain.smoke = Math.min(100, mountain.smoke + 20);
    mountain.message = "Smoking bar filling...";
  }

  if (isInside(p, { x: 720, y: 330, w: 130, h: 90 })) {
    mountain.kiss = Math.min(100, mountain.kiss + 20);
    mountain.message = "Kissing bar filling...";
  }

  gameHint.textContent = mountain.message;
}

function handleCruiseClick(e) {
  const p = getCanvasPoint(e);
  const target = cruiseSteps[cruiseStep];

  if (isInside(p, target)) {
    cruiseStep++;

    if (cruiseStep >= cruiseSteps.length) {
      showComplete();
      return;
    }

    gameHint.textContent = cruiseSteps[cruiseStep].hint;
  } else {
    gameHint.textContent = "The tide says nope.";
    setTimeout(() => {
      if (!levelComplete) gameHint.textContent = cruiseSteps[cruiseStep].hint;
    }, 700);
  }
}

/* ---------- DRAW ---------- */

function draw() {
  if (currentLevel === 1) drawBeach();
  if (currentLevel === 2) drawMountain();
  if (currentLevel === 3) drawCruise();
}

function drawBeach() {
  ctx.fillStyle = "#8fdff0";
  ctx.fillRect(0, 0, 960, 250);

  ctx.fillStyle = "#39b8d2";
  ctx.fillRect(0, 155, 960, 100);

  ctx.fillStyle = "#f3d28a";
  ctx.fillRect(0, 250, 960, 290);

  drawSun(820, 62);
  drawCloud(110, 70);
  drawCloud(240, 42);

  drawJuicePalace();

  juiceItems.forEach(item => {
    drawFruit(item.x, item.y, item.name, item.chosen);
  });

  beachSpots.forEach(s => {
    drawBeachSpot(s);
  });

  if (beachPhase === "spot") {
    drawTimer(35, 35, beachTimer, 18);
  }
}

function drawMountain() {
  ctx.fillStyle = "#d3b08b";
  ctx.fillRect(0, 0, 960, 540);

  ctx.fillStyle = "#2f2f34";
  drawTriangle(0, 420, 210, 80, 420, 420);
  drawTriangle(220, 420, 470, 65, 720, 420);
  drawTriangle(520, 420, 760, 85, 960, 420);

  ctx.fillStyle = "#66503f";
  ctx.fillRect(0, 420, 960, 120);

  drawRoad(0, 400, 960, 80, "#8b7a67");
  drawTower(790, 100);
  drawFoodTruck(95, 300);
  drawDigicam(385, 280);
  drawChillZone();

  drawGuard();
  drawBars();
}

function drawCruise() {
  cruiseWave += 0.04;

  ctx.fillStyle = "#a8e4f0";
  ctx.fillRect(0, 0, 960, 540);

  ctx.fillStyle = "#3bb5c8";
  ctx.fillRect(0, 260, 960, 280);

  ctx.fillStyle = "#373737";
  drawTriangle(0, 260, 110, 90, 260, 260);
  drawTriangle(650, 260, 780, 90, 960, 260);

  drawPalace(650, 185);
  drawWavePattern();

  drawBoat(100, 345, "#fff");
  if (cruiseStep >= 1) drawBoat(410, 350 + Math.sin(cruiseWave) * 8, "#fff");
  if (cruiseStep >= 2) drawBoat(720, 330, "#fff");
  if (cruiseStep >= 3) drawHeart(790, 295);

  drawTargetBox(cruiseSteps[Math.min(cruiseStep, cruiseSteps.length - 1)]);
}

/* ---------- PIXEL DRAW HELPERS ---------- */

function drawJuicePalace() {
  ctx.fillStyle = "#7b1730";
  ctx.fillRect(80, 195, 310, 115);

  ctx.fillStyle = "#fff0c9";
  ctx.fillRect(100, 220, 270, 50);

  ctx.fillStyle = "#2b0c18";
  ctx.font = "18px monospace";
  ctx.fillText("JUICE PALACE", 125, 248);

  ctx.font = "16px monospace";
  ctx.fillText("قصر العصائر", 180, 292);

  ctx.fillStyle = "#ff9c2b";
  ctx.fillRect(80, 185, 310, 18);
}

function drawFruit(x, y, label, chosen) {
  ctx.fillStyle = chosen ? "#7cff9b" : "#fff0c9";
  ctx.fillRect(x - 28, y - 28, 56, 56);

  ctx.fillStyle = "#111";
  ctx.font = "9px monospace";
  ctx.fillText(label.slice(0, 6), x - 24, y + 4);
}

function drawBeachSpot(s) {
  ctx.fillStyle = s.good ? "rgba(255, 211, 138, 0.7)" : "rgba(255,255,255,0.25)";
  ctx.fillRect(s.x, s.y, s.w, s.h);

  ctx.strokeStyle = "#fff0c9";
  ctx.lineWidth = 3;
  ctx.strokeRect(s.x, s.y, s.w, s.h);
}

function drawFoodTruck(x, y) {
  ctx.fillStyle = "#fff0c9";
  ctx.fillRect(x, y, 210, 90);

  ctx.fillStyle = "#7b1730";
  ctx.fillRect(x + 15, y + 15, 120, 30);

  ctx.fillStyle = "#111";
  ctx.font = "12px monospace";
  ctx.fillText("STEAK + FRIES", x + 22, y + 35);

  ctx.fillStyle = "#111";
  ctx.fillRect(x + 25, y + 80, 25, 25);
  ctx.fillRect(x + 150, y + 80, 25, 25);
}

function drawDigicam(x, y) {
  ctx.fillStyle = "#222";
  ctx.fillRect(x, y, 95, 65);

  ctx.fillStyle = "#9cd7ff";
  ctx.fillRect(x + 55, y + 15, 26, 26);

  ctx.fillStyle = "#fff";
  ctx.font = "10px monospace";
  ctx.fillText("DIGICAM", x + 10, y + 55);
}

function drawChillZone() {
  ctx.fillStyle = "#fff0c9";
  ctx.fillRect(585, 355, 110, 16);
  ctx.fillRect(730, 355, 110, 16);

  ctx.fillStyle = "#ff9ccf";
  ctx.fillRect(615, 325, 18, 30);

  ctx.fillStyle = "#8cc7ff";
  ctx.fillRect(755, 325, 18, 30);

  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.strokeStyle = "#fff0c9";
  ctx.lineWidth = 3;
  ctx.strokeRect(570, 330, 130, 90);
  ctx.strokeRect(720, 330, 130, 90);
}

function drawGuard() {
  ctx.fillStyle = "#0b2638";
  ctx.fillRect(mountain.guardX, 255, 34, 54);

  ctx.fillStyle = "#fff";
  ctx.fillRect(mountain.guardX + 8, 240, 18, 18);

  ctx.strokeStyle = "rgba(255,255,160,0.35)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(mountain.guardX + 17, 270);
  ctx.lineTo(mountain.guardX + 130 * mountain.guardDir, 330);
  ctx.lineTo(mountain.guardX + 130 * mountain.guardDir, 220);
  ctx.closePath();
  ctx.stroke();

  ctx.fillStyle = "#fff";
  ctx.font = "10px monospace";
  ctx.fillText("COAST GUARD", mountain.guardX - 20, 235);
}

function drawBars() {
  drawMiniBar(30, 28, "LIVES", mountain.lives / 3, "#ff6b6b");
  drawMiniBar(30, 60, "PHOTO", mountain.photos / 4, "#9cd7ff");
  drawMiniBar(30, 92, "SMOKE", mountain.smoke / 100, "#b5b5b5");
  drawMiniBar(30, 124, "KISS", mountain.kiss / 100, "#ff9ccf");

  ctx.fillStyle = "#fff0c9";
  ctx.font = "11px monospace";
  ctx.fillText(`FRIES: ${mountain.fries ? "YES" : "NO"}`, 30, 170);
  ctx.fillText(`STEAK: ${mountain.steak ? "YES" : "NO"}`, 30, 190);
}

function drawMiniBar(x, y, label, amount, color) {
  ctx.fillStyle = "#111";
  ctx.fillRect(x, y, 160, 16);

  ctx.fillStyle = color;
  ctx.fillRect(x, y, 160 * amount, 16);

  ctx.strokeStyle = "#fff0c9";
  ctx.strokeRect(x, y, 160, 16);

  ctx.fillStyle = "#fff";
  ctx.font = "10px monospace";
  ctx.fillText(label, x + 170, y + 12);
}

function drawRoad(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);

  ctx.fillStyle = "rgba(255,255,255,0.6)";
  for (let i = 0; i < w; i += 80) {
    ctx.fillRect(i + 20, y + h / 2, 40, 5);
  }
}

function drawTower(x, y) {
  ctx.strokeStyle = "#222";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x, y + 230);
  ctx.lineTo(x + 45, y);
  ctx.lineTo(x + 90, y + 230);
  ctx.moveTo(x + 20, y + 90);
  ctx.lineTo(x + 70, y + 90);
  ctx.moveTo(x + 10, y + 155);
  ctx.lineTo(x + 80, y + 155);
  ctx.stroke();
}

function drawPalace(x, y) {
  ctx.fillStyle = "#fff";
  ctx.fillRect(x, y, 220, 80);

  ctx.fillStyle = "#3d3d3d";
  ctx.fillRect(x + 80, y + 20, 60, 60);

  ctx.fillStyle = "#d8b48a";
  ctx.fillRect(x + 95, y + 5, 30, 15);

  ctx.fillStyle = "#fff";
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(x + 15 + i * 38, y + 30, 18, 50);
  }
}

function drawBoat(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 90, 28);

  ctx.fillStyle = "#d9f7ff";
  ctx.fillRect(x + 22, y - 18, 46, 20);

  ctx.fillStyle = "#0f6b8a";
  ctx.fillRect(x - 8, y + 26, 106, 5);
}

function drawTargetBox(target) {
  if (!target || levelComplete) return;

  ctx.strokeStyle = "#ffd38a";
  ctx.lineWidth = 4;
  ctx.setLineDash([8, 8]);
  ctx.strokeRect(target.x, target.y, target.w, target.h);
  ctx.setLineDash([]);
}

function drawTimer(x, y, value, max) {
  ctx.fillStyle = "#111";
  ctx.fillRect(x, y, 190, 22);

  ctx.fillStyle = "#ff9c2b";
  ctx.fillRect(x, y, 190 * Math.max(0, value / max), 22);

  ctx.strokeStyle = "#fff0c9";
  ctx.strokeRect(x, y, 190, 22);

  ctx.fillStyle = "#fff";
  ctx.font = "12px monospace";
  ctx.fillText(`TIME ${Math.ceil(value)}`, x + 50, y + 16);
}

function drawSun(x, y) {
  ctx.fillStyle = "#ffd15c";
  ctx.fillRect(x, y, 42, 42);
}

function drawCloud(x, y) {
  ctx.fillStyle = "#fff";
  ctx.fillRect(x, y, 50, 20);
  ctx.fillRect(x + 18, y - 14, 38, 34);
  ctx.fillRect(x + 48, y + 5, 38, 15);
}

function drawHeart(x, y) {
  ctx.fillStyle = "#ff6b9a";
  ctx.fillRect(x, y + 8, 12, 12);
  ctx.fillRect(x + 24, y + 8, 12, 12);
  ctx.fillRect(x + 12, y + 20, 24, 12);
  ctx.fillRect(x + 18, y + 32, 12, 12);
}

function drawWavePattern() {
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = 3;

  for (let y = 300; y < 510; y += 44) {
    ctx.beginPath();

    for (let x = 0; x < 960; x += 20) {
      const waveY = y + Math.sin((x * 0.03) + cruiseWave) * 8;
      if (x === 0) ctx.moveTo(x, waveY);
      else ctx.lineTo(x, waveY);
    }

    ctx.stroke();
  }
}

function drawTriangle(x1, y1, x2, y2, x3, y3) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x3, y3);
  ctx.closePath();
  ctx.fill();
}

/* ---------- COMPLETE ---------- */

function showComplete() {
  levelComplete = true;

  completeTitle.textContent = `LEVEL ${currentLevel} CLEARED`;

  if (currentLevel === 1) {
    completeText.textContent = "Juice secured. Beach spot claimed before anyone took it.";
  } else if (currentLevel === 2) {
    completeText.textContent = "Fries, steak, photos, smoke, and kisses. No witnesses.";
  } else {
    completeText.textContent = "Cruise complete. Alam Palace looks perfect from here.";
  }

  popup.classList.remove("hidden");
}

/* ---------- HELPERS ---------- */

function getCanvasPoint(e) {
  const rect = canvas.getBoundingClientRect();

  return {
    x: ((e.clientX - rect.left) / rect.width) * canvas.width,
    y: ((e.clientY - rect.top) / rect.height) * canvas.height
  };
}

function isInside(point, box) {
  return (
    point.x >= box.x &&
    point.x <= box.x + box.w &&
    point.y >= box.y &&
    point.y <= box.y + box.h
  );
}

function distance(x1, y1, x2, y2) {
  return Math.hypot(x1 - x2, y1 - y2);
}

renderOptions();
