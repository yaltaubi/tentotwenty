const input = document.getElementById("answer-input");
const triesEl = document.getElementById("tries");
const questionEl = document.getElementById("question");
const patternEl = document.getElementById("pattern");
const messageEl = document.getElementById("message");
const clueBtn = document.getElementById("clue-btn");
const submitBtn = document.getElementById("submit-btn");

const gameScreen = document.getElementById("game-screen");
const splitScreen = document.getElementById("split-screen");
const storyScreen = document.getElementById("story-screen");
const storyInner = document.getElementById("story-inner");

const popup = document.getElementById("popup");
const popupBtn = document.getElementById("popup-btn");
const nextBtn = document.getElementById("next-btn");

let stage = 1;
let tries = 3;
let infinite = false;
let clueUsed = false;

const games = {
  1: {
    answer: "snoopy",
    question:
      "Not everything is a matter of chance\nsometimes someone quietly brings two worlds closer…\nwhat‘s the nickname?",
    pattern: "",
    clue:
      "If you don’t know the answer… maybe you should ask her yourself"
  },
  2: {
    answer: "ship",
    question:
      "Four letters. Familiar to both of you, just not for the same reason.",
    pattern: "_ _ _ _",
    clue:
      "To one of you, it lives between us as an edgy joke,\nto the other, it’s a phase we’ve lived."
  }
};

const finalStory = [
  {
    text: "Friday\nJan 2nd\n2:28 PM",
    waitAfter: 1000
  },
  {
    text: "I sent the first text…\n\nAnd just like that, our ship quietly set sail—\nLittle did we know that it’d rewrite the course of everything, unaware that it would become us.",
    waitAfter: 3000
  },
  {
    text: "Saturday\nJan 3rd\n3:06 AM",
    waitAfter: 1000
  },
  {
    text: "We had our first Discord call\nIt lasted two hours… though i didnt feel it at all\nWe started it singing “Took Her to the O”\nWe went on each other questions تعصر المخ\ndiving into thoughts, into feelings, into each other.\nand just like every moment I spend with you,\nit felt like we slipped beyond time and space\nbecause how could something so short feel so infinite?\nFrom that on…\nWe called again, and again, and again\nhours that felt like minutes,\nminutes I wished would never end\nI loved every second\njust like I always do with you, my love.",
    waitAfter: 3000
  },
  {
    text: "Friday\nJan 9th\n6:42 PM",
    waitAfter: 1000
  },
  {
    text: "حيل جنوبي - مقابل 3RD Street Donuts\nOur first meetup\nI printed a photo of you at 23:28,\nYou don’t like that one…\nbut I do\nI love it not just for what it holds,\nnot just for the memory stitched into it\nbut because it’s you\nAnd my baby…\nyou’ve always been perfect to me",
    waitAfter: 3000
  },
  {
    text: "I rate that week\n99999999999+/10\nno no no\n∞ / 10",
    waitAfter: 2000
  },
  {
    text: "كيف أقيّمك وأنتِ أصلاً فوق التقييم؟",
    waitAfter: 1000
  },
  {
    text: "يعني ألقاها من ايش؟ من ضحكتك الكتكوتة؟\nولا من ابتسامتك اللي ماخذه عقلي؟",
    waitAfter: 2000
  },
  {
    text: "يقولوا قصص الحب تبدأ بابتسامة…\nوأنا أقول ابتسامتك ما لها بداية ولا نهاية،\nتاخذني عالم ثاني…",
    waitAfter: 2000
  },
  {
    text: "المهم… كل ثلاثة شهور، وأنتِ عسولتي أكثر من قبل.",
    waitAfter: 1000
  },
  {
    text: "أحبك أحبك أحبك وأموت فيكي وأعشقك، وجودك أحلى شي فحياتي.",
    waitAfter: 0
  }
];

window.addEventListener("load", () => {
  loadGame();
  input.focus();
});

submitBtn.addEventListener("click", checkAnswer);

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") checkAnswer();
});

