const logo = document.getElementById("logo");
const loginSection = document.getElementById("login-section");
const passwordInput = document.getElementById("password-input");
const errorMessage = document.getElementById("error-message");

const correctPassword = "yoru";
let unlocked = false;

/* Sequence:
   1. Logo appears
   2. Logo moves to top
   3. Password input appears
*/
window.addEventListener("load", () => {
  setTimeout(() => {
    logo.classList.add("to-top");
  }, 1800);

  setTimeout(() => {
    loginSection.classList.remove("hidden");
    passwordInput.focus();
  }, 2750);
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

/* Small generated sound, no audio file needed */
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
