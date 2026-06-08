// ========================================================
// PERSISTENT DYNAMIC PROJECT TITLE ENGINE
// ========================================================
const titleEl = document.getElementById("editable-title");

// 1. Check if the user previously saved a custom title name in local storage
const savedTitle = localStorage.getItem("pseudocode-ide-title");
if (savedTitle) {
  titleEl.textContent = savedTitle;
}

// 2. Save the custom text instantly to memory whenever the user types inside it
titleEl.addEventListener("input", function () {
  localStorage.setItem("pseudocode-ide-title", titleEl.textContent);
});

// 3. Prevent the Enter key from adding broken vertical line-breaks inside the text element
titleEl.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    e.preventDefault(); // Stop newline creation dead in its tracks
    titleEl.blur(); // Deselect the element cleanly to close the editing window
  }
});
