import type {MbsxSwapFees} from './types';

const pad = (n: number) => String(n).padStart(2, '0');

export const formatTimestamp = (
  value: string,
  utc: boolean,
  seconds = false,
): string => {
  const at = new Date(`${value}Z`);
  if (Number.isNaN(at.getTime())) {
    return value;
  }
  const [year, month, day, hour, minute, second] = utc
    ? [
        at.getUTCFullYear(),
        at.getUTCMonth() + 1,
        at.getUTCDate(),
        at.getUTCHours(),
        at.getUTCMinutes(),
        at.getUTCSeconds(),
      ]
    : [
        at.getFullYear(),
        at.getMonth() + 1,
        at.getDate(),
        at.getHours(),
        at.getMinutes(),
        at.getSeconds(),
      ];
  const time = `${pad(hour)}:${pad(minute)}${seconds ? `:${pad(second)}` : ''}`;
  return `${year}-${pad(month)}-${pad(day)} ${time}${utc ? ' UTC' : ''}`;
};

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

export const addAmounts = (a: string, b: string): string => {
  const places = Math.max(
    a.split('.')[1]?.length ?? 0,
    b.split('.')[1]?.length ?? 0,
  );
  const scaled = (x: string) => {
    const [whole, fraction = ''] = x.split('.');
    return BigInt(whole + fraction.padEnd(places, '0'));
  };
  const sum = (scaled(a) + scaled(b)).toString().padStart(places + 1, '0');
  return places === 0 ? sum : `${sum.slice(0, -places)}.${sum.slice(-places)}`;
};

// decimal-pad types the locale's separator; null refuses the keystroke
export const feeTotalBps = ({fees, fees_bps}: MbsxSwapFees): number =>
  fees_bps !== undefined
    ? Number(fees_bps)
    : (fees ?? [])
        .filter(fee => fee.paid_by !== 'PROVIDER')
        .reduce((sum, fee) => sum + Number(fee.bps), 0);

export const typedAmount = (value: string): string | null => {
  const cleaned = value.replace(/,/g, '.').replace(/[^0-9.]/g, '');
  return cleaned.indexOf('.') === cleaned.lastIndexOf('.') ? cleaned : null;
};

export const shortAddress = (address: string): string =>
  address.length > 15
    ? `${address.slice(0, 12)}…${address.slice(-3)}`
    : address;

// Every id opens with its 8-byte timestamp, whose top 4 bytes stay zero until 2106
export const shortId = (id: string): string =>
  shortAddress(id.replace(/^0{8}/, ''));
