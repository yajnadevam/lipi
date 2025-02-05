export function hideSplashScreen() {
  setTimeout(function () {
    const splashScreen = document.querySelector(".splash");
    if (splashScreen) splashScreen.classList.add("hidden");
  }, 100);
}
