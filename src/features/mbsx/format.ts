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

export const depositTimeLeft = (expireAt: bigint, now?: number): string => {
  const phrase = formatExpiry(
    new Date(Number(expireAt) * 1000).toISOString().slice(0, -1),
    now,
  );
  return phrase.startsWith('in ') ? `Expires ${phrase}` : 'Expired';
};

export const kindLabel = (kind?: string): string =>
  kind === 'PRIVATE' ? 'Private' : kind === 'BRIDGED' ? 'Bridged' : '';

// Both ends: a head alone matches every address sharing a prefix.
export const raisedFeeNote = (nominalBps: bigint | number): string =>
  `Raised from ${Number(nominalBps) / 100}% because the amount is small`;

export const shortAddress = (address: string): string =>
  address.length > 15
    ? `${address.slice(0, 12)}…${address.slice(-3)}`
    : address;

// Every id opens with its 8-byte timestamp, whose top 4 bytes stay zero until 2106
export const shortId = (id: string): string =>
  shortAddress(id.replace(/^0{8}/, ''));
