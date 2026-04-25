const input = document.getElementById("input");
const triesEl = document.getElementById("tries");
const error = document.getElementById("error");
const clueBtn = document.getElementById("clue-btn");

const gameScreen = document.getElementById("game-screen");
const messageScreen = document.getElementById("message-screen");
const storyScreen = document.getElementById("story-screen");
const storyInner = document.getElementById("story-inner");

const video = document.getElementById("bg-video");

let stage = 1;
let tries = 3;
let infinite = false;

/* ---------- INPUT ---------- */
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") check();
});

/* ---------- CHECK ---------- */
function check() {
  const val = input.value.trim().toLowerCase();

  if (stage === 1) {
    if (val === "snoopy") return nextStage();
    wrong();
  }

  if (stage === 2) {
    if (val === "ship") return finishGames();
    wrong();
  }
}

/* ---------- WRONG ---------- */
function wrong() {
  if (!infinite) {
    tries--;
    updateTries();
  }

  error.textContent = "peep";

  if (tries <= 0 && !infinite) {
    infinite = true;
    popup("هدية بسيطة… فرصة إضافية لا نهائية 🎁");
  }
}

/* ---------- CLUE ---------- */
clueBtn.onclick = () => {
  if (!infinite) {
    tries--;
    updateTries();
  }

  if (stage === 1) {
    error.textContent =
      "Not everything is a matter of chance\nsometimes someone quietly brings two worlds closer…\nwhat‘s the nickname?";
  }

  if (stage === 2) {
    error.textContent =
      "Four letters. Familiar to both of you, just not for the same reason.";
  }

  clueBtn.textContent =
    "If you don’t know the answer… maybe you should ask her yourself";
};

/* ---------- UPDATE TRIES ---------- */
function updateTries() {
  triesEl.textContent = infinite ? "∞" : tries;
}

/* ---------- NEXT STAGE ---------- */
function nextStage() {
  stage = 2;
  tries = 3;
  infinite = false;
  updateTries();

  input.value = "";
  error.textContent = "_ _ _ _";
}

/* ---------- FINISH ---------- */
function finishGames() {
  gameScreen.classList.add("hidden");

  video.classList.remove("hidden");

  setTimeout(() => {
    messageScreen.classList.remove("hidden");
  }, 1000);
}

/* ---------- NEXT BUTTON ---------- */
document.getElementById("next-btn").onclick = () => {
  messageScreen.classList.add("hidden");
  storyScreen.classList.remove("hidden");
  playStory();
};

/* ---------- POPUP ---------- */
function popup(text) {
  alert(text);
}

/* ---------- STORY ---------- */
const story = [
  "Friday\nJan 2nd\n2:28 PM\n\nI sent the first text…",
  "And just like that, our ship quietly set sail—\nLittle did we know...",
  "We had our first Discord call...",
  "Our first meetup...",
  "∞ / 10",
];

async function playStory() {
  for (let line of story) {
    const p = document.createElement("p");
    p.className = "story-line";
    storyInner.appendChild(p);

    await type(p, line);
    await wait(2000);
  }
}

/* ---------- TYPE ---------- */
async function type(el, text) {
  for (let i = 0; i < text.length; i++) {
    el.textContent += text[i];
    await wait(30);
  }
}

/* ---------- WAIT ---------- */
function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}
