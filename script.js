const homeScreen = document.getElementById("home-screen");
const gameScreen = document.getElementById("game-screen");
const teaserScreen = document.getElementById("teaser-screen");

const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

const gameTitle = document.getElementById("game-title");
const gameHint = document.getElementById("game-hint");
const statusEl = document.getElementById("status");

const popup = document.getElementById("popup");
const popupTitle = document.getElementById("popup-title");
const popupText = document.getElementById("popup-text");
const popupBtn = document.getElementById("popup-btn");

const backBtn = document.getElementById("back-btn");
const menuMessage = document.getElementById("menu-message");
const levelButtons = document.querySelectorAll(".level-btn");

let currentLevel = 1;
let completed = new Set();
let frameId = null;
let lastTime = 0;
let levelDone = false;

let beach = {};
let mountain = {};
let cruise = {};

levelButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    startLevel(Number(btn.dataset.level));
  });
});

backBtn.addEventListener("click", () => {
  stopLoop();
  gameScreen.classList.add("hidden");
  homeScreen.classList.remove("hidden");
  updateMenu();
});

popupBtn.addEventListener("click", () => {
  popup.classList.add("hidden");
  completed.add(currentLevel);

  if (completed.size >= 3) {
    gameScreen.classList.add("hidden");
    teaserScreen.classList.remove("hidden");
    return;
  }

  gameScreen.classList.add("hidden");
  homeScreen.classList.remove("hidden");
  updateMenu();
});

function updateMenu() {
  levelButtons.forEach(btn => {
    btn.classList.toggle("done", completed.has(Number(btn.dataset.level)));
  });

  menuMessage.textContent = completed.size
    ? `${completed.size}/3 spots cleared.`
    : "Pick a spot to start.";
}

function startLevel(level) {
  currentLevel = level;
  levelDone = false;

  homeScreen.classList.add("hidden");
  teaserScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");
  document.body.classList.add("game-mode");

  if (level === 1) setupBeach();
  if (level === 2) setupMountain();
  if (level === 3) setupCruise();

  stopLoop();
  startLoop();
}

/* ---------------- LEVEL 1: JUICE + BEACH ---------------- */

function setupBeach() {
  gameTitle.textContent = "01 JUICE + BEACH";

  beach = {
    phase: "juice",
    timer: 18,
    selected: [],
    message: "Make نسبة وتناسب. Pick the correct ingredients.",
    ingredients: [
      { name: "Grape", correct: true, x: 95, y: 345 },
      { name: "Passion", correct: true, x: 220, y: 345 },
      { name: "Pomegranate", correct: true, x: 365, y: 345 },
      { name: "Berry", correct: true, x: 535, y: 345 },
      { name: "Orange", correct: true, x: 690, y: 345 },
      { name: "Mango", correct: false, x: 830, y: 345 },
      { name: "Mint", correct: false, x: 170, y: 445 },
      { name: "Lemon", correct: false, x: 330, y: 445 },
      { name: "Peach", correct: false, x: 490, y: 445 },
      { name: "Vanilla", correct: false, x: 660, y: 445 }
    ],
    spots: [
      { x: 690, y: 302, w: 120, h: 78, good: true, taken: false },
      { x: 570, y: 380, w: 105, h: 70, good: false, taken: false },
      { x: 820, y: 392, w: 95, h: 65, good: false, taken: false }
    ]
  };

  gameHint.textContent = beach.message;
  statusEl.textContent = "JUICE";
  canvas.onclick = beachClick;
}

function beachClick(e) {
  const p = point(e);

  if (beach.phase === "juice") {
    beach.ingredients.forEach(item => {
      if (distance(p.x, p.y, item.x, item.y) < 46) {
        if (beach.selected.includes(item.name)) {
          beach.selected = beach.selected.filter(x => x !== item.name);
        } else {
          beach.selected.push(item.name);
        }
      }
    });

    const correct = beach.ingredients.filter(i => i.correct).map(i => i.name).sort().join(",");
    const selected = [...beach.selected].sort().join(",");

    if (selected === correct) {
      beach.phase = "spot";
      beach.timer = 18;
      gameHint.textContent = "Perfect. Now find the best beach spot before someone takes it.";
      statusEl.textContent = "TIME 18";
    } else if (beach.selected.length >= 5) {
      gameHint.textContent = "Something is off. Remove the wrong ingredient.";
    }

    return;
  }

  if (beach.phase === "spot") {
    const spot = beach.spots.find(s => inside(p, s));

    if (!spot) {
      gameHint.textContent = "That is not a spot.";
      return;
    }

    if (spot.good) {
      winLevel("Juice secured. Best beach spot claimed.");
    } else {
      spot.taken = true;
      gameHint.textContent = "Too exposed. Try a better spot.";
    }
  }
}

