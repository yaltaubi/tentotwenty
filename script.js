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
const particles = document.getElementById("particles");

const W = canvas.width;
const H = canvas.height;
const keys = new Set();
const completed = new Set();
const assets = {
  juiceLogo: loadAsset("logo_juice_palace.png"),
  mountainScene: loadAsset("scene_mountain.png"),
  cruiseScene: loadAsset("scene_cruise.png"),
  coastGuard: loadAsset("coast_guard.png")
};

let currentLevel = 1;
let frameId = null;
let lastTime = 0;
let globalTime = 0;
let levelDone = false;
let runToken = 0;
let beach = {};
let mountain = {};
let cruise = {};

const COLORS = {
  ink: "#080712",
  night: "#10152a",
  plum: "#30152e",
  rose: "#c63f5c",
  coral: "#ff7b54",
  teal: "#38c6b4",
  sky: "#7ed7e6",
  gold: "#f8cf68",
  cream: "#fff1d6",
  green: "#7cff9b",
  danger: "#ff5a6d"
};

const INGREDIENT_COLORS = {
  Grape: "#7a3fc7",
  Passion: "#ff8a34",
  Pomegranate: "#c63f5c",
  Berry: "#8b2d63",
  Orange: "#f89a2c",
  Mango: "#ffc247",
  Mint: "#3cb371",
  Lemon: "#f8df55",
  Peach: "#ffb08a",
  Vanilla: "#f5e3a3"
};

function loadAsset(src) {
  const record = { img: new Image(), ready: false, missing: false };
  record.img.onload = () => {
    record.ready = true;
  };
  record.img.onerror = () => {
    record.missing = true;
  };
  record.img.src = src;
  return record;
}

function spawnParticle() {
  const symbols = ["♥", "♡", "✦", "·"];
  const el = document.createElement("span");
  el.className = "particle";
  el.textContent = symbols[Math.floor(Math.random() * symbols.length)];
  el.style.left = `${Math.random() * 100}vw`;
  el.style.animationDuration = `${7 + Math.random() * 9}s`;
  el.style.fontSize = `${10 + Math.random() * 12}px`;
  el.style.color = [COLORS.gold, COLORS.rose, COLORS.teal, COLORS.cream][Math.floor(Math.random() * 4)];
  particles.appendChild(el);
  setTimeout(() => el.remove(), 17000);
}

setInterval(spawnParticle, 650);
for (let i = 0; i < 10; i += 1) setTimeout(spawnParticle, i * 140);

levelButtons.forEach((btn) => {
  btn.addEventListener("click", () => startLevel(Number(btn.dataset.level)));
});

backBtn.addEventListener("click", () => {
  stopLoop();
  popup.classList.add("hidden");
  gameScreen.classList.add("hidden");
  teaserScreen.classList.add("hidden");
  homeScreen.classList.remove("hidden");
  document.body.classList.remove("game-mode");
  updateMenu();
});

popupBtn.addEventListener("click", () => {
  popup.classList.add("hidden");
  completed.add(currentLevel);

  if (completed.size >= 3) {
    gameScreen.classList.add("hidden");
    homeScreen.classList.add("hidden");
    teaserScreen.classList.remove("hidden");
    document.body.classList.remove("game-mode");
    updateMenu();
    return;
  }

  gameScreen.classList.add("hidden");
  homeScreen.classList.remove("hidden");
  document.body.classList.remove("game-mode");
  updateMenu();
});

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  keys.add(key);
  if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) {
    event.preventDefault();
  }
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.key.toLowerCase());
});

canvas.addEventListener("pointerdown", (event) => {
  if (currentLevel === 3 && !levelDone) {
    cruise.target = point(event);
  }
});

canvas.addEventListener("pointermove", (event) => {
  if (currentLevel === 3 && !levelDone && event.buttons > 0) {
    cruise.target = point(event);
  }
});

function updateMenu() {
  levelButtons.forEach((btn) => {
    btn.classList.toggle("done", completed.has(Number(btn.dataset.level)));
  });
  menuMessage.textContent = completed.size
    ? `${completed.size}/3 spots cleared.`
    : "Pick a spot to start.";
}

function startLevel(level) {
  currentLevel = level;
  levelDone = false;
  globalTime = 0;
  runToken += 1;

  homeScreen.classList.add("hidden");
  teaserScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");
  document.body.classList.add("game-mode");
  canvas.onclick = null;

  if (level === 1) setupBeach();
  if (level === 2) setupMountain();
  if (level === 3) setupCruise();

  stopLoop();
  startLoop();
}

function setHint(text) {
  gameHint.textContent = text;
}

function setStatus(text) {
  statusEl.innerHTML = text.replace(/\n/g, "<br>");
}

function shakeCanvas() {
  canvas.classList.remove("shake");
  void canvas.offsetWidth;
  canvas.classList.add("shake");
  setTimeout(() => canvas.classList.remove("shake"), 380);
}

function failAndRestart(message, delay = 950) {
  if (levelDone) return;
  levelDone = true;
  shakeCanvas();
  setHint(message);
  const token = runToken;
  setTimeout(() => {
    if (token === runToken) startLevel(currentLevel);
  }, delay);
}

/* ---------------- LEVEL 1: JUICE + BEACH ---------------- */

function setupBeach() {
  gameTitle.textContent = "01 - Juice + Beach";
  beach = {
    phase: "preview",
    previewTimer: 3.6,
    timer: 34,
    lives: 3,
    selected: [],
    recipe: ["Pomegranate", "Grape", "Passion", "Orange", "Berry"],
    message: "Memorize the Juice Palace ratio before the recipe cards flip.",
    ingredients: [
      { name: "Grape", x: 96, y: 338 },
      { name: "Passion", x: 226, y: 338 },
      { name: "Pomegranate", x: 372, y: 338 },
      { name: "Berry", x: 526, y: 338 },
      { name: "Orange", x: 674, y: 338 },
      { name: "Mango", x: 818, y: 338 },
      { name: "Mint", x: 154, y: 448 },
      { name: "Lemon", x: 306, y: 448 },
      { name: "Peach", x: 458, y: 448 },
      { name: "Vanilla", x: 612, y: 448 }
    ],
    spots: [
      { x: 690, y: 300, w: 118, h: 80, good: true, taken: false, label: "quiet shade" },
      { x: 540, y: 382, w: 112, h: 72, good: false, taken: false, label: "too close" },
      { x: 815, y: 396, w: 102, h: 66, good: false, taken: false, label: "wet sand" },
      { x: 670, y: 430, w: 104, h: 64, good: false, taken: false, label: "busy path" }
    ],
    sparkles: []
  };
  setHint(beach.message);
  setStatus("MEMO 4");
  canvas.onclick = beachClick;
}

