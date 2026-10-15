import {deriveMainExtkey} from './mainKey';
import {getItem} from '../../../utils/keychain';

const mockPbkdf2Buffers: Buffer[] = [];
const mockSeeds: Buffer[] = [];
const mockNodes: {privateKey?: Uint8Array; chainCode: Uint8Array}[] = [];
jest.mock('bip32', () => {
  const actual = jest.requireActual('bip32');
  return {
    ...actual,
    BIP32Factory: (ecc: unknown) => {
      const bip32 = actual.BIP32Factory(ecc);
      return {
        ...bip32,
        fromSeed: (seed: Buffer, network: unknown) => {
          mockSeeds.push(seed);
          const root = bip32.fromSeed(seed, network);
          mockNodes.push(root);
          const derivePath = root.derivePath.bind(root);
          root.derivePath = (path: string) => {
            const node = derivePath(path);
            mockNodes.push(node);
            return node;
          };
          return root;
        },
      };
    },
  };
});
jest.mock('react-native-quick-crypto', () => ({
  pbkdf2: (
    password: Buffer,
    salt: Buffer,
    iterations: number,
    keylen: number,
    digest: string,
    callback: (error: Error | null, key?: Buffer) => void,
  ) => {
    mockPbkdf2Buffers.push(password);
    jest
      .requireActual('node:crypto')
      .pbkdf2(
        password,
        salt,
        iterations,
        keylen,
        digest,
        (error: Error | null, key?: Buffer) => {
          if (key) {
            mockPbkdf2Buffers.push(key);
          }
          callback(error, key);
        },
      );
  },
}));
jest.mock('../../../utils/keychain', () => ({getItem: jest.fn()}));

describe('deriveMainExtkey', () => {
  it('derives the same key bip39 gave for a known phrase', async () => {
    (getItem as jest.Mock).mockResolvedValue(
      [...Array(11).fill('abandon'), 'about'].join(','),
    );
    await expect(deriveMainExtkey()).resolves.toBe(
      '0342ffaef780000001ad8fa4aee8752e2d587d624ee7dba97a8df5bcd785276aadeb5757007583561200ebd5289699f17612d43da06d6007399c3cb88057eefcc7cdb33f74aaf327d621',
    );
  });

  it('wipes the seed and key buffers it made', async () => {
    (getItem as jest.Mock).mockResolvedValue(
      [...Array(11).fill('abandon'), 'about'].join(','),
    );
    const alloc = jest.spyOn(Buffer, 'alloc');
    mockPbkdf2Buffers.length = 0;
    mockSeeds.length = 0;
    mockNodes.length = 0;
    let out: Buffer | undefined;
    try {
      await deriveMainExtkey();
      out = alloc.mock.results
        .map(result => result.value as Buffer)
        .find(buffer => buffer.length === 74);
    } finally {
      alloc.mockRestore();
    }
    const zeroed = (bytes: Uint8Array) => bytes.every(byte => byte === 0);
    expect(mockPbkdf2Buffers).toHaveLength(2);
    expect(mockPbkdf2Buffers.every(zeroed)).toBe(true);
    expect(mockSeeds).toHaveLength(1);
    expect(zeroed(mockSeeds[0])).toBe(true);
    expect(mockNodes).toHaveLength(2);
    for (const node of mockNodes) {
      expect(zeroed(node.privateKey!)).toBe(true);
      expect(zeroed(node.chainCode)).toBe(true);
    }
    expect(zeroed(out!)).toBe(true);
  });
});
