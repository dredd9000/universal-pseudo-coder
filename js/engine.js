// js/engine.js

require.config({
  paths: {
    vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs",
  },
});

require(["vs/editor/editor.main"], function () {
  monaco.languages.register({ id: "pseudocode" });

  monaco.languages.setMonarchTokensProvider("pseudocode", {
    keywords: [
      ...CONFIG.starters,
      ...CONFIG.closers,
      ...CONFIG.enders,
      ...CONFIG.commands,
    ],
    ignoreCase: true,
    tokenizer: {
      root: [
        [
          new RegExp(
            `\\b(?:${CONFIG.enders.map((e) => e.trim().replace(/\s+/g, "\\s+")).join("|")})\\b`,
            "i",
          ),
          "keyword",
        ],
        [
          /[a-zA-Z_]\w*/,
          { cases: { "@keywords": "keyword", "@default": "identifier" } },
        ],
        [/"([^"\\]|\\.)*"/, "string"],
        [/\b\d+\b/, "number"],
        [/\/\/.*$/, "comment"],
      ],
    },
  });

  monaco.languages.setLanguageConfiguration("pseudocode", {
    autoIndent: "none", // Keeps our custom engine in control
  });

  var editor = monaco.editor.create(document.getElementById("editor"), {
    value: [
      "function a()",
      "    if condition",
      '        print("hello")',
      "    end if",
      '    print("rest of code")',
      "end function",
    ].join("\n"),
    language: "pseudocode",
    theme: "vs-dark",
    automaticLayout: true,
    tabSize: CONFIG.tabSize,
    insertSpaces: true,
  });

  // --- RE-INDENT LOGIC ---

  editor.onKeyUp(function (e) {
    const model = editor.getModel();
    const position = editor.getPosition();
    const lineContent = model.getLineContent(position.lineNumber);
    const trimmed = lineContent.trim().toLowerCase();

    // Instant snap-back for enders
    if (CONFIG.enders.some((ender) => trimmed === ender)) {
      const currentIndent = lineContent.match(/^\s*/)[0].length;
      if (position.lineNumber > 1) {
        const prevLine = model.getLineContent(position.lineNumber - 1);
        const prevIndent = prevLine.match(/^\s*/)[0].length;
        const prevTrimmed = prevLine.trim().toLowerCase();

        const prevIsStarter =
          CONFIG.starters.some((s) => prevTrimmed.startsWith(s)) ||
          CONFIG.closers.some((c) => c !== "" && prevTrimmed.endsWith(c));

        // If the previous line didn't just start a block, we move back
        let targetIndent = prevIsStarter
          ? prevIndent
          : Math.max(0, prevIndent - CONFIG.tabSize);

        if (currentIndent !== targetIndent) {
          const spaces = " ".repeat(targetIndent);
          const newText = spaces + lineContent.trim();
          model.pushEditOperations(
            [],
            [
              {
                range: new monaco.Range(
                  position.lineNumber,
                  1,
                  position.lineNumber,
                  lineContent.length + 1,
                ),
                text: newText,
              },
            ],
            () => null,
          );
          editor.setPosition({
            lineNumber: position.lineNumber,
            column: newText.length + 1,
          });
        }
      }
    }
  });

  // Listen for Enter key to calculate correct next-line spacing perfectly
  editor.onKeyDown(function (e) {
    if (e.keyCode === monaco.KeyCode.Enter) {
      const model = editor.getModel();
      const position = editor.getPosition();
      const lineContent = model.getLineContent(position.lineNumber);
      const trimmed = lineContent.trim().toLowerCase();

      // Calculate current line's base indentation space count
      let currentLineIndent = lineContent.match(/^\s*/)[0].length;
      let nextIndent = currentLineIndent;

      // Check if this line opens a new block zone
      const isStarter =
        CONFIG.starters.some((s) => trimmed.startsWith(s)) ||
        CONFIG.closers.some((c) => c !== "" && trimmed.endsWith(c)) ||
        trimmed.endsWith(":");

      if (isStarter) {
        nextIndent += CONFIG.tabSize; // Push the NEXT line in (+4 spaces)
      }

      const spaces = "\n" + " ".repeat(nextIndent);

      e.preventDefault(); // Stop Monaco's default bad enter spacing
      e.stopPropagation();

      // Insert our clean calculated line break manually
      editor.executeEdits("smart-enter", [
        {
          range: new monaco.Range(
            position.lineNumber,
            position.column,
            position.lineNumber,
            position.column,
          ),
          text: spaces,
          forceMoveMarkers: true,
        },
      ]);
    }
  });
});