function beachClick(event) {
  if (levelDone) return;
  const p = point(event);

  if (beach.phase === "preview") {
    setHint("Hold that order in your head. The timer starts in a moment.");
    return;
  }

  if (beach.phase === "juice") {
    const item = beach.ingredients.find((ingredient) => distance(p.x, p.y, ingredient.x, ingredient.y) < 47);
    if (!item) return;

    const expected = beach.recipe[beach.selected.length];
    if (item.name === expected) {
      beach.selected.push(item.name);
      beach.sparkles.push({ x: item.x, y: item.y, age: 0, color: INGREDIENT_COLORS[item.name] });
      setHint(`${item.name} locked. Keep the ratio clean.`);
      if (beach.selected.length >= beach.recipe.length) {
        beach.phase = "spot";
        beach.timer = 23;
        beach.message = "Juice secured. Time the beach spot when the path is clear.";
        setHint(beach.message);
      }
    } else {
      beach.lives -= 1;
      beach.selected = [];
      setHint(`${item.name} ruins the ratio. Start the sequence again.`);
      shakeCanvas();
      if (beach.lives <= 0) failAndRestart("The blender gave up. Rebuilding the order...");
    }
    return;
  }

  if (beach.phase === "spot") {
    const spot = beach.spots.find((s) => inside(p, s));
    if (!spot) {
      setHint("That patch will not fit the blanket.");
      return;
    }

    if (!spot.good) {
      spot.taken = true;
      beach.lives -= 1;
      beach.timer = Math.max(0, beach.timer - 3);
      setHint(`${spot.label} is not the move. Find the quiet shade.`);
      shakeCanvas();
      if (beach.lives <= 0) failAndRestart("The beach filled up. Trying the day again...");
      return;
    }

    if (beachSpotBlocked()) {
      beach.lives -= 1;
      beach.timer = Math.max(0, beach.timer - 4);
      setHint("Almost. Wait for the walkway to clear before claiming it.");
      shakeCanvas();
      if (beach.lives <= 0) failAndRestart("Someone grabbed the best spot. Resetting...");
      return;
    }

    winLevel("Perfect juice, perfect shade, and the towel lands exactly where it should.");
  }
}

function updateBeach(dt) {
  beach.sparkles.forEach((sparkle) => {
    sparkle.age += dt;
  });
  beach.sparkles = beach.sparkles.filter((sparkle) => sparkle.age < 0.8);

  if (beach.phase === "preview") {
    beach.previewTimer -= dt;
    setStatus(`MEMO ${Math.max(0, Math.ceil(beach.previewTimer))}`);
    if (beach.previewTimer <= 0) {
      beach.phase = "juice";
      beach.timer = 34;
      setHint("Build the recipe from memory. A wrong pick resets the pour.");
    }
    return;
  }

  if (beach.phase === "juice") {
    beach.timer -= dt;
    setStatus(`MIX ${beach.selected.length}/${beach.recipe.length}\n${heartText(beach.lives)}`);
    if (beach.timer <= 0) failAndRestart("The ice melted before the ratio was ready. Restarting...");
    return;
  }

  if (beach.phase === "spot") {
    beach.timer -= dt;
    setStatus(`TIME ${Math.ceil(beach.timer)}\n${beachSpotBlocked() ? "WAIT" : "CLEAR"}`);
    if (beach.timer <= 0) failAndRestart("The quiet shade disappeared. Resetting...");
  }
}

function beachSpotBlocked() {
  const crowdX = 738 + Math.sin(globalTime * 1.55) * 112;
  const crowdY = 340 + Math.cos(globalTime * 2.1) * 8;
  return distance(crowdX, crowdY, 750, 340) < 58;
}

/* ---------------- LEVEL 2: MOUNTAIN PICNIC ---------------- */

function setupMountain() {
  gameTitle.textContent = "02 - Mountain Picnic";
  mountain = {
    phase: "picnic",
    timer: 38,
    mood: 100,
    step: 0,
    message: "Set the picnic in order, then win the mountain card game.",
    cardOpen: [],
    cardLock: false,
    movesLeft: 18,
    breezeTimer: 11,
    cards: makeMountainCards(),
    picnic: [
      { id: "blanket", label: "Blanket", x: 390, y: 338, w: 150, h: 70, done: false },
      { id: "fries", label: "Fries", x: 142, y: 366, w: 82, h: 56, done: false },
      { id: "steak", label: "Steak", x: 235, y: 365, w: 96, h: 58, done: false },
      { id: "camera", label: "Digicam", x: 610, y: 330, w: 110, h: 80, done: false },
      { id: "cards", label: "Cards", x: 748, y: 362, w: 104, h: 70, done: false }
    ],
    order: ["blanket", "fries", "steak", "camera", "cards"]
  };
  setHint(mountain.message);
  setStatus("PICNIC 0/5");
  canvas.onclick = mountainClick;
}

function makeMountainCards() {
  const labels = shuffle(["QH", "QH", "KS", "KS", "AD", "AD", "7C", "7C", "9S", "9S", "JP", "JP"]);
  return labels.map((label, index) => ({
    id: index,
    label,
    open: false,
    matched: false,
    x: 286 + (index % 4) * 98,
    y: 292 + Math.floor(index / 4) * 72,
    w: 66,
    h: 54
  }));
}

function mountainClick(event) {
  if (levelDone) return;
  const p = point(event);

  if (mountain.phase === "picnic") {
    const item = mountain.picnic.find((entry) => inside(p, entry));
    if (!item) return;

    const expectedId = mountain.order[mountain.step];
    if (item.id === expectedId) {
      item.done = true;
      mountain.step += 1;
      mountain.message = `${item.label} placed.`;
      setHint(mountain.message);
      if (mountain.step >= mountain.order.length) {
        mountain.phase = "cards";
        mountain.timer = 60;
        mountain.message = "Picnic ready. Match all card pairs before the breeze shuffles them.";
        setHint(mountain.message);
      }
    } else {
      mountain.mood = Math.max(0, mountain.mood - 18);
      mountain.timer = Math.max(0, mountain.timer - 3);
      setHint(`${item.label} is early. Keep the picnic ritual in order.`);
      shakeCanvas();
      if (mountain.mood <= 0) failAndRestart("The picnic lost its rhythm. Resetting the mountain...");
    }
    return;
  }

  if (mountain.phase === "cards") {
    const card = mountain.cards.find((entry) => inside(p, entry) && !entry.open && !entry.matched);
    if (card) openMountainCard(card);
  }
}

