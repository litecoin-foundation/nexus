export const groupTransactions = (txs: any) => {
  // txs.sort((a: any, b: any) => b.timestamp - a.timestamp);

  const groupedByDay = txs.reduce((acc: any, curr: any, index: number) => {
    curr.index = index;
    const day = curr.day;
    acc[day] = acc[day] || {title: day, data: []};
    acc[day].data.push(curr);
    return acc;
  }, {});

  return Object.values(groupedByDay);
};

// Shared row order for the list spacers and Skia renderer.
export const flattenGroupedTransactions = (txs: any): any[] => {
  const flattened: any[] = [];
  for (const section of groupTransactions(txs) as Array<{
    title: string;
    data: any[];
  }>) {
    flattened.push({type: 'sectionHeader', title: section.title});
    flattened.push(...section.data);
  }
  return flattened;
};
