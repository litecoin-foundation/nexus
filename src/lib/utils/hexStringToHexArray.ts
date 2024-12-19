export function hexStringToHexArray(hexString: string): number[] {
  if (hexString.length % 2 !== 0) {
    throw new Error('String length must be even');
  }

  const result = [];
  for (let i = 0; i < hexString.length; i += 2) {
    const hexPair = hexString.slice(i, i + 2);
    result.push(`0x${hexPair}`);
  }

  return result.map(hex => parseInt(hex, 16));
}
