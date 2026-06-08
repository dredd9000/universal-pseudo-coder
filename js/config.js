// config.js

const blocksStartEnd = ["else", "else if", "elif"];

const CONFIG = {
  tabSize: 4,
  starters: ["if", "while", "function", "func", "fun", ...blocksStartEnd],
  closers: ["then", "do", ":"],
  enders: [
    "endif",
    "end if",
    "endwhile",
    "end while",
    "endfunction",
    "endfunc",
    "endfun",
    "end function",
    "end",
    ...blocksStartEnd,
  ],
  commands: ["return", "break", "continue"],
};
