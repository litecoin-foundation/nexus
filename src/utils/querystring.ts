export const parseQueryString = (
  queryString: string,
): Record<string, string> => {
  return queryString.split('&').reduce<Record<string, string>>((acc, pair) => {
    const [key, value] = pair.split('=');
    acc[key] = value;
    return acc;
  }, {});
};
