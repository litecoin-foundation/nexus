const percentageDiff = (v1, v2) => {
  const difference = v1 - v2;
  const sign = Math.sign(difference);
  const relativeDifference = 100 * Math.abs(difference / ((v1 + v2) / 2));
  const roundedDifference = Math.round(relativeDifference * 10) / 10;

  return `${sign === 1 ? '+' : '-'}${roundedDifference}%`;
};

export default percentageDiff;
