export const groupTransactions = txs => {
  const groupedByDay = txs.reduce((acc, curr) => {
    const day = curr.day;
    acc[day] = acc[day] || {title: day, data: []};
    acc[day].data.push(curr);
    return acc;
  }, {});

  return Object.values(groupedByDay);
};
