import NitroBSX from 'react-native-nitro-bsx';
import {
  walletKitListLeases,
  walletKitReleaseOutput,
} from 'react-native-nitro-lndltc';

import {releaseOrphanLeases} from './leases';

jest.mock('./signingRecords', () => ({
  forgetSigning: jest.fn(async () => undefined),
}));

jest.mock('react-native-nitro-lndltc', () => ({
  ChangeAddressType: {UNSPECIFIED: 0},
  walletKitListLeases: jest.fn(),
  walletKitReleaseOutput: jest.fn(),
}));

jest.mock('react-native-nitro-bsx', () => ({
  __esModule: true,
  default: {listWalletLocks: jest.fn(), markWalletLockReleased: jest.fn()},
}));

jest.mock('../../../store', () => ({
  store: {getState: jest.fn(() => ({lightning: {lndActive: true}}))},
}));

jest.mock('../../../reducers/wallets', () => ({
  selectedAccountNamesSelector: jest.fn(() => ({ltcAccount: 'ltc'})),
}));

const listLeases = walletKitListLeases as jest.Mock;
const releaseOutput = walletKitReleaseOutput as jest.Mock;
const listWalletLocks = NitroBSX.listWalletLocks as jest.Mock;

const DAY = 24 * 60 * 60;
const now = () => Math.floor(Date.now() / 1000);
const ourId = (n: number) =>
  Buffer.concat([Buffer.from('mbsx'), Buffer.alloc(28, n)]);

const lease = (id: Buffer, n: number, ageSeconds: number) => ({
  id: new Uint8Array(id),
  outpoint: {txidBytes: new Uint8Array(32).fill(n), outputIndex: n},
  expiration: BigInt(now() + DAY - ageSeconds),
});

const row = (id: Buffer, n: number) => ({
  coin: 'LTC',
  txid: Buffer.alloc(32, n).toString('hex'),
  vout: BigInt(n),
  handle: id.toString('hex'),
  request_id: 'aa',
  value: 1000n,
  locked_at: 0n,
  released: false,
});

beforeEach(() => {
  jest.clearAllMocks();
  releaseOutput.mockResolvedValue({});
});

describe('releaseOrphanLeases', () => {
  it('releases only an old mbsx lease that no row owns', async () => {
    listWalletLocks.mockReturnValue({locks: [row(ourId(2), 2)]});
    listLeases.mockResolvedValue({
      lockedUtxos: [
        lease(ourId(1), 1, 3600),
        lease(ourId(2), 2, 3600),
        lease(ourId(3), 3, 60),
        lease(Buffer.alloc(32, 9), 4, 3600),
      ],
    });
    await releaseOrphanLeases();
    expect(releaseOutput).toHaveBeenCalledTimes(1);
    expect(releaseOutput).toHaveBeenCalledWith({
      id: ourId(1),
      outpoint: {txidBytes: new Uint8Array(32).fill(1), outputIndex: 1},
    });
  });

  it('a row under another id does not own the lease', async () => {
    listWalletLocks.mockReturnValue({locks: [row(ourId(5), 1)]});
    listLeases.mockResolvedValue({lockedUtxos: [lease(ourId(1), 1, 3600)]});
    await releaseOrphanLeases();
    expect(releaseOutput).toHaveBeenCalledTimes(1);
  });

  it('releases nothing when the rows cannot be read', async () => {
    listWalletLocks.mockReturnValue({error: 'Failed to open database'});
    listLeases.mockResolvedValue({lockedUtxos: [lease(ourId(1), 1, 3600)]});
    await releaseOrphanLeases();
    expect(releaseOutput).not.toHaveBeenCalled();
  });
});
