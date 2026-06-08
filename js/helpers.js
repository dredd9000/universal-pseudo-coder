// healpers.js

const checkIsHybrid = (val) => {
  for (let item of blocksStartEnd) {
    if (item === val || val.startsWith(item + " ")) {
      return true;
    }
  }

  return false;
};

const checkIsStarter = (val) => {
  // !checkTrimmed.startsWith("else") &&
  //           !checkTrimmed.startsWith("elif");

  for (let item of blocksStartEnd) {
    if (val.startsWith(item)) {
      return false;
    }
  }
  return true;
};
