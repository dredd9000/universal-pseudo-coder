// js/engine.js

// Ensure your config.js and helpers are loaded/available before running this
require.config({
  paths: {
    vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs",
  },
});

require(["vs/editor/editor.main"], function () {
  monaco.languages.register({ id: "pseudocode" });

  // --- HELPER FUNCTIONS (INCLUDED DIRECTLY FOR SELF-CONTAINED EXECUTION) ---

  function checkIsHybrid(val) {
    return CONFIG.hybrids.some(
      (item) => val === item || val.startsWith(item + " "),
    );
  }

  function checkIsStarter(val) {
    return CONFIG.starters.some((s) => {
      const pattern = new RegExp(`^${s}(?:\\b|$)`, "i");
      return pattern.test(val);
    });
  }

  function checkIsEnder(val) {
    return CONFIG.enders.some((ender) => {
      const pattern = new RegExp(`^${ender.replace(/\s+/g, "\\s+")}$`, "i");
      return pattern.test(val);
    });
  }

  // --- MONACO SYNTAX HIGHLIGHTING (MONARCH) ---

  monaco.languages.setMonarchTokensProvider("pseudocode", {
    keywords: [
      ...CONFIG.starters,
      ...CONFIG.closers,
      ...CONFIG.enders,
      ...CONFIG.commands,
      ...CONFIG.hybrids,
    ],
    ignoreCase: true,
    tokenizer: {
      root: [
        [
          new RegExp(
            `\\b(?:${CONFIG.enders
              .concat(CONFIG.hybrids)
              .map((e) => e.trim().replace(/\s+/g, "\\s+"))
              .join("|")})\\b`,
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

  // --- EDITOR INITIALIZATION ---

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
  // PATH-SPLIT SCOPE ENGINE: ALIGNS KEYWORDS ON KEY-UP
  // ========================================================

  editor.onKeyUp(function (e) {
    const model = editor.getModel();
    const position = editor.getPosition();
    const lineContent = model.getLineContent(position.lineNumber);
    const trimmed = lineContent.trim().toLowerCase();

    const isHybrid = checkIsHybrid(trimmed);
    const isExplicitEnder = checkIsEnder(trimmed);

    if (!isHybrid && !isExplicitEnder) return;

    const currentIndent = lineContent.match(/^\s*/)[0].length;
    let targetIndent = -1;

    // --------------------------------------------------------
    // PATHWAY A: USER TYPED AN EXPLICIT ENDER (e.g., "end", "end if")
    // --------------------------------------------------------
    if (isExplicitEnder) {
      let openBlocksNeeded = 1;

      for (let i = position.lineNumber - 1; i >= 1; i--) {
        const checkTrimmed = model.getLineContent(i).trim().toLowerCase();
        if (checkTrimmed === "") continue;

        const checkIndent = model.getLineContent(i).match(/^\s*/)[0].length;

        if (checkIsEnder(checkTrimmed)) {
          openBlocksNeeded++;
        } else if (
          checkIsStarter(checkTrimmed) ||
          checkIsHybrid(checkTrimmed)
        ) {
          openBlocksNeeded--;
          if (openBlocksNeeded === 0) {
            targetIndent = checkIndent;
            break;
          }
        }
      }
    }
    // --------------------------------------------------------
    // PATHWAY B: USER TYPED A HYBRID INTERMEDIATE (e.g., "else", "elif")
    // --------------------------------------------------------
    else if (isHybrid) {
      let blockCounts = {};

      for (let i = position.lineNumber - 1; i >= 1; i--) {
        const checkTrimmed = model.getLineContent(i).trim().toLowerCase();
        if (checkTrimmed === "") continue;

        const checkIndent = model.getLineContent(i).match(/^\s*/)[0].length;

        if (checkIsEnder(checkTrimmed) || checkIsHybrid(checkTrimmed)) {
          blockCounts[checkIndent] = (blockCounts[checkIndent] || 0) + 1;
        }

        if (checkIsStarter(checkTrimmed)) {
          if (blockCounts[checkIndent] && blockCounts[checkIndent] > 0) {
            blockCounts[checkIndent]--;
          } else {
            targetIndent = checkIndent;
            break;
          }
        }
      }
    }

    // Apply indentation modification rules smoothly if layout mismatch detected
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
  });

  // ========================================================
  // INDENTATION ENGINE: ADDS SPACES ON ENTER KEY-DOWN
  // ========================================================

  editor.onKeyDown(function (e) {
    if (e.keyCode !== monaco.KeyCode.Enter) return;

    const model = editor.getModel();
    const position = editor.getPosition();
    const lineContent = model.getLineContent(position.lineNumber);
    const trimmed = lineContent.trim().toLowerCase();

    let currentLineIndent = lineContent.match(/^\s*/)[0].length;
    let nextIndent = currentLineIndent;

    // Line blocks forward if it has an opener statement or syntax closure punctuation
    const isBlockOpener =
      checkIsStarter(trimmed) ||
      checkIsHybrid(trimmed) ||
      CONFIG.closers.some((c) => c !== "" && trimmed.endsWith(c)) ||
      trimmed.endsWith(":");

    if (isBlockOpener) {
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
  });
});
