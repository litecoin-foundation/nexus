import React from 'react';
import {Alert} from 'react-native';
import {act, fireEvent, render, waitFor} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';

import {ScreenSizeContext} from '../../../context/screenSize';
import SwapDetail from './SwapDetail';
import {abandonSwap, getSwapInfo, readConfig} from '../adapter';

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (effect: () => void | (() => void)) =>
    require('react').useEffect(effect, [effect]),
}));
jest.mock('@dr.pogodin/react-native-fs', () => ({
  DocumentDirectoryPath: '/tmp',
}));
jest.mock('@react-native-clipboard/clipboard', () => ({
  setString: jest.fn(),
}));
jest.mock('../network', () => ({getNetwork: () => 'regtest'}));
jest.mock('../../../utils/haptic', () => ({triggerLightFeedback: jest.fn()}));
jest.mock('../../../components/Buttons/HeaderButton', () => () => null);
jest.mock('../adapter', () => ({
  abandonSwap: jest.fn(),
  displayTxid: (txid: string) => txid,
  getSwapInfo: jest.fn(),
  isGone: () => false,
  isTerminalState: (state: string) =>
    ['COMPLETED', 'ABANDONED', 'FAILED_REFUNDED'].includes(state),
  onMessage: () => ({remove: jest.fn()}),
  readConfig: jest.fn(),
  removeSwap: jest.fn(),
}));

const screenSize = {
  width: 375,
  height: 812,
  isDeviceRotated: false,
  testDeviceHeaderHeight: 103,
};

const renderSwap = async (showDebug: boolean, fundsAtRisk = false) => {
  (readConfig as jest.Mock).mockResolvedValue({show_debug: showDebug});
  (getSwapInfo as jest.Mock).mockReturnValue({
    id: 's1',
    state: 'SCRIPT_COIN_LOCKED',
    created_at: '2026-10-08T00:00:00',
    coin_from: 'LTC',
    coin_to: 'BTC',
    amount_from: '1',
    amount_to: '0.0008',
    fee_rate_from: 1000n,
    fee_rate_to: 1000n,
    funds_at_risk: fundsAtRisk,
    events: [],
  });
  const store = configureStore({
    reducer: {
      mbsx: (state = {running: true}) => state,
      mbsxAddresses: (state = {destinations: {}}) => state,
    },
  });
  const view = render(
    <Provider store={store}>
      <ScreenSizeContext.Provider value={screenSize}>
        <SwapDetail
          navigation={
            {
              setOptions: jest.fn(),
              navigate: jest.fn(),
              goBack: jest.fn(),
            } as any
          }
          route={{params: {swapId: 's1'}} as any}
        />
      </ScreenSizeContext.Provider>
    </Provider>,
  );
  await act(async () => {});
  return view;
};

describe('SwapDetail', () => {
  it('offers to abandon a swap in progress only when debug is shown', async () => {
    const hidden = await renderSwap(false);
    expect(hidden.queryByTestId('mbsx-abandon-swap')).toBeNull();
    hidden.unmount();

    const alert = jest.spyOn(Alert, 'alert');
    const {getByTestId} = await renderSwap(true);
    fireEvent.press(getByTestId('mbsx-abandon-swap'));
    const buttons = alert.mock.calls[0][2]!;
    const abandon = buttons.find(button => button.text === 'Abandon')!;
    await act(async () => {
      abandon.onPress!();
    });
    await waitFor(() => expect(abandonSwap).toHaveBeenCalledWith('s1'));
  });

  it('asks again before abandoning a swap with funds at risk', async () => {
    (abandonSwap as jest.Mock).mockClear();
    const alert = jest.spyOn(Alert, 'alert');
    alert.mockClear();
    const {getByTestId} = await renderSwap(true, true);
    fireEvent.press(getByTestId('mbsx-abandon-swap'));
    const confirm = (call: number) =>
      alert.mock.calls[call][2]!.find(button => button.text === 'Abandon')!;
    await act(async () => {
      confirm(0).onPress!();
    });
    expect(abandonSwap).not.toHaveBeenCalled();
    expect(alert.mock.calls[1][1]).toMatch(/^Funds are at risk/);
    await act(async () => {
      confirm(1).onPress!();
    });
    await waitFor(() => expect(abandonSwap).toHaveBeenCalledWith('s1'));
  });
});
