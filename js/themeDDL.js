// Listen for dropdown theme configuration switches
const themeSelector = document.getElementById("theme-selector");

themeSelector.addEventListener("change", function () {
  const selectedTheme = themeSelector.value;
  monaco.editor.setTheme(selectedTheme);

  // Save their favorite theme setting so it persists on page reload
  localStorage.setItem("pseudocode-ide-theme", selectedTheme);
});

// Load their cached theme automatically on page startup
document.addEventListener("load", () => {
  const savedTheme = localStorage.getItem("pseudocode-ide-theme");
  if (savedTheme) {
    themeSelector.value = savedTheme;
    monaco.editor.setTheme(savedTheme);
  }
});