function openMountainCard(card) {
  if (mountain.cardLock || mountain.cardOpen.length >= 2) return;
  card.open = true;
  mountain.cardOpen.push(card);

  if (mountain.cardOpen.length < 2) {
    setHint("Pick the matching card.");
    return;
  }

  mountain.cardLock = true;
  const [a, b] = mountain.cardOpen;
  const token = runToken;

  if (a.label === b.label) {
    setHint("Pair matched. Keep the table under control.");
    setTimeout(() => {
      if (token !== runToken) return;
      a.matched = true;
      b.matched = true;
      mountain.cardOpen = [];
      mountain.cardLock = false;
      if (mountain.cards.every((entry) => entry.matched)) {
        winLevel("Picnic set, cards conquered, mountain hideout complete.");
      }
    }, 240);
    return;
  }

  mountain.movesLeft -= 1;
  setHint("Not a pair. The breeze is getting ideas.");
  shakeCanvas();
  setTimeout(() => {
    if (token !== runToken) return;
    a.open = false;
    b.open = false;
    mountain.cardOpen = [];
    mountain.cardLock = false;
    if (mountain.movesLeft <= 0) failAndRestart("Out of moves. The card table resets...");
  }, 620);
}

function updateMountain(dt) {
  if (mountain.phase === "picnic") {
    mountain.timer -= dt;
    setStatus(`PICNIC ${mountain.step}/5\nMOOD ${Math.ceil(mountain.mood)}`);
    if (mountain.timer <= 0) failAndRestart("The mountain sunset beat the picnic setup. Restarting...");
    return;
  }

  mountain.timer -= dt;
  mountain.breezeTimer -= dt;
  const pairs = mountain.cards.filter((entry) => entry.matched).length / 2;
  setStatus(`PAIRS ${pairs}/6\nMOVES ${mountain.movesLeft}`);

  if (mountain.breezeTimer <= 0) {
    shuffleClosedMountainCards();
    mountain.breezeTimer = 10 + Math.max(0, 6 - pairs) * 0.5;
    setHint("Mountain breeze shuffled the face-down cards.");
  }

  if (mountain.timer <= 0) failAndRestart("The card game ran into nightfall. Resetting...");
}

function shuffleClosedMountainCards() {
  const hidden = mountain.cards.filter((card) => !card.open && !card.matched);
  if (hidden.length < 4 || mountain.cardLock) return;

  const positions = shuffle(hidden.map((card) => ({ x: card.x, y: card.y })));
  hidden.forEach((card, index) => {
    card.x = positions[index].x;
    card.y = positions[index].y;
  });
}

/* ---------------- LEVEL 3: ALAM CRUISE ---------------- */

function setupCruise() {
  gameTitle.textContent = "03 - Alam Cruise";
  cruise = {
    timer: 82,
    lives: 3,
    alert: 0,
    boost: 100,
    target: null,
    message: "Guide the cute couple through the cruise and stay out of the coast guard light.",
    player: { x: 130, y: 410, r: 22 },
    guard: { x: 845, y: 320, dir: -1, speed: 76 },
    moments: [
      { x: 235, y: 305, collected: false },
      { x: 380, y: 456, collected: false },
      { x: 535, y: 330, collected: false },
      { x: 650, y: 470, collected: false },
      { x: 770, y: 385, collected: false },
      { x: 875, y: 285, collected: false }
    ],
    wake: []
  };
  setHint(cruise.message);
  setStatus("MOMENTS 0/6");
  canvas.onclick = null;
}

function updateCruise(dt) {
  cruise.timer -= dt;
  updateCruisePlayer(dt);
  updateCruiseGuard(dt);
  updateCruiseMoments(dt);
  updateCruiseAlert(dt);

  cruise.wake.forEach((wake) => {
    wake.age += dt;
  });
  cruise.wake = cruise.wake.filter((wake) => wake.age < 0.9);

  const collected = cruise.moments.filter((moment) => moment.collected).length;
  setStatus(`MOMENTS ${collected}/6\n${heartText(cruise.lives)}`);

  if (collected >= cruise.moments.length) {
    winLevel("The coast guard lost the trail. Alam cruise belongs to the two of you.");
  }

  if (cruise.timer <= 0) failAndRestart("The patrol boxed the cruise in. Trying the route again...");
}

function updateCruisePlayer(dt) {
  const player = cruise.player;
  let dx = 0;
  let dy = 0;

  if (keys.has("arrowleft") || keys.has("a")) dx -= 1;
  if (keys.has("arrowright") || keys.has("d")) dx += 1;
  if (keys.has("arrowup") || keys.has("w")) dy -= 1;
  if (keys.has("arrowdown") || keys.has("s")) dy += 1;

  if (dx === 0 && dy === 0 && cruise.target) {
    dx = cruise.target.x - player.x;
    dy = cruise.target.y - player.y;
    if (Math.hypot(dx, dy) < 8) {
      cruise.target = null;
      dx = 0;
      dy = 0;
    }
  }

  const moving = dx !== 0 || dy !== 0;
  const boostPressed = keys.has("shift") || keys.has(" ");
  const boosting = moving && boostPressed && cruise.boost > 2;
  const len = Math.hypot(dx, dy) || 1;
  const speed = boosting ? 205 : 132;

  if (moving) {
    player.x += (dx / len) * speed * dt;
    player.y += (dy / len) * speed * dt;
    cruise.wake.push({ x: player.x - 22, y: player.y + 18, age: 0 });
  }

  if (boosting) cruise.boost = Math.max(0, cruise.boost - 32 * dt);
  else cruise.boost = Math.min(100, cruise.boost + 18 * dt);

  player.x = clamp(player.x, 54, 906);
  player.y = clamp(player.y, 282, 500);
}