/* ---------------- LEVEL 2: MOUNTAIN HIDEOUT ---------------- */

function setupMountain() {
  gameTitle.textContent = "02 MOUNTAIN HIDEOUT";

  mountain = {
    lives: 3,
    fries: false,
    steak: false,
    photos: 0,
    smoke: 0,
    kiss: 0,
    cardRound: 0,
    cardOpen: [],
    cardMessage: "",
    guardX: 110,
    guardDir: 1,
    cooldown: 0,
    message: "Get steak + fries, take photos, play cards, fill the bars. Avoid the guard."
  };

  mountain.cards = makeMountainCards();

  gameHint.textContent = mountain.message;
  canvas.onclick = mountainClick;
}

function makeMountainCards() {
  const labels = ["Q♥", "Q♥", "K♠", "K♠", "A♦", "A♦"];
  return labels
    .sort(() => Math.random() - 0.5)
    .map((label, i) => ({
      id: i,
      label,
      matched: false,
      open: false,
      x: 410 + (i % 3) * 48,
      y: 390 + Math.floor(i / 3) * 54,
      w: 36,
      h: 46
    }));
}

function mountainClick(e) {
  const p = point(e);

  if (inside(p, { x: 70, y: 300, w: 235, h: 130 })) {
    mountain.fries = true;
    mountain.steak = true;
    mountain.message = "Food secured. Now take 4 digicam photos.";
  }

  if (inside(p, { x: 350, y: 255, w: 145, h: 110 })) {
    mountain.photos = Math.min(4, mountain.photos + 1);
    mountain.message = `Photo ${mountain.photos}/4 captured.`;
  }

  if (inside(p, { x: 560, y: 330, w: 135, h: 95 })) {
    if (guardWatching()) punishGuard("Guard saw the smoke.");
    else {
      mountain.smoke = Math.min(100, mountain.smoke + 20);
      mountain.message = "Smoking bar filling...";
    }
  }

  if (inside(p, { x: 720, y: 330, w: 135, h: 95 })) {
    if (guardWatching()) punishGuard("Guard saw the kiss.");
    else {
      mountain.kiss = Math.min(100, mountain.kiss + 20);
      mountain.message = "Kissing bar filling...";
    }
  }

  const card = mountain.cards.find(c => inside(p, c) && !c.matched && !c.open);
  if (card) openMountainCard(card);

  gameHint.textContent = mountain.message;
}

function openMountainCard(card) {
  if (mountain.cardOpen.length >= 2) return;

  card.open = true;
  mountain.cardOpen.push(card);

  if (mountain.cardOpen.length === 2) {
    const [a, b] = mountain.cardOpen;

    if (a.label === b.label) {
      a.matched = true;
      b.matched = true;
      mountain.cardOpen = [];
      mountain.message = "Card pair matched.";
    } else {
      mountain.message = "Not a pair.";
      setTimeout(() => {
        a.open = false;
        b.open = false;
        mountain.cardOpen = [];
      }, 650);
    }
  }
}

function guardWatching() {
  return mountain.guardX > 530 && mountain.guardX < 835 && mountain.cooldown <= 0;
}

function punishGuard(text) {
  mountain.lives--;
  mountain.cooldown = 2.2;
  mountain.message = `${text} Act normal.`;

  if (mountain.lives <= 0) {
    mountain.message = "Caught. Restarting mountain...";
    setTimeout(setupMountain, 1000);
  }
}

/* ---------------- LEVEL 3: ALAM CRUISE ---------------- */

