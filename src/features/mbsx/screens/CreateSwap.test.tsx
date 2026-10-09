import React from 'react';
import {act, fireEvent, render, waitFor} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';

import {ScreenSizeContext} from '../../../context/screenSize';
import mbsxAddressesReducer from '../addressesSlice';
import CreateSwap from './CreateSwap';

jest.mock('@dr.pogodin/react-native-fs', () => ({
  DocumentDirectoryPath: '/tmp',
}));
jest.mock('react-native-nitro-lndltc', () => ({
  AddressType: {UNUSED_WITNESS_PUBKEY_HASH: 0},
  newAddress: jest.fn(),
}));

jest.mock('../../../utils/haptic', () => ({
  triggerLightFeedback: jest.fn(),
}));

jest.mock('@react-native-clipboard/clipboard', () => ({
  getString: jest.fn(),
  setString: jest.fn(),
}));

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (effect: () => void | (() => void)) => {
    const {useEffect} = require('react');
    useEffect(effect, [effect]);
  },
}));

jest.mock('../adapter', () => ({
  PAY_IN_COINS: ['BTC', 'PART'],
  confirmedSpend: jest.fn(() => 0n),
  createDeposit: jest.fn(),
  fundingFeeRate: jest.fn(() => Promise.resolve(1n)),
  getCoinPrices: jest.fn(() => null),
  getInfo: jest.fn(() => null),
  getOffersEstimate: jest.fn(),
  getSwapFundingOutputs: jest.fn(() => ({error: 'not running'})),
  isRunning: jest.fn(() => false),
  parseAmount: () => 0n,
  readConfig: () => Promise.resolve(null),
  recordLeases: jest.fn(),
  releasePrevouts: jest.fn(),
  requestOffersEstimate: jest.fn(() => ({error: 'not running'})),
  requestSwap: jest.fn(),
  selectAndLeasePrevouts: jest.fn(),
  serialisePrevout: jest.fn(),
  swapBalances: jest.fn(() => Promise.resolve(null)),
  validateAddress: jest.fn(() => true),
}));

jest.mock('../useKeyboardHeight', () => ({useKeyboardHeight: () => 0}));

const screenSize = {
  width: 375,
  height: 812,
  isDeviceRotated: false,
  testDeviceHeaderHeight: 103,
};

const navigation = {
  navigate: jest.fn(),
  getParent: jest.fn(),
  setParams: jest.fn(),
} as any;

const route = {key: 'CreateSwap', name: 'CreateSwap', params: undefined} as any;

const renderScreen = (connected = false, rates = {}) => {
  const store = configureStore({
    reducer: {
      mbsx: (
        state: {connected: boolean; rates: object; running: boolean} = {
          connected,
          rates,
          running: jest.requireMock('../adapter').isRunning(),
        },
        action: {type: string; payload?: boolean},
      ) =>
        action.type === 'test/running'
          ? {...state, running: action.payload === true}
          : state,
      settings: (state = {torEnabled: false}) => state,
      mbsxAddresses: mbsxAddressesReducer,
      wallets: (state = {wallets: [], selectedWalletId: ''}) => state,
    },
  });
  const screen = render(
    <Provider store={store}>
      <ScreenSizeContext.Provider value={screenSize}>
        <CreateSwap navigation={navigation} route={route} />
      </ScreenSizeContext.Provider>
    </Provider>,
  );
  return {...screen, store};
};

