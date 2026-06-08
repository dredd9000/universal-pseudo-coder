require.config({
  paths: {
    vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs",
  },
});
require(["vs/editor/editor.main"], function () {
  monaco.languages.register({ id: "pseudocode" });

  // Setup colors list smoothly
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
          /\bend\s+if\b|\bendif\b|\bend\s+while\b|\bendwhile\b|\bend\s+function\b|\bendfunction\b/i,
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

  // Turn OFF Monaco's buggy default indentation calculation engine completely
  monaco.languages.setLanguageConfiguration("pseudocode", {
    autoIndent: "none",
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

  // ==========================================
  // THE RE-INDENT ENGINE: MANUALLY CONTROL THE ACTIONS
  // ==========================================

  // Listen for any keyup event to handle instant "end if" snap-back
  editor.onKeyUp(function (e) {
    const model = editor.getModel();
    const position = editor.getPosition();
    const lineContent = model.getLineContent(position.lineNumber);
    const trimmed = lineContent.trim().toLowerCase();

    // Check if user just typed an ender keyword
    const matchesEnder = CONFIG.enders.some((ender) => trimmed === ender);

    if (matchesEnder) {
      // Calculate current white space count
      const currentIndent = lineContent.match(/^\s*/)[0].length;

      // Look at the line above to find its structural origin point
      if (position.lineNumber > 1) {
        const prevLine = model.getLineContent(position.lineNumber - 1);
        const prevIndent = prevLine.match(/^\s*/)[0].length;
        const prevTrimmed = prevLine.trim().toLowerCase();

        // Is the line above an opening block line?
        const prevIsStarter =
          CONFIG.starters.some((s) => prevTrimmed.startsWith(s)) ||
          CONFIG.closers.some((c) => c !== "" && prevTrimmed.endsWith(c));

        let targetIndent = prevIndent;
        if (!prevIsStarter) {
          // Scale down by 1 column block unit
          targetIndent = Math.max(0, prevIndent - CONFIG.tabSize);
        }

        // If it doesn't align right, overwrite the line spacing instantly
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

          // Reset cursor tracking position smoothly
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
      e.preventDefault(); // Stop default action
      e.stopPropagation();

      const model = editor.getModel();
      const position = editor.getPosition();
      const lineContent = model.getLineContent(position.lineNumber);
      const trimmed = lineContent.trim().toLowerCase();
      const currentIndent = lineContent.match(/^\s*/)[0].length;

      // Calculate next indent size
      let nextIndent = currentIndent;

      const isStarter =
        CONFIG.starters.some((s) => trimmed.startsWith(s)) ||
        CONFIG.closers.some((c) => c !== "" && trimmed.endsWith(c)) ||
        trimmed.endsWith(":");

      const isEnder = CONFIG.enders.some((ender) => trimmed === ender);

      if (isStarter) {
        nextIndent += CONFIG.tabSize; // Indent +4 spaces
      } else if (isEnder && trimmed !== "else") {
        // Do nothing extra, it already snapped back cleanly
      }

      const spaces = "\n" + " ".repeat(nextIndent);

      // Insert the custom smart line break manually
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