function updateCruiseGuard(dt) {
  const guard = cruise.guard;
  const collected = cruise.moments.filter((moment) => moment.collected).length;
  const chase = cruise.alert > 46;
  const speed = guard.speed + collected * 8 + (chase ? 34 : 0);

  if (chase) {
    guard.x += Math.sign(cruise.player.x - guard.x) * speed * 0.55 * dt;
    guard.y += Math.sign(cruise.player.y - guard.y) * speed * 0.38 * dt;
  } else {
    guard.x += guard.dir * speed * dt;
    guard.y += Math.sin(globalTime * 1.2) * 18 * dt;
    if (guard.x < 550) guard.dir = 1;
    if (guard.x > 888) guard.dir = -1;
  }

  guard.x = clamp(guard.x, 515, 900);
  guard.y = clamp(guard.y, 285, 470);
}

function updateCruiseMoments() {
  cruise.moments.forEach((moment) => {
    if (!moment.collected && distance(cruise.player.x, cruise.player.y, moment.x, moment.y) < 30) {
      moment.collected = true;
      cruise.alert = Math.max(0, cruise.alert - 14);
      cruise.boost = Math.min(100, cruise.boost + 18);
      setHint("Quiet moment collected. Keep moving.");
    }
  });
}

function updateCruiseAlert(dt) {
  const spotted = inSpotlight(cruise.player.x, cruise.player.y);
  const close = distance(cruise.player.x, cruise.player.y, cruise.guard.x, cruise.guard.y) < 68;

  if (spotted || close) {
    cruise.alert += (spotted ? 42 : 56) * dt;
    if (close) cruise.alert += 22 * dt;
    setHint(spotted ? "Spotlight on you. Break line of sight." : "The patrol boat is too close.");
  } else {
    cruise.alert -= 30 * dt;
  }

  cruise.alert = clamp(cruise.alert, 0, 100);

  if (cruise.alert >= 100) {
    cruise.lives -= 1;
    shakeCanvas();
    if (cruise.lives <= 0) {
      failAndRestart("Caught by the coast guard. Restarting the cruise...");
      return;
    }
    cruise.alert = 20;
    cruise.player.x = 130;
    cruise.player.y = 410;
    cruise.target = null;
    setHint("Close call. Back to the marina line.");
  }
}

function spotlightInfo() {
  const guard = cruise.guard;
  const patrolAngle = Math.PI + Math.sin(globalTime * 1.35) * 0.62;
  const playerAngle = Math.atan2(cruise.player.y - guard.y, cruise.player.x - guard.x);
  const follow = clamp(cruise.alert / 100, 0, 0.82);
  return {
    x: guard.x - 14,
    y: guard.y + 6,
    angle: lerpAngle(patrolAngle, playerAngle, follow),
    range: 255,
    width: 0.42
  };
}

function inSpotlight(x, y) {
  const spot = spotlightInfo();
  const dx = x - spot.x;
  const dy = y - spot.y;
  const range = Math.hypot(dx, dy);
  if (range > spot.range || range < 18) return false;
  const angle = Math.atan2(dy, dx);
  const diff = Math.abs(angleDiff(angle, spot.angle));
  return diff < spot.width;
}

/* ---------------- LOOP ---------------- */

function startLoop() {
  lastTime = performance.now();

  function loop(time) {
    const dt = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;
    globalTime += dt;
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
  if (currentLevel === 1) updateBeach(dt);
  if (currentLevel === 2) updateMountain(dt);
  if (currentLevel === 3) updateCruise(dt);
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  if (currentLevel === 1) drawBeach();
  if (currentLevel === 2) drawMountain();
  if (currentLevel === 3) drawCruise();
}

/* ---------------- DRAW: LEVEL 1 ---------------- */

function drawBeach() {
  drawBeachBackground();
  drawJuicePalace();

  if (beach.phase === "preview" || beach.phase === "juice") {
    drawIngredients();
    drawRecipeStrip();
  }

  if (beach.phase === "spot") {
    drawBeachSpots();
    drawBeachCrowd();
    drawCanvasBar(34, 28, 220, 16, beach.timer / 23, COLORS.gold, "BEST SPOT");
  }

  drawBeachSparkles();
  drawHeartsHud(818, 28, beach.lives);
}

function drawBeachBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, 260);
  sky.addColorStop(0, "#17345f");
  sky.addColorStop(0.48, "#db6d50");
  sky.addColorStop(1, "#f4b067");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, 260);

  drawSun(815, 86, 34);

  const sea = ctx.createLinearGradient(0, 218, 0, 388);
  sea.addColorStop(0, "#2398b6");
  sea.addColorStop(1, "#0e4f6f");
  ctx.fillStyle = sea;
  ctx.fillRect(0, 216, W, 176);

  for (let i = 0; i < 4; i += 1) {
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.24 - i * 0.035})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 8) {
      const y = 248 + i * 34 + Math.sin(x * 0.018 + globalTime * 1.2 + i) * 5;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  const sand = ctx.createLinearGradient(0, 382, 0, H);
  sand.addColorStop(0, "#e5bd72");
  sand.addColorStop(1, "#a87332");
  ctx.fillStyle = sand;
  ctx.fillRect(0, 382, W, 158);

  ctx.fillStyle = "rgba(255, 245, 190, 0.2)";
  for (let i = 0; i < 80; i += 1) {
    ctx.fillRect((i * 127) % W, 396 + ((i * 73) % 128), 2, 1);
  }

  drawPalm(55, 366, 1);
  drawPalm(902, 366, -1);
}

function drawJuicePalace() {
  ctx.fillStyle = "#124e5f";
  ctx.fillRect(55, 138, 380, 178);
  ctx.fillStyle = "#0d3441";
  ctx.fillRect(72, 166, 330, 132);
  ctx.fillStyle = COLORS.coral;
  ctx.fillRect(55, 126, 380, 22);
  ctx.fillStyle = COLORS.gold;
  for (let i = 0; i < 19; i += 1) {
    triangle(55 + i * 20, 126, 65 + i * 20, 148, 75 + i * 20, 126);
  }

  ctx.fillStyle = "rgba(255, 230, 160, 0.55)";
  [90, 178, 266, 354].forEach((x) => {
    ctx.fillRect(x, 166, 50, 48);
    ctx.fillStyle = "#0d3441";
    ctx.fillRect(x + 22, 166, 6, 48);
    ctx.fillRect(x, 188, 50, 6);
    ctx.fillStyle = "rgba(255, 230, 160, 0.55)";
  });

  ctx.fillStyle = "#7d1f3a";
  ctx.fillRect(100, 232, 270, 48);
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 2;
  ctx.strokeRect(100, 232, 270, 48);

  if (assets.juiceLogo.ready) {
    drawImageContain(assets.juiceLogo, 116, 236, 238, 40);
  } else {
    ctx.fillStyle = COLORS.gold;
    ctx.font = "bold 21px Georgia, serif";
    ctx.fillText("قصر العصائر", 150, 258);
    ctx.font = "11px Trebuchet MS, sans-serif";
    ctx.fillText("JUICE PALACE", 180, 274);
  }

  ctx.fillStyle = "#061c25";
  ctx.fillRect(196, 286, 58, 30);
  ctx.fillStyle = COLORS.gold;
  ctx.fillRect(246, 297, 5, 10);
}

