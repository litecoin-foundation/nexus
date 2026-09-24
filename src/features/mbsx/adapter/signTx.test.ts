import {walletKitFinalizePsbt} from 'react-native-nitro-lndltc';

import {withPendingOutputs} from './leases';
import {serialisePrevout} from './prevouts';
import {signSwapTx} from './signTx';

jest.mock('react-native-nitro-lndltc', () => ({
  ChangeAddressType: {UNSPECIFIED: 0, P2TR: 1, MWEB: 2},
  walletKitFinalizePsbt: jest.fn(),
  walletKitListLeases: jest.fn(),
  walletKitReleaseOutput: jest.fn(),
}));

jest.mock('react-native-nitro-bsx', () => ({
  __esModule: true,
  default: {listWalletLocks: jest.fn(() => ({locks: []}))},
}));

jest.mock('../../../store', () => ({store: {getState: jest.fn(() => ({}))}}));

jest.mock('../../../reducers/wallets', () => ({
  selectedAccountNamesSelector: jest.fn(() => ({})),
}));

const finalizePsbt = walletKitFinalizePsbt as jest.Mock;

// The module's makePsbt vector: one input, spending 11..11:3
const PSBT =
  '70736274ff01fb04020000000102040200000001030400000000010401010105010201920100' +
  '00010e201111111111111111111111111111111111111111111111111111111111111111010f' +
  '0403000000011004fdffffff01011f20a1070000000000160014cccccccccccccccccccccccc' +
  'cccccccccccccccc0103040100000000010308e8030000000000000104160014aaaaaaaaaaaa' +
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaa00010308400d0300000000000104220020bbbbbbbbbbbbbb' +
  'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb00';

const output = serialisePrevout({
  txid: '11'.repeat(32),
  vout: 3,
  amountSat: 500000,
  pkScript: `0014${'cc'.repeat(20)}`,
  leaseId: '',
});

beforeEach(() => {
  jest.clearAllMocks();
  finalizePsbt.mockResolvedValue({rawFinalTx: new Uint8Array([1, 2])});
});

describe('a request being built can sign for its own outputs', () => {
  it('signs while the request is built, and not before or after', async () => {
    await expect(signSwapTx(PSBT)).rejects.toThrow(
      'Refusing to sign for unleased output',
    );
    await withPendingOutputs([output], async () => {
      await expect(signSwapTx(PSBT)).resolves.toBe('0102');
    });
    await expect(signSwapTx(PSBT)).rejects.toThrow(
      'Refusing to sign for unleased output',
    );
    expect(finalizePsbt).toHaveBeenCalledTimes(1);
  });

  it('stops signing when the request fails', async () => {
    await expect(
      withPendingOutputs([output], async () => {
        throw new Error('send failed');
      }),
    ).rejects.toThrow('send failed');
    await expect(signSwapTx(PSBT)).rejects.toThrow(
      'Refusing to sign for unleased output',
    );
  });

  it('does not open other outputs', async () => {
    const other = serialisePrevout({
      txid: '22'.repeat(32),
      vout: 3,
      amountSat: 500000,
      pkScript: `0014${'cc'.repeat(20)}`,
      leaseId: '',
    });
    await withPendingOutputs([other], async () => {
      await expect(signSwapTx(PSBT)).rejects.toThrow(
        'Refusing to sign for unleased output',
      );
    });
  });
});
