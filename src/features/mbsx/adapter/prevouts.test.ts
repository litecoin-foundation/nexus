import {
  walletKitFundPsbt,
  walletKitLeaseOutput,
  walletKitListUnspent,
  walletKitReleaseOutput,
} from 'react-native-nitro-lndltc';

import {
  selectAndLeasePrevouts,
  spendableBalance,
  swapBalances,
} from './prevouts';

jest.mock('react-native-nitro-lndltc', () => ({
  ChangeAddressType: {UNSPECIFIED: 0, P2TR: 1, MWEB: 2},
  walletKitListUnspent: jest.fn(),
  walletKitFundPsbt: jest.fn(),
  walletKitReleaseOutput: jest.fn(),
  walletKitLeaseOutput: jest.fn(),
}));

jest.mock('react-native-quick-crypto', () => ({
  __esModule: true,
  default: {randomBytes: (n: number) => Buffer.alloc(n, 7)},
}));

jest.mock('../../../store', () => ({store: {getState: jest.fn(() => ({}))}}));

jest.mock('../../../reducers/wallets', () => ({
  selectedAccountNamesSelector: jest.fn(() => ({
    ltcAccount: 'ltc-hw',
    mwebAccount: 'mweb-hw',
  })),
}));

const listUnspent = walletKitListUnspent as jest.Mock;
const fundPsbt = walletKitFundPsbt as jest.Mock;
const releaseOutput = walletKitReleaseOutput as jest.Mock;
const leaseOutput = walletKitLeaseOutput as jest.Mock;

const LND_ID = Buffer.alloc(32, 3);
const OUR_ID = Buffer.concat([Buffer.from('mbsx'), Buffer.alloc(28, 7)]);

const P2WPKH = `0014${'11'.repeat(20)}`;

const utxo = {
  outpoint: {txidBytes: new Uint8Array(32).fill(2), outputIndex: 0},
  pkScript: P2WPKH,
  amountSat: 500000,
  confirmations: 3,
};

beforeEach(() => {
  jest.clearAllMocks();
  listUnspent.mockResolvedValue({utxos: [utxo]});
  fundPsbt.mockResolvedValue({
    lockedUtxos: [{outpoint: utxo.outpoint, id: new Uint8Array(LND_ID)}],
  });
  releaseOutput.mockResolvedValue({});
  leaseOutput.mockResolvedValue({});
});

describe('the selected coins are leased to us for a day', () => {
  const coins = [1, 2, 3].map(n => ({
    ...utxo,
    outpoint: {txidBytes: new Uint8Array(32).fill(n), outputIndex: n},
  }));
  const outpointOf = (n: number) => ({
    txidBytes: Buffer.alloc(32, n),
    outputIndex: n,
  });

  beforeEach(() => {
    listUnspent.mockResolvedValue({utxos: coins});
    fundPsbt.mockResolvedValue({
      lockedUtxos: coins.map(c => ({
        outpoint: c.outpoint,
        id: new Uint8Array(LND_ID),
      })),
    });
  });

  it('moves every coin off lnd´s lease onto one of ours', async () => {
    const selected = await selectAndLeasePrevouts(
      [{address: 'rltc1qtest', value: 100000}],
      false,
    );
    expect(selected.map(p => p.leaseId)).toEqual(
      Array(3).fill(OUR_ID.toString('hex')),
    );
    expect(releaseOutput.mock.calls.map(([r]) => r)).toEqual(
      [1, 2, 3].map(n => ({id: LND_ID, outpoint: outpointOf(n)})),
    );
    expect(leaseOutput.mock.calls.map(([r]) => r)).toEqual(
      [1, 2, 3].map(n => ({
        id: OUR_ID,
        outpoint: outpointOf(n),
        expirationSeconds: 86400n,
      })),
    );
    expect(releaseOutput.mock.invocationCallOrder[0]).toBeLessThan(
      leaseOutput.mock.invocationCallOrder[0],
    );
  });

  it('a lease that fails lets every coin go under the id it holds', async () => {
    leaseOutput
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error('output already locked'));
    await expect(
      selectAndLeasePrevouts([{address: 'rltc1qtest', value: 100000}], false),
    ).rejects.toThrow('output already locked');
    expect(releaseOutput.mock.calls.slice(2).map(([r]) => r)).toEqual([
      {id: OUR_ID, outpoint: outpointOf(1)},
      {id: LND_ID, outpoint: outpointOf(3)},
    ]);
  });
});

describe('lnd calls are scoped to the wallet´s litecoin account', () => {
  it('spendableBalance names the account', async () => {
    await spendableBalance();
    expect(listUnspent).toHaveBeenCalledWith(
      expect.objectContaining({account: 'ltc-hw'}),
    );
  });

  it('swapBalances names the account', async () => {
    await swapBalances();
    expect(listUnspent).toHaveBeenCalledWith(
      expect.objectContaining({account: 'ltc-hw'}),
    );
  });

  it('selectAndLeasePrevouts names the account when listing and funding', async () => {
    await selectAndLeasePrevouts(
      [{address: 'rltc1qtest', value: 100000}],
      false,
    );
    expect(listUnspent).toHaveBeenCalledWith(
      expect.objectContaining({account: 'ltc-hw'}),
    );
    expect(fundPsbt).toHaveBeenCalledWith(
      expect.objectContaining({account: 'ltc-hw'}),
    );
  });

  it('an explicit account still wins', async () => {
    await spendableBalance('other');
    expect(listUnspent).toHaveBeenCalledWith(
      expect.objectContaining({account: 'other'}),
    );
  });
});
