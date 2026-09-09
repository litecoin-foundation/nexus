export const formatTimestamp = (value: string): string =>
  value.replace('T', ' ').replace(/:\d\d$/, '');

const UNITS: [number, string][] = [
  [86400, 'day'],
  [3600, 'hour'],
  [60, 'minute'],
];

// The module writes a naive utc timestamp, which is what the Z appends to.
export const formatExpiry = (
  value: string,
  now: number = Date.now(),
): string => {
  const ms = Date.parse(`${value}Z`) - now;
  if (Number.isNaN(ms)) {
    return value;
  }
  const seconds = Math.abs(ms) / 1000;
  for (const [size, unit] of UNITS) {
    if (seconds >= size) {
      const count = Math.floor(seconds / size);
      const phrase = `${count} ${unit}${count === 1 ? '' : 's'}`;
      return ms >= 0 ? `in ${phrase}` : `${phrase} ago`;
    }
  }
  return ms >= 0 ? 'in under a minute' : 'just now';
};

// Both ends: a head alone matches every address sharing a prefix.
export const shortAddress = (address: string): string =>
  address.length > 15
    ? `${address.slice(0, 12)}…${address.slice(-3)}`
    : address;
