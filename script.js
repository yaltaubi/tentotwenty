const loginSection = document.getElementById("login-section");
const passwordInput = document.getElementById("password-input");
const errorMessage = document.getElementById("error-message");
const storyScreen = document.getElementById("story-screen");
const storyInner = document.getElementById("story-inner");

const correctPassword = "yoru";
let unlocked = false;

/* Your story with updated timing */
const storySequence = [
  {
    text: "حاولت أقيّمك… جلست ساعات وأيام أفكّر وأجرّب، أدور طريقة… لكن ما صار :(",
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
    text: "المهم… كل ثلاثة شهور، وأنتِ عسولتي أكثر من قبل.\nأحبك أحبك أحبك وأموت فيكي وأعشقك، وجودك أحلى شي فحياتي.\nتعالي كليوم…",
    waitAfter: 3000
  },
  {
    text: "اوه صح… شوفي تحت الكرسي، يمكن تلاقي شي حلو.",
    waitAfter: 0,
    final: true
  }
];

window.addEventListener("load", () => {
  passwordInput.focus();
});

passwordInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    checkPassword();
  }
});

function checkPassword() {
  if (unlocked) return;

  const enteredPassword = passwordInput.value.trim().toLowerCase();

  if (enteredPassword === correctPassword.toLowerCase()) {
    unlocked = true;
    clearError();
    document.body.classList.add("unlocked");
    passwordInput.blur();
    passwordInput.disabled = true;

    setTimeout(() => {
      loginSection.classList.add("hidden");
      storyScreen.classList.remove("hidden");
      playStorySequence();
    }, 850);
  } else {
    showError("peep");
    playPeepSound();
    triggerShake();
    passwordInput.select();
  }
}

function showError(text) {
  errorMessage.textContent = text;
  errorMessage.classList.add("show");
}

function clearError() {
  errorMessage.textContent = "";
  errorMessage.classList.remove("show");
}

function triggerShake() {
  passwordInput.classList.remove("shake");
  void passwordInput.offsetWidth;
  passwordInput.classList.add("shake");
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* Smooth story playback */
async function playStorySequence() {
  storyInner.innerHTML = "";

  for (const item of storySequence) {
    const line = document.createElement("p");
    line.className = "story-line";
    if (item.final) line.classList.add("final-line");

    storyInner.appendChild(line);

    await typeArabicText(line, item.text, 34);

    line.classList.add("done");

    await wait(item.waitAfter);
  }
}

/* Improved typewriter with natural pauses */
async function typeArabicText(element, text, speed = 34) {
  element.textContent = "";

  for (let i = 0; i < text.length; i++) {
    element.textContent += text[i];

    const char = text[i];
    let delay = speed;

    if (char === "…") delay = 260;
    if (char === "؟") delay = 220;
    if (char === "،") delay = 160;
    if (char === ".") delay = 180;
    if (char === "\n") delay = 300;

    await wait(delay);
  }
}

/* Small sound */
function playPeepSound() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  const ctx = new AudioContextClass();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(880, ctx.currentTime);

  gainNode.gain.setValueAtTime(0.0001, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.07, ctx.currentTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.16);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start();
  oscillator.stop(ctx.currentTime + 0.17);

  oscillator.onended = () => {
    ctx.close();
  };
}