function setupCruise() {
  gameTitle.textContent = "03 ALAM CRUISE";

  cruise = {
    step: 0,
    wave: 0,
    steps: [
      { hint: "Click the private boat.", x: 100, y: 330, w: 140, h: 85 },
      { hint: "Catch the calm wave.", x: 390, y: 315, w: 190, h: 80 },
      { hint: "Click Alam Palace.", x: 640, y: 160, w: 250, h: 130 },
      { hint: "Take the quiet moment.", x: 720, y: 300, w: 150, h: 110 }
    ]
  };

  gameHint.textContent = cruise.steps[0].hint;
  statusEl.textContent = "MOMENT 1/4";
  canvas.onclick = cruiseClick;
}

function cruiseClick(e) {
  const p = point(e);
  const target = cruise.steps[cruise.step];

  if (inside(p, target)) {
    cruise.step++;

    if (cruise.step >= cruise.steps.length) {
      winLevel("Cruise complete. Alam Palace view secured.");
      return;
    }

    gameHint.textContent = cruise.steps[cruise.step].hint;
    statusEl.textContent = `MOMENT ${cruise.step + 1}/4`;
  } else {
    gameHint.textContent = "Wrong moment. Try again.";
  }
}

/* ---------------- LOOP ---------------- */

function startLoop() {
  lastTime = performance.now();

  function loop(time) {
    const dt = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;

    update(dt);
    draw();

    frameId = requestAnimationFrame(loop);
  }

  loop(lastTime);
}

function stopLoop() {
  if (frameId) cancelAnimationFrame(frameId);
  frameId = null;
}

function update(dt) {
  if (levelDone) return;

  if (currentLevel === 1 && beach.phase === "spot") {
    beach.timer -= dt;
    statusEl.textContent = `TIME ${Math.ceil(beach.timer)}`;

    if (beach.timer <= 0) {
      gameHint.textContent = "Someone took the best spot. Restarting...";
      setTimeout(setupBeach, 900);
    }
  }

  if (currentLevel === 2) {
    mountain.guardX += mountain.guardDir * 82 * dt;

    if (mountain.guardX > 820) mountain.guardDir = -1;
    if (mountain.guardX < 100) mountain.guardDir = 1;

    if (mountain.cooldown > 0) mountain.cooldown -= dt;

    const allCardsMatched = mountain.cards.every(c => c.matched);

    statusEl.textContent = "♥ ".repeat(mountain.lives).trim();

    if (
      mountain.fries &&
      mountain.steak &&
      mountain.photos >= 4 &&
      mountain.smoke >= 100 &&
      mountain.kiss >= 100 &&
      allCardsMatched
    ) {
      winLevel("Food, photos, cards, smoke, kisses. No witnesses.");
    }
  }
}

/* ---------------- DRAW ---------------- */

function draw() {
  if (currentLevel === 1) drawBeach();
  if (currentLevel === 2) drawMountain();
  if (currentLevel === 3) drawCruise();
}

function drawBeach() {
  skySeaSand();
  drawJuicePalace();

  if (beach.phase === "juice") {
    beach.ingredients.forEach(drawIngredient);
  }

  if (beach.phase === "spot") {
    beach.spots.forEach(drawSpot);
    drawTimer(36, 35, beach.timer, 18);
  }
}

function drawMountain() {
  mountainBg();
  drawTower(800, 100);
  drawFoodTruck(70, 300);
  drawCamera(380, 265);
  drawCardGame();
  drawCoupleZones();
  drawGuard();
  drawMountainBars();
}

function drawCruise() {
  cruise.wave += 0.04;
  cruiseBg();
  drawPalace(640, 165);
  drawWaves();

  drawBoat(105, 350);
  if (cruise.step >= 1) drawBoat(405, 345 + Math.sin(cruise.wave) * 8);
  if (cruise.step >= 2) drawBoat(730, 330);
  if (cruise.step >= 3) drawHeart(785, 295);

  drawTarget(cruise.steps[Math.min(cruise.step, cruise.steps.length - 1)]);
}

/* ---------------- PIXEL ART ---------------- */

