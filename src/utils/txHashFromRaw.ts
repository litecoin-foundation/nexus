import Crypto from 'react-native-quick-crypto';

const doubleSHA256 = (data: Buffer) => {
  return Crypto.createHash('sha256')
    .update(Crypto.createHash('sha256').update(data).digest())
    .digest();
};

export const txHashFromRaw = (rawTxHex: string) => {
  // Convert hex string to a buffer (byte array)
  const rawTxBuffer = Buffer.from(rawTxHex, 'hex');
  const hash = doubleSHA256(rawTxBuffer);
  // reverse to LE
  return Buffer.from(hash).reverse().toString('hex');
};
