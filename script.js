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

const correctIngredients = ["Grape", "Passion", "Pomegranate", "Berry"];
let selectedIngredients = [];

let unlockedLevel = 1;
let currentLevel = 1;
let gameRunning = false;
let keys = {};
let levelComplete = false;

let cars = [];

const levels = {
  1: {
    title: "LEVEL 1: BEACH DRIVE",
    hint: "Drive both cars to the beach flag",
    setting: "beach"
  },
  2: {
    title: "LEVEL 2: MOUNTAIN CHILL",
    hint: "Reach the tower, then set the chairs",
    setting: "mountain"
  },
  3: {
    title: "LEVEL 3: ALAM CRUISE",
    hint: "Sail both boats to the palace view",
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

  if (sortedSelected === sortedCorrect) {
    quizMessage.textContent = "perfect mix.";
    setTimeout(() => {
      quizScreen.classList.add("hidden");
      levelScreen.classList.remove("hidden");
      document.body.classList.add("game-mode");
      updateLevelButtons();
    }, 700);
  } else {
    quizMessage.textContent = "not quite... try the real نسبة وتناسب mix.";
  }
});

/* ---------- LEVEL SELECT ---------- */

levelButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const level = Number(btn.dataset.level);

    if (level > unlockedLevel) {
      levelMessage.textContent = "locked for now.";
      return;
    }

    startLevel(level);
  });
});

backBtn.addEventListener("click", () => {
  gameRunning = false;
  gameScreen.classList.add("hidden");
  levelScreen.classList.remove("hidden");
  updateLevelButtons();
});

continueBtn.addEventListener("click", () => {
  popup.classList.add("hidden");

  if (currentLevel < 3) {
    unlockedLevel = Math.max(unlockedLevel, currentLevel + 1);
    gameScreen.classList.add("hidden");
    levelScreen.classList.remove("hidden");
    updateLevelButtons();
  } else {
    gameScreen.classList.add("hidden");
    teaserScreen.classList.remove("hidden");
  }
});

function updateLevelButtons() {
  levelButtons.forEach(btn => {
    const level = Number(btn.dataset.level);
    btn.classList.toggle("locked", level > unlockedLevel);
  });
}

/* ---------- GAME ---------- */

function startLevel(level) {
  currentLevel = level;
  levelComplete = false;
  gameRunning = true;

  const info = levels[level];
  gameTitle.textContent = info.title;
  gameHint.textContent = info.hint;

  levelScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");

  setupCars(level);
  requestAnimationFrame(gameLoop);
}

function setupCars(level) {
  if (level === 1) {
    cars = [
      makeCar(90, 350, "#8e8e8e", "JIMNY", "girl"),
      makeCar(90, 420, "#f7f7f7", "RAV4", "boy")
    ];
  }

  if (level === 2) {
    cars = [
      makeCar(70, 390, "#8e8e8e", "JIMNY", "girl"),
      makeCar(70, 450, "#f7f7f7", "RAV4", "boy")
    ];
  }

  if (level === 3) {
    cars = [
      makeCar(80, 300, "#f7f7f7", "BOAT", "girl"),
      makeCar(80, 370, "#e8e8e8", "BOAT", "boy")
    ];
  }
}

function makeCar(x, y, color, label, driver) {
  return {
    x,
    y,
    w: 62,
    h: 34,
    color,
    label,
    driver,
    done: false
  };
}

function gameLoop() {
  if (!gameRunning) return;

  update();
  draw();

  if (!levelComplete && cars.every(c => c.done)) {
    levelComplete = true;
    gameRunning = false;

    setTimeout(() => {
      showComplete();
    }, 500);
  }

  requestAnimationFrame(gameLoop);
}