describe('CreateSwap', () => {
  it('takes a scanned address once, so a coin change does not bring it back', () => {
    route.params = {scanData: 'rltc1qscanned'};
    try {
      renderScreen();
      expect(navigation.setParams).toHaveBeenCalledWith({scanData: undefined});
    } finally {
      route.params = undefined;
    }
  });

  it('locks every other input until a coin is chosen', () => {
    const {getByTestId, queryByTestId} = renderScreen();

    expect(getByTestId('mbsx-address-to')).toBeDisabled();
    expect(getByTestId('mbsx-amount-to')).toBeEnabled();
    expect(getByTestId('mbsx-amount-from')).toBeEnabled();
    expect(getByTestId('mbsx-scan')).toBeDisabled();
    expect(getByTestId('mbsx-addresses')).toBeDisabled();
    expect(getByTestId('mbsx-submit')).toBeDisabled();
    expect(getByTestId('mbsx-select-coin-note')).toBeTruthy();

    fireEvent.press(getByTestId('mbsx-coin-pill'));
    fireEvent.press(getByTestId('mbsx-coin-BTC'));

    expect(getByTestId('mbsx-address-to')).toBeEnabled();
    expect(getByTestId('mbsx-amount-to')).toBeEnabled();
    expect(getByTestId('mbsx-amount-from')).toBeEnabled();
    expect(getByTestId('mbsx-scan')).toBeEnabled();
    expect(getByTestId('mbsx-addresses')).toBeEnabled();
    expect(queryByTestId('mbsx-select-coin-note')).toBeNull();
  });

  it('flipped, pays in a coin with no host wallet and asks where to refund it', () => {
    const {getByTestId, queryByTestId} = renderScreen();

    fireEvent.press(getByTestId('mbsx-flip'));

    expect(queryByTestId('mbsx-max')).toBeNull();
    expect(getByTestId('mbsx-address-to')).toBeDisabled();
    expect(getByTestId('mbsx-address-to').props.placeholder).toBe(
      'Refund Address',
    );
    fireEvent.press(getByTestId('mbsx-coin-pill'));
    expect(queryByTestId('mbsx-coin-FIRO')).toBeNull();
    fireEvent.press(getByTestId('mbsx-coin-BTC'));
    expect(getByTestId('mbsx-address-to')).toBeEnabled();

    fireEvent.press(getByTestId('mbsx-flip'));
    expect(getByTestId('mbsx-max')).toBeTruthy();
    expect(getByTestId('mbsx-address-to').props.placeholder).toBe(
      'Receive Address',
    );
  });

  it('shows the fee at this amount, and says when it was raised', () => {
    const adapter = jest.requireMock('../adapter');
    adapter.getInfo.mockReturnValueOnce({
      connected: true,
      coins: {LTC: {bridge_supported: true}, BTC: {bridge_supported: true}},
    });
    adapter.getSwapFundingOutputs.mockReturnValue({
      outputs: [],
      total_fee_bps: 200n,
      max_fee_bps: 500n,
      fee_bps: 196n,
      nominal_fee_bps: 100n,
      fees_raised: true,
    });
    adapter.isRunning.mockReturnValue(true);
    try {
      const {getByTestId, getByText} = renderScreen();

      fireEvent.press(getByTestId('mbsx-coin-pill'));
      fireEvent.press(getByTestId('mbsx-coin-BTC'));
      fireEvent.changeText(getByTestId('mbsx-amount-from'), '0.0015');

      expect(getByText('Swap fee 1.96%')).toBeTruthy();
      expect(getByTestId('mbsx-fee-raised')).toHaveTextContent(
        'Raised from 1% because the amount is small',
      );
    } finally {
      adapter.getSwapFundingOutputs.mockReturnValue({error: 'not running'});
      adapter.isRunning.mockReturnValue(false);
    }
  });

  it('quotes the fee and reads the balance again once the core runs', async () => {
    const adapter = jest.requireMock('../adapter');
    adapter.getInfo.mockReturnValue({
      connected: true,
      coins: {LTC: {bridge_supported: true}, BTC: {bridge_supported: true}},
    });
    adapter.getSwapFundingOutputs.mockReturnValue({
      outputs: [],
      total_fee_bps: 200n,
      max_fee_bps: 500n,
      fee_bps: 196n,
    });
    try {
      const {getByTestId, queryByText, store} = renderScreen();
      fireEvent.press(getByTestId('mbsx-coin-pill'));
      fireEvent.press(getByTestId('mbsx-coin-BTC'));
      fireEvent.changeText(getByTestId('mbsx-amount-from'), '0.0015');
      expect(queryByText('Swap fee 1.96%')).toBeNull();
      const reads = adapter.swapBalances.mock.calls.length;

      act(() => {
        store.dispatch({type: 'test/running', payload: true});
      });
      await waitFor(() => expect(queryByText('Swap fee 1.96%')).toBeTruthy());
      expect(adapter.swapBalances.mock.calls.length).toBeGreaterThan(reads);
    } finally {
      adapter.getInfo.mockReturnValue(null);
      adapter.getSwapFundingOutputs.mockReturnValue({error: 'not running'});
    }
  });

  it('notes server fees above the limit, which cross from native as bigint', () => {
    const adapter = jest.requireMock('../adapter');
    adapter.getInfo.mockReturnValueOnce({
      connected: true,
      coins: {LTC: {bridge_supported: true}, BTC: {bridge_supported: true}},
    });
    adapter.getSwapFundingOutputs.mockReturnValueOnce({
      outputs: [],
      total_fee_bps: 500n,
      max_fee_bps: 200n,
    });
    adapter.isRunning.mockReturnValue(true);
    try {
      const {getByTestId} = renderScreen();

      fireEvent.press(getByTestId('mbsx-coin-pill'));
      fireEvent.press(getByTestId('mbsx-coin-BTC'));
      fireEvent.changeText(getByTestId('mbsx-amount-from'), '1');

      expect(getByTestId('mbsx-bridge-note')).toHaveTextContent(
        'The swap server charges 5%, above your limit of 2%',
      );
    } finally {
      adapter.isRunning.mockReturnValue(false);
    }
  });

  it('names the smallest amount the server fees allow, and holds the swap', () => {
    const adapter = jest.requireMock('../adapter');
    adapter.getInfo.mockReturnValueOnce({
      connected: true,
      coins: {LTC: {bridge_supported: true}, BTC: {bridge_supported: true}},
    });
    adapter.getSwapFundingOutputs.mockReturnValueOnce({
      error: "Too small for the swap server's fees: send at least 0.01176 LTC",
      min_amount: '0.01176',
    });
    adapter.isRunning.mockReturnValue(true);
    try {
      const {getByTestId} = renderScreen();

      fireEvent.press(getByTestId('mbsx-coin-pill'));
      fireEvent.press(getByTestId('mbsx-coin-BTC'));
      fireEvent.changeText(getByTestId('mbsx-amount-from'), '0.0026');

      expect(getByTestId('mbsx-bridge-note')).toHaveTextContent(
        "Too small for the swap server's fees: send at least 0.01176 LTC",
      );
      expect(getByTestId('mbsx-submit')).toBeDisabled();
    } finally {
      adapter.isRunning.mockReturnValue(false);
    }
  });

  it('pays in for any other coin, and asks where one with no host wallet goes', async () => {
    const adapter = jest.requireMock('../adapter');
    const bridged = {bridge_supported: true};
    adapter.getInfo.mockReturnValue({
      connected: true,
      coins: {LTC: bridged, BTC: bridged, PART: bridged, FIRO: bridged},
    });
    adapter.isRunning.mockReturnValue(true);
    adapter.createDeposit.mockReturnValueOnce({deposit_id: 'd1'});
    adapter.validateAddress.mockImplementation(
      (coin: string, address: string) => address !== `not ${coin}`,
    );
    try {
      const {getByTestId, queryByTestId} = renderScreen(true);

      fireEvent.press(getByTestId('mbsx-flip'));
      fireEvent.press(getByTestId('mbsx-coin-pill'));
      fireEvent.press(getByTestId('mbsx-coin-BTC'));
      expect(queryByTestId('mbsx-buy-address')).toBeNull();
      fireEvent.press(getByTestId('mbsx-buy-pill'));
      expect(queryByTestId('mbsx-buy-BTC')).toBeNull();
      fireEvent.press(getByTestId('mbsx-buy-PART'));
      expect(getByTestId('mbsx-buy-address')).toBeTruthy();

      fireEvent.press(getByTestId('mbsx-coin-pill'));
      fireEvent.press(getByTestId('mbsx-coin-PART'));
      expect(queryByTestId('mbsx-buy-address')).toBeNull();

      fireEvent.press(getByTestId('mbsx-buy-pill'));
      fireEvent.press(getByTestId('mbsx-buy-FIRO'));
      fireEvent.changeText(getByTestId('mbsx-address-to'), 'refund');
      fireEvent.changeText(getByTestId('mbsx-buy-address'), 'not FIRO');
      expect(getByTestId('mbsx-buy-address-error')).toBeTruthy();
      expect(getByTestId('mbsx-submit')).toBeDisabled();
      fireEvent.changeText(getByTestId('mbsx-buy-address'), 'firo-dest');
      fireEvent.changeText(getByTestId('mbsx-amount-from'), '1');
      fireEvent.changeText(getByTestId('mbsx-amount-to'), '2');
      fireEvent.press(getByTestId('mbsx-submit'));
      expect(getByTestId('mbsx-confirm')).toHaveTextContent(/To firo-dest/);
      fireEvent.press(getByTestId('mbsx-submit'));

      await waitFor(() =>
        expect(adapter.createDeposit).toHaveBeenCalledWith({
          coin_from: 'PART',
          amount_from: '1',
          coin_to: 'FIRO',
          min_amount_to: '2',
          refund_address: 'refund',
          address_to: 'firo-dest',
        }),
      );
      expect(navigation.navigate).toHaveBeenCalledWith('PayInDetail', {
        depositId: 'd1',
      });
    } finally {
      adapter.getInfo.mockReturnValue(null);
      adapter.isRunning.mockReturnValue(false);
      adapter.validateAddress.mockImplementation(() => true);
    }
  });

  it('stops at a missing field without starting the swap', () => {
    const adapter = jest.requireMock('../adapter');
    const haptic = jest.requireMock('../../../utils/haptic');
    adapter.selectAndLeasePrevouts.mockClear();
    adapter.requestSwap.mockClear();
    adapter.createDeposit.mockClear();
    haptic.triggerLightFeedback.mockClear();
    const bridged = {bridge_supported: true};
    adapter.getInfo.mockReturnValue({
      connected: true,
      coins: {LTC: bridged, BTC: bridged},
    });
    adapter.isRunning.mockReturnValue(true);
    try {
      const {getByTestId, queryByTestId} = renderScreen(true);
      fireEvent.press(getByTestId('mbsx-coin-pill'));
      fireEvent.press(getByTestId('mbsx-coin-BTC'));
      fireEvent.changeText(getByTestId('mbsx-amount-from'), '1');
      fireEvent.changeText(getByTestId('mbsx-amount-to'), '2');
      fireEvent.press(getByTestId('mbsx-submit'));

      expect(getByTestId('mbsx-error')).toHaveTextContent(
        'Missing receive address',
      );
      expect(queryByTestId('mbsx-confirm')).toBeNull();
      expect(haptic.triggerLightFeedback).not.toHaveBeenCalled();
      expect(adapter.selectAndLeasePrevouts).not.toHaveBeenCalled();
      expect(adapter.requestSwap).not.toHaveBeenCalled();
      expect(adapter.createDeposit).not.toHaveBeenCalled();
    } finally {
      adapter.getInfo.mockReturnValue(null);
      adapter.isRunning.mockReturnValue(false);
    }
  });

  it('holds a pay-in no offer would take until the warning is tapped', async () => {
    const adapter = jest.requireMock('../adapter');
    adapter.createDeposit.mockClear();
    const bridged = {bridge_supported: true};
    adapter.getInfo.mockReturnValue({
      connected: true,
      coins: {LTC: bridged, BTC: bridged, PART: bridged, FIRO: bridged},
    });
    adapter.isRunning.mockReturnValue(true);
    adapter.createDeposit.mockReturnValueOnce({deposit_id: 'd1'});
    adapter.requestOffersEstimate.mockReturnValue({message_id: 'e1'});
    adapter.getOffersEstimate.mockReturnValue({
      state: 'answered',
      num_private: 0n,
      num_providers: 0n,
      num_bridged: 0n,
      num_below_minimum: 0n,
    });
    try {
      const {getByTestId} = renderScreen(true);
      fireEvent.press(getByTestId('mbsx-flip'));
      fireEvent.press(getByTestId('mbsx-coin-pill'));
      fireEvent.press(getByTestId('mbsx-coin-BTC'));
      fireEvent.press(getByTestId('mbsx-buy-pill'));
      fireEvent.press(getByTestId('mbsx-buy-PART'));
      fireEvent.changeText(getByTestId('mbsx-address-to'), 'refund');
      fireEvent.changeText(getByTestId('mbsx-buy-address'), 'part-dest');
      fireEvent.changeText(getByTestId('mbsx-amount-from'), '1');
      fireEvent.changeText(getByTestId('mbsx-amount-to'), '2');
      fireEvent.press(getByTestId('mbsx-submit'));

      await waitFor(() =>
        expect(getByTestId('mbsx-offers-estimate')).toHaveTextContent(
          'Offers Now: None',
        ),
      );
      expect(adapter.requestOffersEstimate).toHaveBeenCalledWith({
        coin_from: 'BTC',
        amount_from: '1',
        coin_to: 'PART',
        min_amount_to: '2',
      });
      expect(getByTestId('mbsx-submit')).toBeDisabled();
      fireEvent.press(getByTestId('mbsx-no-offers-warning'));
      expect(getByTestId('mbsx-submit')).not.toBeDisabled();
      fireEvent.press(getByTestId('mbsx-submit'));
      await waitFor(() => expect(adapter.createDeposit).toHaveBeenCalled());
    } finally {
      adapter.getInfo.mockReturnValue(null);
      adapter.isRunning.mockReturnValue(false);
      adapter.requestOffersEstimate.mockReturnValue({error: 'not running'});
      adapter.getOffersEstimate.mockReset();
    }
  });

  it('rechecks the fee limit and the bridge from the confirm card', async () => {
    jest.useFakeTimers();
    const adapter = jest.requireMock('../adapter');
    adapter.createDeposit.mockClear();
    const bridged = {bridge_supported: true};
    adapter.getInfo.mockReturnValue({
      connected: true,
      coins: {LTC: bridged, BTC: bridged, PART: bridged, FIRO: bridged},
    });
    adapter.isRunning.mockReturnValue(true);
    try {
      const {getByTestId} = renderScreen(true);
      fireEvent.press(getByTestId('mbsx-flip'));
      fireEvent.press(getByTestId('mbsx-coin-pill'));
      fireEvent.press(getByTestId('mbsx-coin-PART'));
      fireEvent.press(getByTestId('mbsx-buy-pill'));
      fireEvent.press(getByTestId('mbsx-buy-FIRO'));
      fireEvent.changeText(getByTestId('mbsx-address-to'), 'refund');
      fireEvent.changeText(getByTestId('mbsx-buy-address'), 'firo-dest');
      fireEvent.changeText(getByTestId('mbsx-amount-from'), '1');
      fireEvent.changeText(getByTestId('mbsx-amount-to'), '2');
      fireEvent.press(getByTestId('mbsx-submit'));
      expect(getByTestId('mbsx-confirm')).toBeTruthy();

      adapter.getSwapFundingOutputs.mockReturnValue({
        outputs: [],
        total_fee_bps: 500n,
        max_fee_bps: 200n,
      });
      fireEvent.press(getByTestId('mbsx-submit'));
      await waitFor(() =>
        expect(getByTestId('mbsx-bridge-note')).toHaveTextContent(
          'The swap server charges 5%, above your limit of 2%',
        ),
      );
      expect(adapter.createDeposit).not.toHaveBeenCalled();

      adapter.getSwapFundingOutputs.mockReturnValue({error: 'not running'});
      fireEvent.changeText(getByTestId('mbsx-amount-from'), '1.5');
      fireEvent.press(getByTestId('mbsx-submit'));
      expect(getByTestId('mbsx-submit')).toBeEnabled();
      adapter.getInfo.mockReturnValue({
        connected: true,
        coins: {LTC: bridged, BTC: bridged, PART: bridged, FIRO: {}},
      });
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      expect(getByTestId('mbsx-confirm')).toBeTruthy();
      expect(getByTestId('mbsx-submit')).toBeDisabled();
    } finally {
      jest.useRealTimers();
      adapter.getInfo.mockReturnValue(null);
      adapter.isRunning.mockReturnValue(false);
      adapter.getSwapFundingOutputs.mockReturnValue({error: 'not running'});
    }
  });

  it('notes a coin to buy that the server has no bridge for', () => {
    const adapter = jest.requireMock('../adapter');
    const bridged = {bridge_supported: true};
    adapter.getInfo.mockReturnValue({
      connected: true,
      coins: {LTC: bridged, BTC: bridged, FIRO: {bridge_supported: false}},
    });
    try {
      const {getByTestId, queryByTestId} = renderScreen(true);

      fireEvent.press(getByTestId('mbsx-flip'));
      fireEvent.press(getByTestId('mbsx-coin-pill'));
      fireEvent.press(getByTestId('mbsx-coin-BTC'));
      expect(queryByTestId('mbsx-bridge-note')).toBeNull();
      fireEvent.press(getByTestId('mbsx-buy-pill'));
      fireEvent.press(getByTestId('mbsx-buy-FIRO'));
      expect(getByTestId('mbsx-bridge-note')).toHaveTextContent(
        'The swap server has no bridge for FIRO',
      );
    } finally {
      adapter.getInfo.mockReturnValue(null);
    }
  });

  it('derives the amounts from the independent rate and names it', () => {
    const adapter = jest.requireMock('../adapter');
    adapter.getCoinPrices.mockReturnValue({
      currency: 'USD',
      prices: {LTC: '100', BTC: '50000'},
    });
    try {
      const now = Math.floor(Date.now() / 1000);
      const {getByTestId, getByText} = renderScreen(false, {
        LTC: {usd: 80, source: 'coingecko', at: now},
        BTC: {usd: 100000, source: 'coinpaprika', at: now},
      });
      fireEvent.press(getByTestId('mbsx-coin-pill'));
      fireEvent.press(getByTestId('mbsx-coin-BTC'));
      fireEvent.changeText(getByTestId('mbsx-amount-from'), '1');

      expect(getByTestId('mbsx-amount-to').props.value).toBe('0.000792');
      expect(getByText('CoinGecko and CoinPaprika rate')).toBeTruthy();
      expect(getByTestId('mbsx-reference')).toHaveTextContent(
        '1 LTC ≈ 0.0008 BTC',
      );
      expect(getByTestId('mbsx-server-price-note')).toHaveTextContent(
        "The server's prices differ from the CoinGecko and CoinPaprika rate by 150%.",
      );
    } finally {
      adapter.getCoinPrices.mockReturnValue(null);
    }
  });

  it("uses the server's prices, labelled, when no rate is fresh", () => {
    const adapter = jest.requireMock('../adapter');
    adapter.getCoinPrices.mockReturnValue({
      currency: 'USD',
      prices: {LTC: '100', BTC: '50000'},
    });
    try {
      const old = Math.floor(Date.now() / 1000) - 301;
      const {getByTestId, getByText, queryByTestId} = renderScreen(false, {
        LTC: {usd: 80, source: 'coingecko', at: old},
        BTC: {usd: 100000, source: 'coingecko', at: old},
      });
      fireEvent.press(getByTestId('mbsx-coin-pill'));
      fireEvent.press(getByTestId('mbsx-coin-BTC'));
      fireEvent.changeText(getByTestId('mbsx-amount-from'), '1');

      expect(getByTestId('mbsx-amount-to').props.value).toBe('0.00198');
      expect(getByText("Server's rate, not checked")).toBeTruthy();
      expect(getByTestId('mbsx-reference')).toHaveTextContent(
        '1 LTC ≈ 0.002 BTC',
      );
      expect(queryByTestId('mbsx-server-price-note')).toBeNull();
    } finally {
      adapter.getCoinPrices.mockReturnValue(null);
    }
  });
});
