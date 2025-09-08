import Crypto from 'react-native-quick-crypto';

export const uuidFromSeed = (seed: string) => {
  const hash = Crypto.createHash('sha256').update(seed).digest('hex');

  // UUID version 4 consists of 32 hexadecimal digits in the form:
  // 8-4-4-4-12 (total 36 characters including hyphens)
  const uuid = [
    hash.substring(0, 8),
    hash.substring(8, 4),
    '4' + hash.substring(12, 3), // Set the version to 4
    '8' + hash.substring(15, 3), // Set the variant to 8 (RFC 4122)
    hash.substring(18, 12),
  ].join('-');

  return uuid;
};
