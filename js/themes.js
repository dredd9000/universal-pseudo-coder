const loadThemes = () => {
  draculaTheme();
  oneDarkPro();
  myLightTheme();
};

const draculaTheme = () => {
  // Example B: VS Code "Dracula" Color Palette
  monaco.editor.defineTheme("dracula", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "keyword", foreground: "FF79C6", fontStyle: "bold" }, // Pink
      { token: "identifier", foreground: "F8F8F2" }, // White
      { token: "string", foreground: "F1FA8C" }, // Yellow
      { token: "number", foreground: "BD93F9" }, // Purple
      { token: "comment", foreground: "6272A4", fontStyle: "italic" }, // Comment Blue
      { token: "delimiter", foreground: "8BE9FD" }, // Cyan
    ],
    colors: {
      "editor.background": "#282A36",
      "editor.foreground": "#F8F8F2",
      "editorCursor.foreground": "#F8F8F0",
      "editor.lineHighlightBackground": "#44475A",
    },
  });
};

const oneDarkPro = () => {
  // Example A: VS Code "One Dark Pro" Color Palette
  monaco.editor.defineTheme("one-dark-pro", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "keyword", foreground: "C678DD", fontStyle: "bold" }, // Purple
      { token: "identifier", foreground: "61AFEF" }, // Soft Blue
      { token: "string", foreground: "98C379" }, // Green
      { token: "number", foreground: "D19A66" }, // Dark Orange
      { token: "comment", foreground: "5C6370", fontStyle: "italic" }, // Slate Gray
      { token: "delimiter", foreground: "ABB2BF" }, // Light Gray
    ],
    colors: {
      "editor.background": "#282C34",
      "editor.foreground": "#ABB2BF",
      "editorCursor.foreground": "#528BFF",
      "editor.lineHighlightBackground": "#2C313C",
    },
  });
};

const myLightTheme = () => {
  monaco.editor.defineTheme("my-light-theme", {
    base: "vs", // Use the light base
    inherit: true,
    rules: [
      { token: "keyword", foreground: "FF007F" }, // Hot Pink keywords
      { token: "string", foreground: "008000" }, // Green strings
      { token: "comment", foreground: "808080" }, // Gray comments
    ],
    colors: {
      "editor.background": "#FFFFFF",
      "editor.foreground": "#000000",
    },
  });
};