function update() {
  const speed = 2.2;

  cars.forEach((car, i) => {
    if (car.done) return;

    const isFirst = i === 0;

    if (isFirst) {
      if (keys["ArrowLeft"] || keys["a"]) car.x -= speed;
      if (keys["ArrowRight"] || keys["d"]) car.x += speed;
      if (keys["ArrowUp"] || keys["w"]) car.y -= speed;
      if (keys["ArrowDown"] || keys["s"]) car.y += speed;
    } else {
      car.x += (cars[0].x - 70 - car.x) * 0.025;
      car.y += (cars[0].y + 54 - car.y) * 0.025;
    }

    car.x = Math.max(20, Math.min(canvas.width - car.w - 20, car.x));
    car.y = Math.max(80, Math.min(canvas.height - car.h - 20, car.y));

    if (hitGoal(car)) {
      car.done = true;
    }
  });
}

function hitGoal(car) {
  if (currentLevel === 1) return car.x > 790 && car.y < 230;
  if (currentLevel === 2) return car.x > 760 && car.y < 190;
  if (currentLevel === 3) return car.x > 770 && car.y > 120 && car.y < 280;
}

/* ---------- DRAW ---------- */

function draw() {
  const setting = levels[currentLevel].setting;

  if (setting === "beach") drawBeach();
  if (setting === "mountain") drawMountain();
  if (setting === "cruise") drawCruise();

  cars.forEach(drawVehicle);

  if (currentLevel === 2 && cars.every(c => c.done)) {
    drawCampingScene();
  }
}

function drawBeach() {
  ctx.fillStyle = "#78d5e8";
  ctx.fillRect(0, 0, 960, 260);

  ctx.fillStyle = "#f3d28a";
  ctx.fillRect(0, 260, 960, 280);

  ctx.fillStyle = "#4ab6d6";
  ctx.fillRect(0, 160, 960, 90);

  drawPixelSun(820, 70);
  drawFlag(830, 185, "FINISH");
  drawRoad(0, 365, 960, 95, "#c9b17e");
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

  drawRoad(0, 400, 960, 80, "#8b7a67");
  drawTower(790, 120);
  drawFlag(810, 155, "TOWER");
}

function drawCruise() {
  ctx.fillStyle = "#88d7e8";
  ctx.fillRect(0, 0, 960, 540);

  ctx.fillStyle = "#3bb5c8";
  ctx.fillRect(0, 260, 960, 280);

  ctx.fillStyle = "#373737";
  drawTriangle(0, 260, 110, 90, 260, 260);
  drawTriangle(650, 260, 780, 90, 960, 260);

  drawPalace(650, 185);
  drawFlag(800, 250, "PALACE");
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
  if (currentLevel === 3) {
    drawBoat(car);
    return;
  }

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
  ctx.fillRect(car.x, car.y, 80, 28);

  ctx.fillStyle = "#d9f7ff";
  ctx.fillRect(car.x + 18, car.y - 16, 42, 18);

  ctx.fillStyle = car.driver === "girl" ? "#ff9ccf" : "#8cc7ff";
  ctx.fillRect(car.x + 36, car.y - 28, 12, 12);

  ctx.fillStyle = "#0f6b8a";
  ctx.fillRect(car.x - 8, car.y + 26, 96, 5);
}

function drawPixelSun(x, y) {
  ctx.fillStyle = "#ffd15c";
  ctx.fillRect(x, y, 42, 42);
}

function drawFlag(x, y, text) {
  ctx.fillStyle = "#fff0c9";
  ctx.fillRect(x, y, 8, 70);

  ctx.fillStyle = "#7b1730";
  ctx.fillRect(x + 8, y, 62, 28);

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

function showComplete() {
  completeTitle.textContent = `LEVEL ${currentLevel} CLEARED`;

  if (currentLevel === 1) {
    completeText.textContent = "Beach drive complete. The mountain is waiting.";
  } else if (currentLevel === 2) {
    completeText.textContent = "They made it up the mountain and chilled by the tower.";
  } else {
    completeText.textContent = "Cruise complete. Alam Palace looks perfect from here.";
  }

  popup.classList.remove("hidden");
}

/* ---------- INPUT ---------- */

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
