import {BIP32Interface} from 'bip32';

export interface Bip84AccountKeys {
  accountXprv: string;
  accountXpub: string;
  derivationPath: string;
}

/**
 * Converts a BIP32 Root Key to BIP84 Account Extended Private and Public Keys
 *
 * @param bip32RootKey - BIP32 root key object
 * @param account - Account index (default: 0)
 * @returns Object containing accountXprv, accountXpub, and derivationPath
 */
export const bip32RootToBip84Account = (
  bip32RootKey: BIP32Interface,
  account = 0,
): Bip84AccountKeys => {
  // Build BIP84 derivation path: m/84'/coin'/account'/
  const derivationPath = `m/84'/2'/${account}'`;

  // Derive the account extended key
  const accountExtendedKey = deriveKeyFromPath(bip32RootKey, derivationPath);

  // Generate Base58 encoded keys
  const accountXprv = accountExtendedKey.toBase58();
  const accountXpub = accountExtendedKey.neutered().toBase58();

  return {
    accountXprv,
    accountXpub,
    derivationPath,
  };
};

/**
 * Helper function to derive key from path
 * Based on calcBip32ExtendedKey from the original codebase
 */
const deriveKeyFromPath = (
  rootKey: BIP32Interface,
  path: string,
): BIP32Interface => {
  let extendedKey = rootKey;
  const pathBits = path.split('/');

  for (let i = 0; i < pathBits.length; i++) {
    const bit = pathBits[i];
    let index = parseInt(bit, 10);

    if (isNaN(index)) {
      continue;
    }

    // Check for hardened derivation (apostrophe)
    const hardened = bit[bit.length - 1] === "'";
    if (hardened) {
      index += 0x80000000;
    }

    extendedKey = extendedKey.derive(index);
  }

  return extendedKey;
};
