import {walletKitFundPsbt, walletKitListUnspent} from 'react-native-nitro-lndltc';

import {selectAndLeasePrevouts, spendableBalance, swapBalances} from './prevouts';

jest.mock('react-native-nitro-lndltc', () => ({
  ChangeAddressType: {UNSPECIFIED: 0, P2TR: 1, MWEB: 2},
  walletKitListUnspent: jest.fn(),
  walletKitFundPsbt: jest.fn(),
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
    lockedUtxos: [{outpoint: utxo.outpoint, id: new Uint8Array(32).fill(3)}],
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
