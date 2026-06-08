// engine.js

require.config({
  paths: {
    vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs",
  },
});

require(["vs/editor/editor.main"], function () {
  monaco.languages.register({ id: "pseudocode" });

  // Dynamic Monarch Tokenizer for Syntax Highlighting
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
        [/[{}()\[\]]/, "delimiter"],
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

  // Keep manual control over the indentation layout rules
  monaco.languages.setLanguageConfiguration("pseudocode", {
    autoIndent: "none",
    brackets: [
      ["{", "}"],
      ["[", "]"],
      ["(", ")"],
    ],
    surroundingPairs: [
      { open: "{", close: "}" },
      { open: "[", close: "]" },
      { open: "(", close: ")" },
      { open: '"', close: '"' },
    ],
  });

  var editor = monaco.editor.create(document.getElementById("editor"), {
    value: [
      "if condition1",
      "    if condition2",
      '        print("inner")',
      "    else",
      '        print("still inner")',
      "    end if",
      "else",
      '    print("outer")',
      "end if",
    ].join("\n"),
    language: "pseudocode",
    theme: "vs-dark",
    automaticLayout: true,
    tabSize: CONFIG.tabSize,
    insertSpaces: true,
  });

  // ========================================================
  // UNIFIED SCOPE ENGINE: HANDLES BOTH KEYWORDS & PYTHON-STYLE
  // ========================================================

  editor.onKeyUp(function (e) {
    const model = editor.getModel();
    const position = editor.getPosition();
    const lineContent = model.getLineContent(position.lineNumber);
    const trimmed = lineContent.trim().toLowerCase();

    const isHybrid = checkIsHybrid(trimmed);
    const isExplicitEnder =
      CONFIG.enders.some((ender) => {
        const pattern = new RegExp(`^${ender.replace(/\s+/g, "\\s+")}$`, "i");
        return pattern.test(trimmed);
      }) && !isHybrid;

    if (isHybrid || isExplicitEnder) {
      const currentIndent = lineContent.match(/^\s*/)[0].length;
      let targetIndent = -1;

      // Track structures that are already "claimed" by blockers at specific indentations
      let blockedIndents = new Set();

      // Scan upwards to map the code tree grid
      // Scan upwards to map the code tree grid
      for (let i = position.lineNumber - 1; i >= 1; i--) {
        const checkLine = model.getLineContent(i);
        const checkTrimmed = checkLine.trim().toLowerCase();

        if (checkTrimmed === "") continue;

        const checkIndent = checkLine.match(/^\s*/)[0].length;

        // Determine exactly what type of line we are looking at dynamically
        const isCheckHybrid = checkIsHybrid(checkTrimmed);

        // A true starter cannot be a hybrid element
        const isStarter =
          CONFIG.starters.some((s) => checkTrimmed.startsWith(s)) &&
          !isCheckHybrid;

        // A true ender cannot be a hybrid element
        const isEnder =
          CONFIG.enders.some((ender) => {
            const pattern = new RegExp(
              `^${ender.replace(/\s+/g, "\\s+")}$`,
              "i",
            );
            return pattern.test(checkTrimmed);
          }) && !isCheckHybrid;

        // 1. If we see an existing explicit closer or middle hybrid block,
        // that exact indentation layer is blocked from taking new connections.
        if (isEnder || isCheckHybrid) {
          blockedIndents.add(checkIndent);
        }

        // 2. If we find an opening block statement ('if', 'while', etc.)
        if (isStarter) {
          if (blockedIndents.has(checkIndent)) {
            blockedIndents.delete(checkIndent);
          } else {
            targetIndent = checkIndent;
            break;
          }
        }
      }

      // If we found a valid parent tier, match its grid layout
      if (targetIndent !== -1 && currentIndent !== targetIndent) {
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
  });

  // Listen for Enter key to push indentation calculations seamlessly
  editor.onKeyDown(function (e) {
    if (e.keyCode === monaco.KeyCode.Enter) {
      const model = editor.getModel();
      const position = editor.getPosition();
      const lineContent = model.getLineContent(position.lineNumber);
      const trimmed = lineContent.trim().toLowerCase();

      let currentLineIndent = lineContent.match(/^\s*/)[0].length;
      let nextIndent = currentLineIndent;

      const isStarter =
        CONFIG.starters.some((s) => trimmed.startsWith(s)) ||
        CONFIG.closers.some((c) => c !== "" && trimmed.endsWith(c)) ||
        trimmed.endsWith(":");

      if (isStarter) {
        nextIndent += CONFIG.tabSize;
      }

      const spaces = "\n" + " ".repeat(nextIndent);

      e.preventDefault();
      e.stopPropagation();

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