clueBtn.addEventListener("click", useClue);

popupBtn.addEventListener("click", () => {
  popup.classList.add("hidden");
  input.focus();
});

nextBtn.addEventListener("click", () => {
  splitScreen.classList.add("hidden");
  storyScreen.classList.remove("hidden");
  document.body.classList.add("story-mode");
  playFinalStory();
});

function loadGame() {
  const game = games[stage];

  tries = 3;
  infinite = false;
  clueUsed = false;

  questionEl.textContent = game.question;
  messageEl.textContent = "";
  input.value = "";

  clueBtn.textContent = "Take a clue";
  updateTries();

  if (game.pattern) {
    patternEl.textContent = game.pattern;
    patternEl.classList.remove("hidden");
  } else {
    patternEl.classList.add("hidden");
  }
}

function checkAnswer() {
  const value = normalize(input.value);
  const correct = normalize(games[stage].answer);

  if (value === correct) {
    playSuccessSound();

    if (stage === 1) {
      stage = 2;
      loadGame();
      messageEl.textContent = "passed. next one.";
      return;
    }

    finishGames();
    return;
  }

  wrongAnswer();
}

function wrongAnswer() {
  playPeepSound();
  triggerShake();

  if (!infinite) {
    tries--;
    updateTries();
  }

  messageEl.textContent = "peep";

  if (tries <= 0 && !infinite) {
    infinite = true;
    updateTries();
    showGiftPopup();
  }

  input.select();
}

function useClue() {
  if (!clueUsed && !infinite) {
    tries--;
    updateTries();
  }

  clueUsed = true;
  messageEl.textContent = games[stage].clue;
  clueBtn.textContent =
    stage === 1
      ? "maybe ask her yourself"
      : "clue used";

  if (tries <= 0 && !infinite) {
    infinite = true;
    updateTries();
    showGiftPopup();
  }

  input.focus();
}

function finishGames() {
  gameScreen.classList.add("hidden");
  document.body.classList.add("video-on");

  setTimeout(() => {
    splitScreen.classList.remove("hidden");
  }, 900);
}

function showGiftPopup() {
  popup.classList.remove("hidden");
}

function updateTries() {
  triesEl.textContent = infinite ? "∞ tries" : `${tries} tries`;
}

function normalize(text) {
  return text.trim().toLowerCase();
}

function triggerShake() {
  input.classList.remove("shake");
  void input.offsetWidth;
  input.classList.add("shake");
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function playFinalStory() {
  storyInner.innerHTML = "";

  for (const item of finalStory) {
    const line = document.createElement("p");
    line.className = "story-line";
    line.dir = containsArabic(item.text) ? "rtl" : "ltr";
    line.style.textAlign = containsArabic(item.text) ? "right" : "left";

    storyInner.appendChild(line);

    await typeText(line, item.text, 32);

    line.classList.add("done");

    await wait(item.waitAfter);
  }
}

async function typeText(element, text, speed = 32) {
  element.textContent = "";

  for (let i = 0; i < text.length; i++) {
    element.textContent += text[i];

    const char = text[i];
    let delay = speed;

    if (char === "…") delay = 260;
    if (char === "؟" || char === "?") delay = 220;
    if (char === "،" || char === ",") delay = 150;
    if (char === "." || char === "!" || char === "—") delay = 180;
    if (char === "\n") delay = 260;

    await wait(delay);
  }
}

function containsArabic(text) {
  return /[\u0600-\u06FF]/.test(text);
}

/* Sounds */
function playPeepSound() {
  playTone(880, 0.16, 0.07);
}

function playSuccessSound() {
  playTone(620, 0.09, 0.05);
  setTimeout(() => playTone(820, 0.12, 0.05), 90);
}

function playTone(freq, duration, volume) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  const ctx = new AudioContextClass();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(freq, ctx.currentTime);

  gainNode.gain.setValueAtTime(0.0001, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start();
  oscillator.stop(ctx.currentTime + duration + 0.02);

  oscillator.onended = () => ctx.close();
}