function drawIngredients() {
  beach.ingredients.forEach((item) => {
    const index = beach.selected.indexOf(item.name);
    const selected = index >= 0;
    const expected = beach.phase === "juice" && beach.recipe[beach.selected.length] === item.name;
    ctx.fillStyle = selected ? "rgba(124, 255, 155, 0.18)" : "rgba(8, 7, 18, 0.58)";
    ctx.fillRect(item.x - 43, item.y - 38, 86, 76);
    ctx.strokeStyle = selected ? COLORS.green : expected ? COLORS.gold : "rgba(255, 241, 214, 0.3)";
    ctx.lineWidth = expected ? 3 : 2;
    ctx.strokeRect(item.x - 43, item.y - 38, 86, 76);

    ctx.fillStyle = INGREDIENT_COLORS[item.name];
    ctx.fillRect(item.x - 28, item.y - 25, 56, 34);
    ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
    ctx.fillRect(item.x - 28, item.y - 25, 56, 9);

    ctx.fillStyle = selected ? COLORS.green : COLORS.cream;
    ctx.font = "bold 10px Trebuchet MS, sans-serif";
    centerText(shortName(item.name), item.x, item.y + 28);

    if (selected) {
      ctx.fillStyle = COLORS.green;
      ctx.font = "bold 18px Trebuchet MS, sans-serif";
      centerText(String(index + 1), item.x + 29, item.y - 20);
    }
  });
}

function drawRecipeStrip() {
  const x = 492;
  const y = 150;
  const showRecipe = beach.phase === "preview";
  drawHudPanel(x, y, 382, 104, showRecipe ? "MEMORIZE THE RATIO" : "RECIPE MEMORY");

  beach.recipe.forEach((name, index) => {
    const bx = x + 24 + index * 68;
    ctx.fillStyle = index < beach.selected.length ? COLORS.green : "rgba(255, 241, 214, 0.12)";
    ctx.fillRect(bx, y + 42, 52, 38);
    ctx.strokeStyle = "rgba(255, 241, 214, 0.36)";
    ctx.strokeRect(bx, y + 42, 52, 38);
    ctx.fillStyle = showRecipe ? INGREDIENT_COLORS[name] : "rgba(255, 241, 214, 0.32)";
    ctx.fillRect(bx + 8, y + 49, 36, 18);
    ctx.fillStyle = COLORS.cream;
    ctx.font = "bold 10px Trebuchet MS, sans-serif";
    centerText(showRecipe ? shortName(name) : `${index + 1}`, bx + 26, y + 92);
  });
}

function drawBeachSpots() {
  beach.spots.forEach((spot) => {
    if (spot.taken) {
      ctx.fillStyle = "rgba(20, 20, 24, 0.48)";
      ctx.fillRect(spot.x, spot.y, spot.w, spot.h);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
      ctx.strokeRect(spot.x, spot.y, spot.w, spot.h);
      ctx.fillStyle = "rgba(255, 241, 214, 0.55)";
      ctx.font = "bold 11px Trebuchet MS, sans-serif";
      centerText("TAKEN", spot.x + spot.w / 2, spot.y + spot.h / 2 + 4);
      return;
    }

    const blocked = spot.good && beachSpotBlocked();
    ctx.fillStyle = spot.good
      ? blocked
        ? "rgba(255, 90, 109, 0.22)"
        : "rgba(248, 207, 104, 0.32)"
      : "rgba(255, 255, 255, 0.1)";
    ctx.fillRect(spot.x, spot.y, spot.w, spot.h);
    ctx.strokeStyle = spot.good ? (blocked ? COLORS.danger : COLORS.gold) : "rgba(255, 241, 214, 0.22)";
    ctx.lineWidth = spot.good ? 3 : 2;
    ctx.strokeRect(spot.x, spot.y, spot.w, spot.h);

    ctx.fillStyle = spot.good ? COLORS.coral : "rgba(255, 241, 214, 0.28)";
    ctx.fillRect(spot.x + 18, spot.y + 18, spot.w - 36, 12);
    ctx.fillStyle = spot.good ? COLORS.gold : "rgba(255, 241, 214, 0.58)";
    ctx.font = "bold 10px Trebuchet MS, sans-serif";
    centerText(spot.good ? (blocked ? "WAIT" : "CLAIM") : spot.label.toUpperCase(), spot.x + spot.w / 2, spot.y + spot.h - 16);
  });
}

