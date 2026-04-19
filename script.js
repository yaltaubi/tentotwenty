const enterBtn = document.getElementById("enter-btn");
const passwordInput = document.getElementById("password-input");
const errorMessage = document.getElementById("error-message");

const loginScreen = document.getElementById("login-screen");
const introScreen = document.getElementById("intro-screen");
const mainScreen = document.getElementById("main-screen");

const correctPassword = "yo";

enterBtn.addEventListener("click", checkPassword);

passwordInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    checkPassword();
  }
});

function checkPassword() {
  const enteredPassword = passwordInput.value.trim();

  if (enteredPassword === correctPassword) {
    errorMessage.textContent = "";
    playPeepSound();

    loginScreen.classList.remove("active");
    loginScreen.classList.add("hidden");

    introScreen.classList.remove("hidden");
    introScreen.classList.add("active");

    startSequence();
  } else {
    errorMessage.textContent = "peep";
    playPeepSound();
  }
}

function playPeepSound() {
  const audio = new Audio("peep.mp3");
  audio.play();
}

function startSequence() {
  const scenes = document.querySelectorAll(".scene");
  let currentScene = 0;

  scenes.forEach((scene, index) => {
    scene.style.opacity = index === 0 ? "1" : "0";
  });

  const interval = setInterval(() => {
    scenes[currentScene].style.opacity = "0";
    currentScene++;

    if (currentScene < scenes.length) {
      scenes[currentScene].style.opacity = "1";
    } else {
      clearInterval(interval);

      setTimeout(() => {
        introScreen.classList.remove("active");
        introScreen.classList.add("hidden");

        mainScreen.classList.remove("hidden");
        mainScreen.classList.add("active");
      }, 1000);
    }
  }, 2200);
}
