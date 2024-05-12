export const groupTransactions = txs => {
  const groupedByDay = txs.reduce((acc, curr) => {
    const day = curr.day;
    acc[day] = acc[day] || [];
    acc[day].push(curr);
    return acc;
  }, {});

  // flatten
  return Object.entries(groupedByDay).flatMap(([day, data]) => [day, ...data]);
};
