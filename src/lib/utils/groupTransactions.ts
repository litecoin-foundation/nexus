export const groupTransactions = (txs: any) => {
  txs.sort((a: any, b: any) => b.timestamp - a.timestamp);

  const groupedByDay = txs.reduce((acc, curr, index) => {
    curr.index = index;
    const day = curr.day;
    acc[day] = acc[day] || {title: day, data: []};
    acc[day].data.push(curr);
    return acc;
  }, {});

  return Object.values(groupedByDay);
};
