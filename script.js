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
  "Cherry"
];

const correctIngredients = ["Grape", "Passion", "Pomegranate", "Berry", "Orange"];

let selectedIngredients = [];
let currentLevel = 1;
let completedLevels = new Set();
let keys = {};
let levelComplete = false;
let animationFrameId = null;

let cars = [];
let level2Step = 0;
let level3Step = 0;
let level3Wave = 0;

const levels = {
  1: {
    title: "LEVEL 1: BEACH DRIVE",
    hint: "Click the glowing spots in order.",
    setting: "beach"
  },
  2: {
    title: "LEVEL 2: MOUNTAIN CHILL",
    hint: "Build the mountain scene by clicking the right moments.",
    setting: "mountain"
  },
  3: {
    title: "LEVEL 3: ALAM CRUISE",
    hint: "Time the cruise moments correctly.",
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

  const optionButtons = document.querySelectorAll(".option");

  optionButtons.forEach(btn => {
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
    const level = Number(btn.dataset.level);
    startLevel(level);
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

/* ---------- START LEVEL ---------- */

function startLevel(level) {
  currentLevel = level;
  levelComplete = false;

  const info = levels[level];
  gameTitle.textContent = info.title;
  gameHint.textContent = info.hint;

  levelScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");

  stopGameLoop();

  if (level === 1) setupLevel1();
  if (level === 2) setupLevel2();
  if (level === 3) setupLevel3();

  startGameLoop();
}

function stopGameLoop() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}

function startGameLoop() {
  function loop() {
    draw();
    animationFrameId = requestAnimationFrame(loop);
  }

  loop();
}

/* ---------- LEVEL 1: BEACH CLICK GAME ---------- */

let level1Step = 0;

const level1Steps = [
  {
    hint: "Click the Jimny.",
    x: 115,
    y: 350,
    w: 95,
    h: 55
  },
  {
    hint: "Click the RAV4.",
    x: 115,
    y: 425,
    w: 105,
    h: 55
  },
  {
    hint: "Click the beach flag.",
    x: 805,
    y: 170,
    w: 110,
    h: 90
  },
  {
    hint: "Click the picnic spot.",
    x: 720,
    y: 330,
    w: 160,
    h: 90
  }
];

function setupLevel1() {
  level1Step = 0;

  cars = [
    makeCar(110, 360, "#8e8e8e", "JIMNY", "girl"),
    makeCar(110, 435, "#f7f7f7", "RAV4", "boy")
  ];

  gameHint.textContent = level1Steps[level1Step].hint;
  canvas.onclick = handleLevel1Click;
}

function handleLevel1Click(e) {
  const point = getCanvasPoint(e);
  const target = level1Steps[level1Step];

  if (isInside(point, target)) {
    level1Step++;

    if (level1Step >= level1Steps.length) {
      showComplete();
      return;
    }

    gameHint.textContent = level1Steps[level1Step].hint;
  } else {
    gameHint.textContent = "close... but not that spot.";
    setTimeout(() => {
      if (!levelComplete) gameHint.textContent = level1Steps[level1Step].hint;
    }, 700);
  }
}

/* ---------- LEVEL 2: MOUNTAIN CLICK GAME ---------- */

const level2Steps = [
  {
    hint: "Find the mountain road.",
    x: 0,
    y: 390,
    w: 960,
    h: 110
  },
  {
    hint: "Click the electricity tower.",
    x: 750,
    y: 95,
    w: 150,
    h: 260
  },
  {
    hint: "Set the camping chairs.",
    x: 615,
    y: 315,
    w: 190,
    h: 80
  },
  {
    hint: "Bring the two of you to chill.",
    x: 620,
    y: 270,
    w: 180,
    h: 100
  }
];

function setupLevel2() {
  level2Step = 0;
  gameHint.textContent = level2Steps[level2Step].hint;
  canvas.onclick = handleLevel2Click;
}

function handleLevel2Click(e) {
  const point = getCanvasPoint(e);
  const target = level2Steps[level2Step];

  if (isInside(point, target)) {
    level2Step++;

    if (level2Step >= level2Steps.length) {
      showComplete();
      return;
    }

    gameHint.textContent = level2Steps[level2Step].hint;
  } else {
    gameHint.textContent = "not there yet...";
    setTimeout(() => {
      if (!levelComplete) gameHint.textContent = level2Steps[level2Step].hint;
    }, 700);
  }
}

/* ---------- LEVEL 3: CRUISE CLICK GAME ---------- */

const level3Steps = [
  {
    hint: "Start the little boat.",
    x: 80,
    y: 310,
    w: 140,
    h: 90
  },
  {
    hint: "Catch the calm wave.",
    x: 390,
    y: 320,
    w: 180,
    h: 70
  },
  {
    hint: "Reach the palace view.",
    x: 650,
    y: 170,
    w: 235,
    h: 120
  },
  {
    hint: "Take one quiet moment together.",
    x: 720,
    y: 300,
    w: 140,
    h: 100
  }
];

function setupLevel3() {
  level3Step = 0;
  level3Wave = 0;
  gameHint.textContent = level3Steps[level3Step].hint;
  canvas.onclick = handleLevel3Click;
}

function handleLevel3Click(e) {
  const point = getCanvasPoint(e);
  const target = level3Steps[level3Step];

  if (isInside(point, target)) {
    level3Step++;

    if (level3Step >= level3Steps.length) {
      showComplete();
      return;
    }

    gameHint.textContent = level3Steps[level3Step].hint;
  } else {
    gameHint.textContent = "the tide says nope.";
    setTimeout(() => {
      if (!levelComplete) gameHint.textContent = level3Steps[level3Step].hint;
    }, 700);
  }
}

/* ---------- DRAW ---------- */

function draw() {
  const setting = levels[currentLevel].setting;

  if (setting === "beach") drawBeach();
  if (setting === "mountain") drawMountain();
  if (setting === "cruise") drawCruise();
}

function drawBeach() {
  ctx.fillStyle = "#78d5e8";
  ctx.fillRect(0, 0, 960, 260);

  ctx.fillStyle = "#4ab6d6";
  ctx.fillRect(0, 160, 960, 90);

  ctx.fillStyle = "#f3d28a";
  ctx.fillRect(0, 260, 960, 280);

  drawPixelSun(820, 70);
  drawRoad(0, 365, 960, 95, "#c9b17e");
  drawFlag(830, 185, "BEACH");

  cars.forEach(drawVehicle);

  if (level1Step >= 1) {
    drawHeart(210, 345);
  }

  if (level1Step >= 2) {
    drawHeart(230, 420);
  }

  if (level1Step >= 3) {
    drawPicnic(745, 345);
  }

  drawTargetBox(level1Steps[Math.min(level1Step, level1Steps.length - 1)]);
}

function drawMountain() {
  ctx.fillStyle = "#d8b48a";
  ctx.fillRect(0, 0, 960, 540);

  ctx.fillStyle = "#3d3d3d";
  drawTriangle(0, 420, 210, 80, 420, 420);
  drawTriangle(220, 420, 470, 70, 720, 420);
  drawTriangle(520, 420, 760, 90, 960, 420);

  ctx.fillStyle = "#6f5c4a";
  ctx.fillRect(0, 420, 960, 120);

  if (level2Step >= 0) drawRoad(0, 400, 960, 80, "#8b7a67");
  if (level2Step >= 1) drawTower(790, 120);
  if (level2Step >= 2) drawCampingScene();
  if (level2Step >= 3) {
    drawVehicle(makeCar(620, 355, "#8e8e8e", "JIMNY", "girl"));
    drawVehicle(makeCar(710, 355, "#f7f7f7", "RAV4", "boy"));
  }

  drawTargetBox(level2Steps[Math.min(level2Step, level2Steps.length - 1)]);
}

function drawCruise() {
  level3Wave += 0.04;

  ctx.fillStyle = "#88d7e8";
  ctx.fillRect(0, 0, 960, 540);

  ctx.fillStyle = "#3bb5c8";
  ctx.fillRect(0, 260, 960, 280);

  ctx.fillStyle = "#373737";
  drawTriangle(0, 260, 110, 90, 260, 260);
  drawTriangle(650, 260, 780, 90, 960, 260);

  drawPalace(650, 185);
  drawWavePattern();

  if (level3Step >= 0) drawBoat({ x: 100, y: 340, driver: "girl" });
  if (level3Step >= 1) drawBoat({ x: 400, y: 345 + Math.sin(level3Wave) * 8, driver: "boy" });
  if (level3Step >= 2) drawBoat({ x: 720, y: 325, driver: "girl" });
  if (level3Step >= 3) drawHeart(790, 290);

  drawTargetBox(level3Steps[Math.min(level3Step, level3Steps.length - 1)]);
}

/* ---------- DRAW HELPERS ---------- */

function makeCar(x, y, color, label, driver) {
  return {
    x,
    y,
    w: 62,
    h: 34,
    color,
    label,
    driver
  };
}

function drawRoad(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);

  ctx.fillStyle = "rgba(255,255,255,0.6)";
  for (let i = 0; i < w; i += 80) {
    ctx.fillRect(i + 20, y + h / 2, 40, 5);
  }
}

function drawVehicle(car) {
  ctx.fillStyle = car.color;
  ctx.fillRect(car.x, car.y, car.w, car.h);

  ctx.fillStyle = "#111";
  ctx.fillRect(car.x + 10, car.y + 7, 14, 10);
  ctx.fillRect(car.x + 34, car.y + 7, 14, 10);

  ctx.fillStyle = "#111";
  ctx.fillRect(car.x + 8, car.y + 29, 12, 8);
  ctx.fillRect(car.x + 42, car.y + 29, 12, 8);

  ctx.fillStyle = car.driver === "girl" ? "#ff9ccf" : "#8cc7ff";
  ctx.fillRect(car.x + 26, car.y - 10, 12, 12);

  ctx.fillStyle = "#111";
  ctx.font = "8px monospace";
  ctx.fillText(car.label, car.x + 8, car.y + 25);
}

function drawBoat(car) {
  ctx.fillStyle = "#fff";
  ctx.fillRect(car.x, car.y, 90, 28);

  ctx.fillStyle = "#d9f7ff";
  ctx.fillRect(car.x + 22, car.y - 18, 46, 20);

  ctx.fillStyle = car.driver === "girl" ? "#ff9ccf" : "#8cc7ff";
  ctx.fillRect(car.x + 40, car.y - 32, 12, 12);

  ctx.fillStyle = "#0f6b8a";
  ctx.fillRect(car.x - 8, car.y + 26, 106, 5);
}

function drawPixelSun(x, y) {
  ctx.fillStyle = "#ffd15c";
  ctx.fillRect(x, y, 42, 42);
}

function drawFlag(x, y, text) {
  ctx.fillStyle = "#fff0c9";
  ctx.fillRect(x, y, 8, 70);

  ctx.fillStyle = "#7b1730";
  ctx.fillRect(x + 8, y, 70, 28);

  ctx.fillStyle = "#fff";
  ctx.font = "10px monospace";
  ctx.fillText(text, x + 13, y + 18);
}

function drawTower(x, y) {
  ctx.strokeStyle = "#222";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x, y + 210);
  ctx.lineTo(x + 45, y);
  ctx.lineTo(x + 90, y + 210);
  ctx.moveTo(x + 20, y + 90);
  ctx.lineTo(x + 70, y + 90);
  ctx.moveTo(x + 10, y + 150);
  ctx.lineTo(x + 80, y + 150);
  ctx.stroke();
}

function drawCampingScene() {
  ctx.fillStyle = "#fff0c9";
  ctx.fillRect(650, 330, 46, 10);
  ctx.fillRect(710, 330, 46, 10);

  ctx.fillStyle = "#ff9ccf";
  ctx.fillRect(660, 300, 16, 28);

  ctx.fillStyle = "#8cc7ff";
  ctx.fillRect(720, 300, 16, 28);

  ctx.fillStyle = "#ff9c2b";
  ctx.fillRect(688, 350, 30, 16);
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

function drawTriangle(x1, y1, x2, y2, x3, y3) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x3, y3);
  ctx.closePath();
  ctx.fill();
}

