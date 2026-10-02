import ecc from '@bitcoinerlab/secp256k1';
import {BIP32Factory, BIP32Interface} from 'bip32';
import {pbkdf2} from 'react-native-quick-crypto';

import {getItem} from '../../../utils/keychain';
import {LITECOIN} from '../../../utils/litecoin';

const bip32 = BIP32Factory(ecc);

// Must match AppTypes::NEXUS in the module: it is a level of every key path the
// module derives, so a change here moves every key.
export const APP_TYPE_NEXUS = 1;

export const MBSX_MAIN_KEY_PATH = `m/44445555'/0'/${APP_TYPE_NEXUS}'`;

const EXTKEY_SIZE = 74;

// bip39.mnemonicToSeed done natively: its pure-js PBKDF2 holds the js thread
// for over a second.
const mnemonicToSeed = (mnemonic: string): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    pbkdf2(
      Buffer.from(mnemonic.normalize('NFKD'), 'utf8'),
      Buffer.from('mnemonic', 'utf8'),
      2048,
      64,
      'sha512',
      (error, key) =>
        error || !key ? reject(error) : resolve(Buffer.from(key)),
    );
  });

// depth[1] | parent fingerprint[4] | child number[4 BE] | chaincode[32] |
// 0x00 | privkey[32], matching ExtKey::encodeV. Not base58: the module has no
// business negotiating Ltpv/zprv version bytes.
const serialiseExtkey = (node: BIP32Interface): string => {
  if (!node.privateKey) {
    throw new Error('mbsx main key must be private');
  }
  const out = Buffer.alloc(EXTKEY_SIZE);
  out[0] = node.depth;
  out.writeUInt32BE(node.parentFingerprint, 1);
  out.writeUInt32BE(node.index, 5);
  Buffer.from(node.chainCode).copy(out, 9);
  out[41] = 0;
  Buffer.from(node.privateKey).copy(out, 42);
  return out.toString('hex');
};

/**
 * The module's main extended key, derived from the same seed phrase the wallet
 * recovers from. Nothing about mbsx needs backing up separately as a result.
 */
export const deriveMainExtkey = async (): Promise<string> => {
  const stored = await getItem('SEEDPHRASE');
  if (!stored) {
    throw new Error('No seed phrase, cannot derive the mbsx key');
  }
  // Stored comma-joined, and read through bip39 rather than aezeed: this is a
  // side tree, so all that matters is that the same words always reach it.
  const mnemonic = stored.split(',').join(' ');
  const seed = await mnemonicToSeed(mnemonic);
  const root = bip32.fromSeed(seed, LITECOIN);

  return serialiseExtkey(root.derivePath(MBSX_MAIN_KEY_PATH));
};
