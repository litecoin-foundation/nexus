import React from 'react';
import {fireEvent, render} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';

import {ScreenSizeContext} from '../../../context/screenSize';
import mbsxAddressesReducer from '../addressesSlice';
import CreateSwap from './CreateSwap';

jest.mock('react-native-nitro-lndltc', () => ({
  AddressType: {UNUSED_WITNESS_PUBKEY_HASH: 0},
  newAddress: jest.fn(),
}));

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (effect: () => void | (() => void)) => {
    const {useEffect} = require('react');
    useEffect(effect, [effect]);
  },
}));

jest.mock('../adapter', () => ({
  getCoinPrices: () => null,
  getInfo: jest.fn(() => null),
  getSwapFundingOutputs: jest.fn(() => ({error: 'not running'})),
  isRunning: () => false,
  parseAmount: () => 0n,
  recordLeases: jest.fn(),
  releasePrevouts: jest.fn(),
  requestSwap: jest.fn(),
  selectAndLeasePrevouts: jest.fn(),
  serialisePrevout: jest.fn(),
  swapBalances: () => Promise.resolve(null),
  validateAddress: () => true,
}));

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

const renderScreen = () => {
  const store = configureStore({
    reducer: {
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
});