function drawBeachCrowd() {
  const cx = 738 + Math.sin(globalTime * 1.55) * 112;
  const cy = 340 + Math.cos(globalTime * 2.1) * 8;
  for (let i = 0; i < 3; i += 1) {
    const x = cx + i * 20 - 20;
    ctx.fillStyle = i === 1 ? COLORS.teal : COLORS.rose;
    ctx.fillRect(x - 6, cy - 18, 12, 22);
    ctx.fillStyle = COLORS.cream;
    ctx.fillRect(x - 5, cy - 30, 10, 10);
  }
  ctx.strokeStyle = "rgba(255, 241, 214, 0.26)";
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(615, 342);
  ctx.lineTo(878, 342);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawBeachSparkles() {
  beach.sparkles.forEach((sparkle) => {
    const alpha = 1 - sparkle.age / 0.8;
    ctx.fillStyle = hexToRgba(sparkle.color, alpha);
    for (let i = 0; i < 6; i += 1) {
      const angle = (i / 6) * Math.PI * 2 + globalTime;
      const r = sparkle.age * 52;
      ctx.fillRect(sparkle.x + Math.cos(angle) * r, sparkle.y + Math.sin(angle) * r, 4, 4);
    }
  });
}

/* ---------------- DRAW: LEVEL 2 ---------------- */

function drawMountain() {
  if (assets.mountainScene.ready) {
    drawImageCover(assets.mountainScene, 0, 0, W, H);
    ctx.fillStyle = "rgba(8, 7, 18, 0.28)";
    ctx.fillRect(0, 0, W, H);
  } else {
    drawMountainFallback();
  }

  drawMountainPicnicBase();

  if (mountain.phase === "picnic") {
    drawPicnicItems();
    drawPicnicOrderHud();
  } else {
    drawCardTable();
  }

  drawMountainHud();
}

function drawMountainFallback() {
  const sky = ctx.createLinearGradient(0, 0, 0, 340);
  sky.addColorStop(0, "#132942");
  sky.addColorStop(0.62, "#9a6d69");
  sky.addColorStop(1, "#d4a46b");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#31405a";
  triangle(0, 430, 220, 110, 430, 430);
  ctx.fillStyle = "#23334d";
  triangle(250, 430, 520, 70, 790, 430);
  ctx.fillStyle = "#405169";
  triangle(590, 430, 775, 120, 960, 430);

  ctx.fillStyle = "#2f5b49";
  ctx.fillRect(0, 408, W, 132);
  ctx.fillStyle = "rgba(255, 220, 160, 0.14)";
  ctx.fillRect(0, 430, W, 42);
}

function drawMountainPicnicBase() {
  ctx.fillStyle = "rgba(8, 7, 18, 0.34)";
  ctx.fillRect(0, 430, W, 110);

  ctx.fillStyle = "#803a44";
  ctx.fillRect(270, 286, 430, 200);
  ctx.fillStyle = "#f2d178";
  for (let x = 270; x < 700; x += 44) ctx.fillRect(x, 286, 8, 200);
  for (let y = 286; y < 486; y += 44) ctx.fillRect(270, y, 430, 8);
  ctx.strokeStyle = "rgba(255, 241, 214, 0.5)";
  ctx.lineWidth = 3;
  ctx.strokeRect(270, 286, 430, 200);
}

function drawPicnicItems() {
  const expected = mountain.order[mountain.step];
  mountain.picnic.forEach((item) => {
    const active = item.id === expected;
    const done = item.done;
    ctx.fillStyle = done ? "rgba(124, 255, 155, 0.2)" : active ? "rgba(248, 207, 104, 0.22)" : "rgba(8, 7, 18, 0.48)";
    ctx.fillRect(item.x, item.y, item.w, item.h);
    ctx.strokeStyle = done ? COLORS.green : active ? COLORS.gold : "rgba(255, 241, 214, 0.28)";
    ctx.lineWidth = active ? 3 : 2;
    ctx.strokeRect(item.x, item.y, item.w, item.h);

    if (item.id === "blanket") drawMiniBlanket(item.x + 20, item.y + 18);
    if (item.id === "fries") drawFries(item.x + 30, item.y + 16);
    if (item.id === "steak") drawSteak(item.x + 24, item.y + 18);
    if (item.id === "camera") drawMiniCamera(item.x + 28, item.y + 20);
    if (item.id === "cards") drawMiniCards(item.x + 27, item.y + 18);

    ctx.fillStyle = done ? COLORS.green : COLORS.cream;
    ctx.font = "bold 11px Trebuchet MS, sans-serif";
    centerText(done ? "DONE" : item.label.toUpperCase(), item.x + item.w / 2, item.y + item.h - 10);
  });
}

function drawPicnicOrderHud() {
  drawHudPanel(36, 28, 246, 174, "PICNIC ORDER");
  mountain.order.forEach((id, index) => {
    const item = mountain.picnic.find((entry) => entry.id === id);
    const y = 70 + index * 24;
    ctx.fillStyle = index < mountain.step ? COLORS.green : index === mountain.step ? COLORS.gold : "rgba(255, 241, 214, 0.42)";
    ctx.font = "bold 13px Trebuchet MS, sans-serif";
    ctx.fillText(`${index + 1}. ${item.label}`, 58, y);
  });
}

function drawCardTable() {
  drawHudPanel(36, 28, 232, 120, "CARD TABLE");
  const pairs = mountain.cards.filter((entry) => entry.matched).length / 2;
  drawCanvasBar(56, 82, 176, 14, pairs / 6, COLORS.teal, "PAIRS");
  drawCanvasBar(56, 116, 176, 14, mountain.breezeTimer / 13, COLORS.gold, "BREEZE");

  mountain.cards.forEach((card) => {
    const faceUp = card.open || card.matched;
    ctx.fillStyle = card.matched ? "rgba(124, 255, 155, 0.9)" : faceUp ? COLORS.cream : COLORS.plum;
    ctx.fillRect(card.x, card.y, card.w, card.h);
    ctx.strokeStyle = card.matched ? COLORS.green : faceUp ? COLORS.gold : "rgba(255, 241, 214, 0.55)";
    ctx.lineWidth = 2;
    ctx.strokeRect(card.x, card.y, card.w, card.h);
    ctx.fillStyle = faceUp ? COLORS.plum : COLORS.gold;
    ctx.font = "bold 18px Trebuchet MS, sans-serif";
    centerText(faceUp ? card.label : "?", card.x + card.w / 2, card.y + 34);
  });
}

function drawMountainHud() {
  drawHudPanel(732, 28, 190, 102, "MOUNTAIN");
  if (mountain.phase === "picnic") {
    drawCanvasBar(752, 82, 132, 14, mountain.timer / 38, COLORS.gold, "TIME");
    drawCanvasBar(752, 112, 132, 14, mountain.mood / 100, COLORS.rose, "MOOD");
  } else {
    drawCanvasBar(752, 82, 132, 14, mountain.timer / 60, COLORS.gold, "TIME");
    drawCanvasBar(752, 112, 132, 14, mountain.movesLeft / 18, COLORS.rose, "MOVES");
  }
}

/* ---------------- DRAW: LEVEL 3 ---------------- */

function drawCruise() {
  if (assets.cruiseScene.ready) {
    drawImageCover(assets.cruiseScene, 0, 0, W, H);
    ctx.fillStyle = "rgba(3, 10, 28, 0.32)";
    ctx.fillRect(0, 0, W, H);
  } else {
    drawCruiseFallback();
  }

  drawCruiseWaterOverlay();
  drawCruiseMoments();
  drawSpotlight();
  drawCruiseWake();
  drawCoupleBoat();
  drawCoastGuardBoat();
  drawCruiseHud();
}

function drawCruiseFallback() {
  const sky = ctx.createLinearGradient(0, 0, 0, 260);
  sky.addColorStop(0, "#03051d");
  sky.addColorStop(0.6, "#12285a");
  sky.addColorStop(1, "#2f6d8d");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, 270);

  drawMoon(805, 62);
  ctx.fillStyle = "#11172f";
  triangle(0, 270, 130, 90, 290, 270);
  triangle(645, 270, 790, 92, 960, 270);
  drawPalace(645, 156);

  const sea = ctx.createLinearGradient(0, 260, 0, H);
  sea.addColorStop(0, "#0d5a78");
  sea.addColorStop(1, "#071a31");
  ctx.fillStyle = sea;
  ctx.fillRect(0, 260, W, 280);
}