function drawTargetBox(target) {
  if (!target || levelComplete) return;

  ctx.strokeStyle = "#ffd38a";
  ctx.lineWidth = 4;
  ctx.setLineDash([8, 8]);
  ctx.strokeRect(target.x, target.y, target.w, target.h);
  ctx.setLineDash([]);
}

function drawPicnic(x, y) {
  ctx.fillStyle = "#7b1730";
  ctx.fillRect(x, y, 100, 50);

  ctx.fillStyle = "#fff0c9";
  ctx.fillRect(x + 12, y + 10, 18, 18);
  ctx.fillRect(x + 40, y + 12, 16, 16);
  ctx.fillRect(x + 68, y + 10, 18, 18);
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
      const waveY = y + Math.sin((x * 0.03) + level3Wave) * 8;
      if (x === 0) ctx.moveTo(x, waveY);
      else ctx.lineTo(x, waveY);
    }

    ctx.stroke();
  }
}

/* ---------- COMPLETE ---------- */

function showComplete() {
  levelComplete = true;

  completeTitle.textContent = `LEVEL ${currentLevel} CLEARED`;

  if (currentLevel === 1) {
    completeText.textContent = "Beach stop complete. The drive was easy, but cute.";
  } else if (currentLevel === 2) {
    completeText.textContent = "Mountain chill complete. Chairs are set, view secured.";
  } else {
    completeText.textContent = "Cruise complete. Alam Palace looks perfect from here.";
  }

  popup.classList.remove("hidden");
}

/* ---------- CLICK HELPERS ---------- */

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

/* ---------- OPTIONAL KEY / MOBILE SUPPORT ---------- */

window.addEventListener("keydown", e => {
  keys[e.key] = true;
});

window.addEventListener("keyup", e => {
  keys[e.key] = false;
});

document.querySelectorAll(".mobile-controls button").forEach(btn => {
  const key = btn.dataset.key;

  btn.addEventListener("touchstart", e => {
    e.preventDefault();
    keys[key] = true;
  });

  btn.addEventListener("touchend", e => {
    e.preventDefault();
    keys[key] = false;
  });

  btn.addEventListener("mousedown", () => keys[key] = true);
  btn.addEventListener("mouseup", () => keys[key] = false);
});

renderOptions();