function skySeaSand() {
  ctx.fillStyle = "#7bd9f0";
  ctx.fillRect(0, 0, 960, 230);
  ctx.fillStyle = "#25a7c6";
  ctx.fillRect(0, 160, 960, 90);
  ctx.fillStyle = "#f0c97b";
  ctx.fillRect(0, 230, 960, 310);
  drawSun(820, 60);
  drawCloud(120, 70);
  drawCloud(270, 50);
}

function mountainBg() {
  ctx.fillStyle = "#d1aa7c";
  ctx.fillRect(0, 0, 960, 540);

  ctx.fillStyle = "#303038";
  tri(0, 430, 220, 80, 430, 430);
  tri(250, 430, 500, 60, 760, 430);
  tri(560, 430, 760, 90, 960, 430);

  ctx.fillStyle = "#66503f";
  ctx.fillRect(0, 410, 960, 130);

  ctx.fillStyle = "#86715f";
  ctx.fillRect(0, 395, 960, 75);
}

function cruiseBg() {
  ctx.fillStyle = "#9fe5f1";
  ctx.fillRect(0, 0, 960, 260);

  ctx.fillStyle = "#28aeca";
  ctx.fillRect(0, 260, 960, 280);

  ctx.fillStyle = "#33343a";
  tri(0, 260, 120, 80, 280, 260);
  tri(650, 260, 790, 90, 960, 260);
}

function drawJuicePalace() {
  ctx.fillStyle = "#0d6170";
  ctx.fillRect(55, 140, 365, 170);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(55, 110, 365, 50);

  ctx.fillStyle = "#1f78b4";
  ctx.fillRect(55, 100, 365, 16);

  ctx.fillStyle = "#ff8a1c";
  ctx.fillRect(75, 160, 75, 150);
  ctx.fillRect(340, 160, 80, 150);

  ctx.fillStyle = "#7b1730";
  ctx.fillRect(95, 175, 260, 60);

  ctx.fillStyle = "#ffd15c";
  ctx.font = "22px monospace";
  ctx.fillText("قصر العصائر", 150, 205);

  ctx.fillStyle = "#fff4d6";
  ctx.font = "16px monospace";
  ctx.fillText("JUICE PALACE", 145, 230);

  ctx.fillStyle = "#2458a6";
  ctx.fillRect(430, 205, 45, 100);
  ctx.fillStyle = "#ffcf69";
  ctx.fillRect(437, 225, 31, 20);
}

function drawIngredient(item) {
  const selected = beach.selected.includes(item.name);

  ctx.fillStyle = selected ? "#7cff9b" : "#fff0c9";
  ctx.fillRect(item.x - 40, item.y - 34, 80, 68);

  ctx.fillStyle = item.correct ? "#ff9c2b" : "#b5b5b5";
  ctx.fillRect(item.x - 22, item.y - 22, 44, 32);

  ctx.fillStyle = "#151515";
  ctx.font = "10px monospace";
  ctx.fillText(item.name.slice(0, 7), item.x - 31, item.y + 27);
}

function drawSpot(s) {
  ctx.fillStyle = s.good ? "rgba(255, 207, 105, 0.8)" : "rgba(255,255,255,0.25)";
  ctx.fillRect(s.x, s.y, s.w, s.h);
  ctx.strokeStyle = "#fff4d6";
  ctx.lineWidth = 4;
  ctx.strokeRect(s.x, s.y, s.w, s.h);
  ctx.fillStyle = "#7b1730";
  ctx.fillRect(s.x + 20, s.y + 18, s.w - 40, 18);
}

function drawFoodTruck(x, y) {
  ctx.fillStyle = "#fff0c9";
  ctx.fillRect(x, y, 240, 95);
  ctx.fillStyle = "#7b1730";
  ctx.fillRect(x + 18, y + 18, 145, 35);
  ctx.fillStyle = "#ffd15c";
  ctx.font = "13px monospace";
  ctx.fillText("STEAK + FRIES", x + 25, y + 42);
  ctx.fillStyle = "#111";
  ctx.fillRect(x + 30, y + 82, 26, 26);
  ctx.fillRect(x + 175, y + 82, 26, 26);
}

