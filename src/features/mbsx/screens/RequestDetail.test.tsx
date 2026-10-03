import React from 'react';
import {fireEvent, render} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';

import {ScreenSizeContext} from '../../../context/screenSize';
import RequestDetail from './RequestDetail';
import {getRequestInfo} from '../adapter';

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (effect: () => void | (() => void)) =>
    require('react').useEffect(effect, [effect]),
}));
jest.mock('@dr.pogodin/react-native-fs', () => ({
  DocumentDirectoryPath: '/tmp',
}));
jest.mock('../network', () => ({getNetwork: () => 'mainnet'}));
jest.mock('../../../utils/haptic', () => ({triggerLightFeedback: jest.fn()}));
jest.mock('../../../components/Buttons/HeaderButton', () => () => null);
jest.mock('../adapter', () => ({
  BUSY: 'busy',
  acceptOffer: jest.fn(() => Promise.resolve({})),
  getRequestInfo: jest.fn(),
  getSwapInfo: jest.fn(() => null),
  isUnderwayState: () => false,
  onMessage: () => ({remove: jest.fn()}),
  readConfig: () => Promise.resolve(null),
  removeRequest: jest.fn(),
}));

const screenSize = {
  width: 375,
  height: 812,
  isDeviceRotated: false,
  testDeviceHeaderHeight: 103,
};

const offer = (id: string, amount_receive: string) => ({
  id,
  kind: 'PRIVATE',
  expire_at: '2999-01-01T00:00:00',
  accepted: false,
  state: 'RECEIVED',
  coin_send: 'LTC',
  coin_receive: 'BTC',
  amount_send: '1',
  amount_receive,
  market_amount_receive: amount_receive,
});

const renderRequest = (rates = {}) => {
  (getRequestInfo as jest.Mock).mockReturnValue({
    id: 'r1',
    created_at: '2026-10-03T00:00:00',
    expire_at: '2999-01-01T00:00:00',
    state: 'OFFER_RECEIVED',
    coin_from: 'LTC',
    coin_to: 'BTC',
    amount_from: '1',
    min_amount_to: '0.0007',
    offers: [offer('low', '0.00072'), offer('fair', '0.00079')],
  });
  const store = configureStore({
    reducer: {mbsx: (state = {rates}) => state},
  });
  return render(
    <Provider store={store}>
      <ScreenSizeContext.Provider value={screenSize}>
        <RequestDetail
          navigation={{setOptions: jest.fn(), navigate: jest.fn()} as any}
          route={{params: {requestId: 'r1'}} as any}
        />
      </ScreenSizeContext.Provider>
    </Provider>,
  );
};

describe('RequestDetail', () => {
  it('holds Accept on a warned offer until the warning is tapped', () => {
    const now = Math.floor(Date.now() / 1000);
    const view = renderRequest({
      LTC: {usd: 80, source: 'coingecko', at: now},
      BTC: {usd: 100000, source: 'coingecko', at: now},
    });

    expect(view.getByTestId('mbsx-offer-warning-low')).toHaveTextContent(
      'You would receive 10% less than the CoinGecko rate. Tap this warning to accept anyway.',
    );
    expect(view.getByTestId('mbsx-accept-low')).toBeDisabled();
    expect(view.queryByTestId('mbsx-offer-warning-fair')).toBeNull();
    expect(view.getByTestId('mbsx-accept-fair')).toBeEnabled();

    fireEvent.press(view.getByTestId('mbsx-offer-warning-low'));
    expect(view.getByTestId('mbsx-offer-warning-low')).toHaveTextContent(
      'You would receive 10% less than the CoinGecko rate.',
    );
    expect(view.getByTestId('mbsx-accept-low')).toBeEnabled();
  });
});
