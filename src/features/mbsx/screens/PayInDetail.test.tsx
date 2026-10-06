import React from 'react';
import {Keyboard} from 'react-native';
import {fireEvent, render} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';

import {ScreenSizeContext} from '../../../context/screenSize';
import PayInDetail from './PayInDetail';
import type {Deposit} from '../types';

jest.mock('../../../utils/haptic', () => ({
  triggerLightFeedback: jest.fn(),
}));

jest.mock('@react-native-clipboard/clipboard', () => ({
  setString: jest.fn(),
}));

jest.mock('react-native-qrcode-svg', () => () => null);

jest.mock('../../../components/Buttons/HeaderButton', () => () => null);

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (effect: () => void | (() => void)) => {
    const {useEffect} = require('react');
    useEffect(effect, [effect]);
  },
}));

jest.spyOn(Keyboard, 'addListener').mockReturnValue({remove: jest.fn()} as any);

jest.mock('../network', () => ({getNetwork: () => 'mainnet'}));

jest.mock('@dr.pogodin/react-native-fs', () => ({
  DocumentDirectoryPath: '/tmp',
}));

jest.mock('../adapter', () => ({
  cancelDeposit: jest.fn(),
  getCoinPrices: jest.fn(() => null),
  getInfo: () => ({max_margin_bps: 100}),
  getRequestInfo: jest.fn(),
  getSwapInfo: jest.fn(),
  isUnderwayState: jest.fn(() => false),
  listDeposits: jest.fn(),
  readConfig: () => Promise.resolve(null),
  requestDepositAgain: jest.fn(),
}));

const screenSize = {width: 400, height: 800};
const navigation = {
  setOptions: jest.fn(),
  navigate: jest.fn(),
  goBack: jest.fn(),
};
const route = {
  key: 'PayInDetail',
  name: 'PayInDetail',
  params: {depositId: 'd1'},
} as any;

const deposit = (fields: Partial<Deposit>): Deposit => ({
  deposit_id: 'd1',
  coin: 'BTC',
  address: 'bcrt1qdeposit',
  state: 'WAITING',
  amount_due: '0.01000000',
  received: '0.00000000',
  remaining: '0.01000000',
  payable: true,
  refund_address: 'bcrt1qrefund',
  coin_to: 'LTC',
  min_amount_to: '1.00000000',
  address_to: 'ltc-dest',
  created_at: 0n,
  expire_at: 3600n,
  ...fields,
});

const renderScreen = (shown: Deposit, rates = {}) => {
  jest.requireMock('../adapter').listDeposits.mockReturnValue([shown]);
  const store = configureStore({reducer: {mbsx: (state = {rates}) => state}});
  return render(
    <Provider store={store}>
      <ScreenSizeContext.Provider value={screenSize as any}>
        <PayInDetail navigation={navigation as any} route={route} />
      </ScreenSizeContext.Provider>
    </Provider>,
  );
};

describe('PayInDetail', () => {
  it('asks a short pay-in for what is still missing', async () => {
    const {findByTestId, queryByTestId} = renderScreen(
      deposit({
        state: 'SHORT',
        received: '0.00600000',
        remaining: '0.00400000',
      }),
    );

    expect(await findByTestId('mbsx-payin-amount')).toHaveTextContent(
      '0.00400000 BTC',
    );
    expect(queryByTestId('mbsx-payin-ended')).toBeNull();
  });

  it('stops asking for payment once the pay-in has ended', async () => {
    const {findByTestId, queryByTestId} = renderScreen(
      deposit({state: 'SEEN', payable: false}),
    );

    expect(await findByTestId('mbsx-payin-ended')).toBeTruthy();
    expect(queryByTestId('mbsx-payin-amount')).toBeNull();
    expect(queryByTestId('mbsx-payin-address')).toBeNull();
  });

  it("suggests a new minimum from the app's own rate over the server's", async () => {
    jest.requireMock('../adapter').getCoinPrices.mockReturnValue({
      prices: {BTC: '50000', LTC: '80'},
    });
    const now = Math.floor(Date.now() / 1000);
    const paused = deposit({state: 'NO_OFFER', received: '0.01000000'});
    const checked = renderScreen(paused, {
      BTC: {usd: 100000, source: 'coingecko', at: now},
      LTC: {usd: 80, source: 'coingecko', at: now},
    });

    expect(await checked.findByTestId('mbsx-payin-floor')).toHaveProp(
      'value',
      '12.375',
    );
    expect(checked.getByTestId('mbsx-payin-rate')).toHaveTextContent(
      'CoinGecko rate: 1 BTC ≈ 1250 LTC',
    );
    expect(checked.queryByTestId('mbsx-payin-floor-warning')).toBeNull();
    fireEvent.changeText(checked.getByTestId('mbsx-payin-floor'), '10');
    expect(checked.getByTestId('mbsx-payin-floor-warning')).toHaveTextContent(
      'This minimum is 20% below the CoinGecko rate.',
    );
    checked.unmount();

    const unchecked = renderScreen(paused);
    expect(await unchecked.findByTestId('mbsx-payin-floor')).toHaveProp(
      'value',
      '6.1875',
    );
    expect(unchecked.getByTestId('mbsx-payin-rate')).toHaveTextContent(
      "Server's rate, not checked: 1 BTC ≈ 625 LTC",
    );
  });
});