function drawCruiseWaterOverlay() {
  ctx.fillStyle = "rgba(3, 12, 32, 0.2)";
  ctx.fillRect(0, 260, W, 280);
  for (let i = 0; i < 7; i += 1) {
    ctx.strokeStyle = `rgba(126, 215, 230, ${0.18 - i * 0.015})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 8) {
      const y = 290 + i * 36 + Math.sin(x * 0.024 + globalTime * 1.8 + i) * 7;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

function drawCruiseMoments() {
  cruise.moments.forEach((moment, index) => {
    if (moment.collected) return;
    const pulse = 1 + Math.sin(globalTime * 3 + index) * 0.15;
    ctx.save();
    ctx.translate(moment.x, moment.y);
    ctx.scale(pulse, pulse);
    drawPixelHeart(-14, -12, COLORS.rose);
    ctx.restore();
    ctx.strokeStyle = "rgba(248, 207, 104, 0.45)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(moment.x, moment.y, 24 + Math.sin(globalTime * 2 + index) * 3, 0, Math.PI * 2);
    ctx.stroke();
  });
}

function drawSpotlight() {
  const spot = spotlightInfo();
  ctx.save();
  ctx.translate(spot.x, spot.y);
  ctx.rotate(spot.angle);
  const beam = ctx.createLinearGradient(0, 0, spot.range, 0);
  beam.addColorStop(0, "rgba(255, 240, 150, 0.32)");
  beam.addColorStop(0.7, "rgba(255, 240, 150, 0.12)");
  beam.addColorStop(1, "rgba(255, 240, 150, 0)");
  ctx.fillStyle = beam;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(spot.range, Math.tan(spot.width) * spot.range);
  ctx.lineTo(spot.range, -Math.tan(spot.width) * spot.range);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawCruiseWake() {
  cruise.wake.forEach((wake) => {
    const alpha = 1 - wake.age / 0.9;
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.4})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(wake.x, wake.y, 10 + wake.age * 22, 0.2, Math.PI - 0.2);
    ctx.stroke();
  });
}

function drawCoupleBoat() {
  const p = cruise.player;
  ctx.fillStyle = "#f6f1e8";
  ctx.fillRect(p.x - 36, p.y - 10, 72, 28);
  ctx.fillStyle = COLORS.teal;
  ctx.fillRect(p.x - 42, p.y + 14, 84, 8);
  ctx.fillStyle = COLORS.coral;
  ctx.fillRect(p.x - 18, p.y - 28, 16, 24);
  ctx.fillStyle = COLORS.sky;
  ctx.fillRect(p.x + 5, p.y - 28, 16, 24);
  ctx.fillStyle = COLORS.cream;
  ctx.fillRect(p.x - 17, p.y - 39, 14, 14);
  ctx.fillRect(p.x + 6, p.y - 39, 14, 14);
  drawPixelHeart(p.x - 5, p.y - 52, COLORS.rose, 0.65);
}

function drawCoastGuardBoat() {
  const g = cruise.guard;
  if (assets.coastGuard.ready) {
    drawImageContain(assets.coastGuard, g.x - 42, g.y - 42, 84, 84);
  } else {
    ctx.fillStyle = "#eff6fb";
    ctx.fillRect(g.x - 42, g.y - 10, 84, 30);
    ctx.fillStyle = "#0f3654";
    ctx.fillRect(g.x - 28, g.y - 34, 50, 28);
    ctx.fillStyle = COLORS.danger;
    ctx.fillRect(g.x - 48, g.y + 18, 96, 7);
    ctx.fillStyle = "#0f3654";
    ctx.font = "bold 11px Trebuchet MS, sans-serif";
    centerText("COAST", g.x, g.y + 8);
  }
}

function drawCruiseHud() {
  drawHudPanel(28, 26, 242, 132, "STEALTH ROUTE");
  const collected = cruise.moments.filter((moment) => moment.collected).length;
  drawCanvasBar(52, 78, 174, 14, collected / cruise.moments.length, COLORS.teal, "MOMENTS");
  drawCanvasBar(52, 110, 174, 14, cruise.alert / 100, cruise.alert > 65 ? COLORS.danger : COLORS.gold, "ALERT");
  drawCanvasBar(52, 142, 174, 14, cruise.boost / 100, COLORS.coral, "BOOST");
  drawHeartsHud(804, 28, cruise.lives);
  ctx.fillStyle = "rgba(8, 7, 18, 0.62)";
  ctx.fillRect(804, 70, 122, 30);
  ctx.strokeStyle = "rgba(255, 241, 214, 0.28)";
  ctx.strokeRect(804, 70, 122, 30);
  ctx.fillStyle = COLORS.gold;
  ctx.font = "bold 13px Trebuchet MS, sans-serif";
  centerText(`TIME ${Math.ceil(cruise.timer)}`, 865, 90);
}

/* ---------------- SMALL DRAWING HELPERS ---------------- */

function drawHudPanel(x, y, w, h, title) {
  ctx.fillStyle = "rgba(8, 7, 18, 0.72)";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "rgba(248, 207, 104, 0.38)";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = COLORS.gold;
  ctx.font = "bold 12px Trebuchet MS, sans-serif";
  ctx.fillText(title, x + 16, y + 28);
}

function drawCanvasBar(x, y, w, h, amount, color, label) {
  const value = clamp(amount, 0, 1);
  ctx.fillStyle = "rgba(0, 0, 0, 0.46)";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w * value, h);
  ctx.strokeStyle = "rgba(255, 241, 214, 0.36)";
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = COLORS.cream;
  ctx.font = "bold 10px Trebuchet MS, sans-serif";
  ctx.fillText(label, x + w + 10, y + h - 2);
}

function drawHeartsHud(x, y, lives) {
  ctx.fillStyle = "rgba(8, 7, 18, 0.66)";
  ctx.fillRect(x, y, 110, 34);
  ctx.strokeStyle = "rgba(255, 241, 214, 0.28)";
  ctx.strokeRect(x, y, 110, 34);
  for (let i = 0; i < 3; i += 1) {
    drawPixelHeart(x + 14 + i * 32, y + 8, i < lives ? COLORS.rose : "rgba(255, 241, 214, 0.22)", 0.7);
  }
}

function drawImageCover(asset, x, y, w, h) {
  if (!asset.ready) return;
  const img = asset.img;
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const sw = w / scale;
  const sh = h / scale;
  const sx = (img.naturalWidth - sw) / 2;
  const sy = (img.naturalHeight - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function drawImageContain(asset, x, y, w, h) {
  if (!asset.ready) return;
  const img = asset.img;
  const scale = Math.min(w / img.naturalWidth, h / img.naturalHeight);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

function drawSun(x, y, r) {
  const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 2);
  glow.addColorStop(0, "rgba(255, 240, 170, 0.95)");
  glow.addColorStop(0.45, "rgba(248, 207, 104, 0.75)");
  glow.addColorStop(1, "rgba(255, 123, 84, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, r * 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.gold;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawMoon(x, y) {
  ctx.fillStyle = "rgba(255, 241, 214, 0.15)";
  ctx.beginPath();
  ctx.arc(x, y, 58, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.cream;
  ctx.beginPath();
  ctx.arc(x, y, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#8dc7d8";
  ctx.beginPath();
  ctx.arc(x + 12, y - 3, 28, 0, Math.PI * 2);
  ctx.fill();
}

function drawPalm(x, y, dir) {
  ctx.strokeStyle = "#7a4a26";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.bezierCurveTo(x + dir * 18, y - 58, x + dir * 12, y - 106, x + dir * 30, y - 148);
  ctx.stroke();
  const topX = x + dir * 30;
  const topY = y - 148;
  ctx.strokeStyle = "#2f8d55";
  ctx.lineWidth = 5;
  [[-34, -18], [18, -26], [40, -8], [-18, 12], [20, 14]].forEach(([dx, dy], index) => {
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(topX + dir * dx * 0.55, topY + dy * 0.35, topX + dir * dx + Math.sin(globalTime + index) * 4, topY + dy);
    ctx.stroke();
  });
}

function drawMiniBlanket(x, y) {
  ctx.fillStyle = "#803a44";
  ctx.fillRect(x, y, 56, 28);
  ctx.fillStyle = COLORS.gold;
  ctx.fillRect(x + 16, y, 6, 28);
  ctx.fillRect(x + 36, y, 6, 28);
}

function drawFries(x, y) {
  ctx.fillStyle = COLORS.rose;
  ctx.fillRect(x, y + 18, 28, 28);
  ctx.fillStyle = COLORS.gold;
  for (let i = 0; i < 5; i += 1) ctx.fillRect(x + 3 + i * 5, y + (i % 2) * 4, 4, 24);
}

function drawSteak(x, y) {
  ctx.fillStyle = "#6d2c35";
  ctx.beginPath();
  ctx.ellipse(x + 28, y + 18, 31, 18, -0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.coral;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x + 34, y + 18, 12, 0.5, 2.7);
  ctx.stroke();
}

function drawMiniCamera(x, y) {
  ctx.fillStyle = "#1b1f2a";
  ctx.fillRect(x, y, 54, 34);
  ctx.fillStyle = "#343a4c";
  ctx.fillRect(x + 7, y - 7, 18, 8);
  ctx.fillStyle = COLORS.sky;
  ctx.fillRect(x + 24, y + 8, 18, 18);
}

function drawMiniCards(x, y) {
  ctx.fillStyle = COLORS.cream;
  ctx.fillRect(x, y + 7, 24, 32);
  ctx.fillRect(x + 18, y, 24, 32);
  ctx.strokeStyle = COLORS.plum;
  ctx.strokeRect(x, y + 7, 24, 32);
  ctx.strokeRect(x + 18, y, 24, 32);
}

function drawPalace(x, y) {
  ctx.fillStyle = "#e6d5b6";
  ctx.fillRect(x, y + 20, 240, 88);
  ctx.fillStyle = "#c9ad76";
  ctx.fillRect(x + 96, y, 48, 26);
  ctx.fillRect(x + 14, y + 2, 38, 106);
  ctx.fillRect(x + 188, y + 2, 38, 106);
  ctx.fillStyle = "rgba(255, 220, 128, 0.72)";
  for (let i = 0; i < 5; i += 1) ctx.fillRect(x + 28 + i * 40, y + 44, 20, 38);
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
    [8, 12], [12, 12], [16, 12], [20, 12], [24, 12], [28, 12],
    [12, 16], [16, 16], [20, 16], [24, 16],
    [16, 20], [20, 20]
  ].forEach(([hx, hy]) => ctx.fillRect(hx, hy, 4, 4));
  ctx.restore();
}

/* ---------------- GENERIC HELPERS ---------------- */

function point(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * W,
    y: ((event.clientY - rect.top) / rect.height) * H
  };
}

function inside(p, box) {
  return p.x >= box.x && p.x <= box.x + box.w && p.y >= box.y && p.y <= box.y + box.h;
}

function distance(x1, y1, x2, y2) {
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

function centerText(text, x, y) {
  ctx.textAlign = "center";
  ctx.fillText(text, x, y);
  ctx.textAlign = "left";
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

function shortName(name) {
  if (name === "Pomegranate") return "Pome";
  if (name === "Passion") return "Pass";
  return name.slice(0, 6);
}

function heartText(lives) {
  return Array.from({ length: 3 }, (_, index) => (index < lives ? "♥" : "♡")).join(" ");
}

function angleDiff(a, b) {
  return Math.atan2(Math.sin(a - b), Math.cos(a - b));
}

function lerpAngle(a, b, t) {
  return a + angleDiff(b, a) * t;
}

function hexToRgba(hex, alpha) {
  const value = hex.replace("#", "");
  const bigint = parseInt(value, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function winLevel(text) {
  if (levelDone) return;
  levelDone = true;
  stopLoop();
  popupTitle.textContent = `Level ${currentLevel} Cleared`;
  popupText.textContent = text;
  popup.classList.remove("hidden");
}

updateMenu();
