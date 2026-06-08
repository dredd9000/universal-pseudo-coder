// helpers.js

// Checks if a line matches a hybrid precisely or starts with a multi-word hybrid phrase
const checkIsHybrid = (val) => {
  return CONFIG.hybrids.some(
    (item) => val === item || val.startsWith(item + " "),
  );
};

// Checks if a line starts with a true block opener word cleanly using boundaries (\b)
const checkIsStarter = (val) => {
  return CONFIG.starters.some((s) => {
    const pattern = new RegExp(`^${s}(?:\\b|$)`, "i");
    return pattern.test(val);
  });
};

// Checks if a line completely matches a block terminator string smoothly
const checkIsEnder = (val) => {
  return CONFIG.enders.some((ender) => {
    const pattern = new RegExp(`^${ender.replace(/\s+/g, "\\s+")}$`, "i");
    return pattern.test(val);
  });
};