function drawCamera(x, y) {
  ctx.fillStyle = "#222";
  ctx.fillRect(x, y, 105, 72);
  ctx.fillStyle = "#9cd7ff";
  ctx.fillRect(x + 62, y + 18, 30, 30);
  ctx.fillStyle = "#fff";
  ctx.font = "10px monospace";
  ctx.fillText("DIGICAM", x + 12, y + 58);
}

function drawCardGame() {
  ctx.fillStyle = "#2b7a4b";
  ctx.fillRect(400, 382, 185, 130);

  ctx.strokeStyle = "#fff4d6";
  ctx.lineWidth = 3;
  ctx.strokeRect(400, 382, 185, 130);

  ctx.fillStyle = "#fff4d6";
  ctx.font = "10px monospace";
  ctx.fillText("MATCH CARDS", 438, 405);

  mountain.cards.forEach(card => {
    ctx.fillStyle = card.open || card.matched ? "#fff4d6" : "#7b1730";
    ctx.fillRect(card.x, card.y, card.w, card.h);

    ctx.strokeStyle = "#111";
    ctx.lineWidth = 2;
    ctx.strokeRect(card.x, card.y, card.w, card.h);

    ctx.fillStyle = card.open || card.matched ? "#7b1730" : "#ffd15c";
    ctx.font = "12px monospace";
    ctx.fillText(card.open || card.matched ? card.label : "?", card.x + 7, card.y + 28);
  });
}

function drawCoupleZones() {
  ctx.strokeStyle = "#fff4d6";
  ctx.lineWidth = 4;
  ctx.strokeRect(560, 330, 135, 95);
  ctx.strokeRect(720, 330, 135, 95);

  ctx.fillStyle = "#ff9ccf";
  ctx.fillRect(595, 348, 22, 36);
  ctx.fillStyle = "#8cc7ff";
  ctx.fillRect(760, 348, 22, 36);

  ctx.fillStyle = "#fff0c9";
  ctx.fillRect(570, 400, 100, 10);
  ctx.fillRect(730, 400, 100, 10);
}

function drawGuard() {
  ctx.fillStyle = "#0b2638";
  ctx.fillRect(mountain.guardX, 255, 36, 56);
  ctx.fillStyle = "#fff";
  ctx.fillRect(mountain.guardX + 8, 238, 20, 20);

  ctx.strokeStyle = "rgba(255,255,160,0.38)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(mountain.guardX + 18, 270);
  ctx.lineTo(mountain.guardX + 140 * mountain.guardDir, 220);
  ctx.lineTo(mountain.guardX + 140 * mountain.guardDir, 340);
  ctx.closePath();
  ctx.stroke();

  ctx.fillStyle = "#fff";
  ctx.font = "10px monospace";
  ctx.fillText("ROP COAST GUARD", mountain.guardX - 36, 232);
}

function drawMountainBars() {
  drawBar(30, 30, "LIVES", mountain.lives / 3, "#ff6b6b");
  drawBar(30, 62, "PHOTO", mountain.photos / 4, "#8cc7ff");
  drawBar(30, 94, "SMOKE", mountain.smoke / 100, "#b5b5b5");
  drawBar(30, 126, "KISS", mountain.kiss / 100, "#ff9ccf");

  const pairs = mountain.cards.filter(c => c.matched).length / 2;
  drawBar(30, 158, "CARDS", pairs / 3, "#ffd15c");

  ctx.fillStyle = "#fff4d6";
  ctx.font = "11px monospace";
  ctx.fillText(`FRIES ${mountain.fries ? "YES" : "NO"}`, 30, 210);
  ctx.fillText(`STEAK ${mountain.steak ? "YES" : "NO"}`, 30, 230);
}

function drawBar(x, y, label, amount, color) {
  ctx.fillStyle = "#111";
  ctx.fillRect(x, y, 160, 17);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 160 * amount, 17);
  ctx.strokeStyle = "#fff4d6";
  ctx.strokeRect(x, y, 160, 17);
  ctx.fillStyle = "#fff";
  ctx.font = "10px monospace";
  ctx.fillText(label, x + 172, y + 13);
}

