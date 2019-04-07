const toCaps = (value = '', separator = ' ', split = '-') => {
  return value
    .split(split)
    .map(v => v.charAt(0).toUpperCase() + v.substring(1))
    .reduce((a, b) => `${a}${separator}${b}`);
};

export default toCaps;
