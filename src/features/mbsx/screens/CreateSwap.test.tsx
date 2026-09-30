import React from 'react';
import {Keyboard} from 'react-native';
import {fireEvent, render, waitFor} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';

import {ScreenSizeContext} from '../../../context/screenSize';
import mbsxAddressesReducer from '../addressesSlice';
import CreateSwap from './CreateSwap';

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
  createDeposit: jest.fn(),
  getCoinPrices: () => null,
  getInfo: jest.fn(() => null),
  getSwapFundingOutputs: jest.fn(() => ({error: 'not running'})),
  isRunning: jest.fn(() => false),
  parseAmount: () => 0n,
  readConfig: () => Promise.resolve(null),
  recordLeases: jest.fn(),
  releasePrevouts: jest.fn(),
  requestSwap: jest.fn(),
  selectAndLeasePrevouts: jest.fn(),
  serialisePrevout: jest.fn(),
  swapBalances: () => Promise.resolve(null),
  validateAddress: jest.fn(() => true),
}));

jest.spyOn(Keyboard, 'addListener').mockReturnValue({remove: jest.fn()} as any);

const screenSize = {
  width: 375,
  height: 812,
  isDeviceRotated: false,
  testDeviceHeaderHeight: 103,
};

const navigation = {
  navigate: jest.fn(),
  getParent: jest.fn(),
} as any;

const route = {key: 'CreateSwap', name: 'CreateSwap', params: undefined} as any;

const renderScreen = (connected = false) => {
  const store = configureStore({
    reducer: {
      mbsx: (state = {connected}) => state,
      settings: (state = {torEnabled: false}) => state,
      mbsxAddresses: mbsxAddressesReducer,
      wallets: (state = {wallets: [], selectedWalletId: ''}) => state,
    },
  });
  return render(
    <Provider store={store}>
      <ScreenSizeContext.Provider value={screenSize}>
        <CreateSwap navigation={navigation} route={route} />
      </ScreenSizeContext.Provider>
    </Provider>,
  );
};

describe('CreateSwap', () => {
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
      'Refund address',
    );
    fireEvent.press(getByTestId('mbsx-coin-pill'));
    expect(queryByTestId('mbsx-coin-FIRO')).toBeNull();
    fireEvent.press(getByTestId('mbsx-coin-BTC'));
    expect(getByTestId('mbsx-address-to')).toBeEnabled();

    fireEvent.press(getByTestId('mbsx-flip'));
    expect(getByTestId('mbsx-max')).toBeTruthy();
    expect(getByTestId('mbsx-address-to').props.placeholder).toBe(
      'Receive address',
    );
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
    const {getByTestId} = renderScreen();

    fireEvent.press(getByTestId('mbsx-coin-pill'));
    fireEvent.press(getByTestId('mbsx-coin-BTC'));
    fireEvent.changeText(getByTestId('mbsx-amount-from'), '1');

    expect(getByTestId('mbsx-bridge-note')).toHaveTextContent(
      'The swap server charges 5%, above your limit of 2%',
    );
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
});