function drawTower(x, y) {
  ctx.strokeStyle = "#222";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x, y + 235);
  ctx.lineTo(x + 45, y);
  ctx.lineTo(x + 90, y + 235);
  ctx.moveTo(x + 20, y + 95);
  ctx.lineTo(x + 70, y + 95);
  ctx.moveTo(x + 10, y + 160);
  ctx.lineTo(x + 80, y + 160);
  ctx.stroke();
}

function drawPalace(x, y) {
  ctx.fillStyle = "#fff";
  ctx.fillRect(x, y, 230, 85);
  ctx.fillStyle = "#3c3c3c";
  ctx.fillRect(x + 83, y + 22, 65, 63);
  ctx.fillStyle = "#d8b48a";
  ctx.fillRect(x + 100, y + 4, 30, 18);

  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = "#fff";
    ctx.fillRect(x + 16 + i * 40, y + 34, 20, 51);
  }
}

function drawBoat(x, y) {
  ctx.fillStyle = "#fff";
  ctx.fillRect(x, y, 95, 28);
  ctx.fillStyle = "#d9f7ff";
  ctx.fillRect(x + 23, y - 18, 48, 20);
  ctx.fillStyle = "#0f6b8a";
  ctx.fillRect(x - 8, y + 26, 111, 5);
}

function drawWaves() {
  ctx.strokeStyle = "rgba(255,255,255,0.48)";
  ctx.lineWidth = 3;

  for (let y = 300; y < 510; y += 44) {
    ctx.beginPath();
    for (let x = 0; x < 960; x += 20) {
      const wy = y + Math.sin((x * 0.03) + cruise.wave) * 8;
      if (x === 0) ctx.moveTo(x, wy);
      else ctx.lineTo(x, wy);
    }
    ctx.stroke();
  }
}

function drawTimer(x, y, value, max) {
  ctx.fillStyle = "#111";
  ctx.fillRect(x, y, 190, 24);
  ctx.fillStyle = "#ff9c2b";
  ctx.fillRect(x, y, 190 * Math.max(0, value / max), 24);
  ctx.strokeStyle = "#fff4d6";
  ctx.strokeRect(x, y, 190, 24);
  ctx.fillStyle = "#fff";
  ctx.font = "12px monospace";
  ctx.fillText(`TIME ${Math.ceil(value)}`, x + 50, y + 17);
}

function drawTarget(box) {
  if (!box || levelDone) return;
  ctx.strokeStyle = "#ffd15c";
  ctx.lineWidth = 4;
  ctx.setLineDash([8, 8]);
  ctx.strokeRect(box.x, box.y, box.w, box.h);
  ctx.setLineDash([]);
}

function drawSun(x, y) {
  ctx.fillStyle = "#ffd15c";
  ctx.fillRect(x, y, 44, 44);
}

function drawCloud(x, y) {
  ctx.fillStyle = "#fff";
  ctx.fillRect(x, y, 50, 20);
  ctx.fillRect(x + 20, y - 14, 40, 34);
  ctx.fillRect(x + 50, y + 5, 40, 15);
}

function drawHeart(x, y) {
  ctx.fillStyle = "#ff6b9a";
  ctx.fillRect(x, y + 8, 12, 12);
  ctx.fillRect(x + 24, y + 8, 12, 12);
  ctx.fillRect(x + 12, y + 20, 24, 12);
  ctx.fillRect(x + 18, y + 32, 12, 12);
}

function tri(x1, y1, x2, y2, x3, y3) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x3, y3);
  ctx.closePath();
  ctx.fill();
}

/* ---------------- HELPERS ---------------- */

function winLevel(text) {
  levelDone = true;
  popupTitle.textContent = `LEVEL ${currentLevel} CLEARED`;
  popupText.textContent = text;
  popup.classList.remove("hidden");
}

function point(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) / rect.width) * canvas.width,
    y: ((e.clientY - rect.top) / rect.height) * canvas.height
  };
}

function inside(p, box) {
  return (
    p.x >= box.x &&
    p.x <= box.x + box.w &&
    p.y >= box.y &&
    p.y <= box.y + box.h
  );
}

function distance(x1, y1, x2, y2) {
  return Math.hypot(x1 - x2, y1 - y2);
}

updateMenu();
