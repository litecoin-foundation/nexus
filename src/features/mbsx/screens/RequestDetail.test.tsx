import React from 'react';
import {act, fireEvent, render} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {configureStore, type UnknownAction} from '@reduxjs/toolkit';

import {ScreenSizeContext} from '../../../context/screenSize';
import RequestDetail from './RequestDetail';
import {acceptOffer, getRequestInfo} from '../adapter';
import {UNCHECKED_RATE} from '../useSwapAmounts';

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
jest.mock('../network', () => ({getNetwork: () => 'mainnet'}));
jest.mock('../../../utils/haptic', () => ({triggerLightFeedback: jest.fn()}));
jest.mock('../../../components/Buttons/HeaderButton', () => () => null);
jest.mock('../adapter', () => ({
  isGone: (rv: {error?: string}) => rv.error === 'Swap request not found',
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

const renderRequest = (
  rates = {},
  offers: object[] = [offer('low', '0.00072'), offer('fair', '0.00079')],
  extra: object = {},
) => {
  (getRequestInfo as jest.Mock).mockReturnValue({
    id: 'r1',
    created_at: '2026-10-03T00:00:00',
    expire_at: '2999-01-01T00:00:00',
    state: 'OFFER_RECEIVED',
    coin_from: 'LTC',
    coin_to: 'BTC',
    amount_from: '1',
    min_amount_to: '0.0007',
    offers,
    ...extra,
  });
  const store = configureStore({
    reducer: {
      mbsx: (state = {rates}, action: UnknownAction) =>
        action.type === 'rates' ? {rates: action.rates as typeof rates} : state,
    },
  });
  const view = render(
    <Provider store={store}>
      <ScreenSizeContext.Provider value={screenSize}>
        <RequestDetail
          navigation={{setOptions: jest.fn(), navigate: jest.fn()} as any}
          route={{params: {requestId: 'r1'}} as any}
        />
      </ScreenSizeContext.Provider>
    </Provider>,
  );
  return Object.assign(view, {
    setRates: (next: object) =>
      act(() => {
        store.dispatch({type: 'rates', rates: next});
      }),
  });
};

const freshRates = () => {
  const now = Math.floor(Date.now() / 1000);
  return {
    LTC: {usd: 80, source: 'coingecko', at: now},
    BTC: {usd: 100000, source: 'coingecko', at: now},
  };
};

describe('RequestDetail', () => {
  it('holds Accept on a warned offer until the warning is tapped', () => {
    const view = renderRequest(freshRates());

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

  it('ranks offers by what is sent, fee included', () => {
    const view = renderRequest({}, [
      {
        ...offer('dear', '0.0008'),
        fees: [
          {
            desc: 'Platform fee',
            bps: 100n,
            amount: '0.01',
            coin: 'LTC',
            paid_by: 'APP',
          },
        ],
        fees_coin: 'LTC',
        fees_total: '0.01',
        fees_bps: 100n,
      },
      {
        ...offer('cheap', '0.000795'),
        fees: [
          {
            desc: 'Platform fee',
            bps: 100n,
            amount: '0.01',
            coin: 'LTC',
            paid_by: 'PROVIDER',
          },
        ],
        fees_coin: 'LTC',
        fees_total: '0.01',
        fees_bps: 0n,
      },
    ]);
    expect(view.getByTestId('mbsx-best-rate-cheap')).toBeTruthy();
    expect(view.queryByTestId('mbsx-best-rate-dear')).toBeNull();
  });

  it('leaves out a fee that is not in the coin sent', () => {
    const view = renderRequest({}, [
      {
        ...offer('other', '0.0008'),
        fees: [],
        fees_coin: 'BTC',
        fees_total: '0.01',
        fees_bps: 100n,
      },
      {...offer('plain', '0.000795'), fees: []},
    ]);
    expect(view.getByTestId('mbsx-best-rate-other')).toBeTruthy();
  });

  it('names the total sent, fee included, before Accept', () => {
    const view = renderRequest(freshRates(), [
      {
        ...offer('fee', '0.00079'),
        fees: [
          {
            desc: 'Platform fee',
            bps: 15n,
            amount: '0.0015',
            coin: 'LTC',
            paid_by: 'APP',
          },
        ],
        fees_coin: 'LTC',
        fees_total: '0.0015',
        fees_bps: 15n,
      },
    ]);
    fireEvent.press(view.getByTestId('mbsx-accept-fee'));
    expect(view.getByTestId('mbsx-accept-total')).toHaveTextContent(
      'Total sent incl. fees: 1.0015 LTC, plus the network fee.',
    );
  });

  it('shows an offer fee compactly and its breakdown on a tap', () => {
    const view = renderRequest({}, [
      {
        ...offer('fee', '0.00079'),
        fees: [
          {
            desc: 'Platform fee',
            bps: 15n,
            amount: '0.0015',
            coin: 'LTC',
            paid_by: 'APP',
          },
          {
            desc: 'Platform fee',
            bps: 15n,
            amount: '0.00000012',
            coin: 'BTC',
            paid_by: 'PROVIDER',
          },
        ],
        fees_coin: 'LTC',
        fees_total: '0.0015',
        fees_bps: 15n,
      },
      {...offer('free', '0.00079'), fees: []},
      {
        ...offer('raised', '0.00079'),
        fees: [
          {
            desc: 'Nexus',
            bps: 196n,
            amount: '0.0000294',
            coin: 'LTC',
            paid_by: 'APP',
          },
        ],
        fees_coin: 'LTC',
        fees_total: '0.0000294',
        fees_bps: 196n,
        nominal_fee_bps: 100n,
        fees_raised: true,
      },
    ]);

    expect(view.getByTestId('mbsx-offer-fee-fee')).toHaveTextContent(
      'Swap fee 0.15% (0.0015 LTC)',
    );
    expect(view.queryByTestId('mbsx-offer-fee-raised-fee')).toBeNull();
    expect(view.getByTestId('mbsx-offer-fee-raised-raised')).toHaveTextContent(
      'Raised from 1% because the amount is small',
    );
    expect(view.queryByText('Fee paid by provider')).toBeNull();
    fireEvent.press(view.getByTestId('mbsx-offer-fee-fee'));
    expect(view.getByText('Fee paid by provider')).toBeTruthy();
    expect(view.getByText('0.00000012 BTC')).toBeTruthy();
    expect(view.getByText('No swap fee')).toBeTruthy();
  });

  it('folds the fee breakdown under its total until tapped', () => {
    const view = renderRequest({}, [], {
      fees: [
        {desc: 'Nexus', bps: 50n, amount: '0.005'},
        {desc: 'BSX', bps: 50n, amount: '0.005'},
      ],
      fees_coin: 'LTC',
      fees_total: '0.01',
    });

    expect(view.getByTestId('mbsx-request-fees')).toHaveTextContent(
      /Total\s*1%\s*0\.01 LTC/,
    );
    expect(view.queryByText('Nexus')).toBeNull();
    expect(
      view.getByText(
        'Added to the LTC you send. The exact amount follows the offer you accept.',
      ),
    ).toBeTruthy();
    fireEvent.press(view.getByTestId('mbsx-request-fees'));
    expect(view.getByText('Nexus')).toBeTruthy();
    expect(view.getByText('BSX')).toBeTruthy();
  });

  it('holds Accept on a short lock time until the warning is tapped', () => {
    const bridged = (id: string, lock_time: number, short_lock: boolean) => ({
      ...offer(id, '0.00079'),
      kind: 'BRIDGED',
      lock_time,
      short_lock,
    });
    const view = renderRequest(freshRates(), [
      bridged('brief', 9000, true),
      bridged('long', 172800, false),
      {...bridged('untimed', 0, true), lock_time: undefined},
    ]);

    expect(view.getByTestId('mbsx-offer-warning-untimed')).toHaveTextContent(
      /^This offer's lock time is short\. Keep your phone online/,
    );
    expect(view.getByTestId('mbsx-accept-untimed')).toBeDisabled();

    expect(view.getByTestId('mbsx-offer-warning-brief')).toHaveTextContent(
      "This offer's lock time is only 2.5 hours. Keep your phone online until the swap completes: if it stalls and your phone is offline that long, you could lose funds. Tap this warning to accept anyway.",
    );
    expect(view.getByTestId('mbsx-accept-brief')).toBeDisabled();
    expect(view.queryByTestId('mbsx-offer-warning-long')).toBeNull();
    expect(view.getByTestId('mbsx-accept-long')).toBeEnabled();

    fireEvent.press(view.getByTestId('mbsx-offer-warning-brief'));
    expect(view.getByTestId('mbsx-accept-brief')).toBeEnabled();
  });

  it('stops at an offer withdrawn since it was picked', async () => {
    const view = renderRequest(freshRates());
    fireEvent.press(view.getByTestId('mbsx-accept-fair'));
    const before = (getRequestInfo as jest.Mock).mock.results[0].value;
    (getRequestInfo as jest.Mock).mockReturnValue({
      ...before,
      offers: before.offers.map((o: {id: string}) =>
        o.id === 'fair' ? {...o, state: 'REVOKED'} : o,
      ),
    });
    await act(async () => {
      fireEvent.press(view.getByTestId('mbsx-accept-confirm-button'));
    });
    expect(acceptOffer).not.toHaveBeenCalled();
    expect(view.getByTestId('mbsx-accept-gone')).toHaveTextContent(
      'This offer is no longer available.',
    );
    expect(view.queryByTestId('mbsx-accept-confirm-button')).toBeNull();
  });

  it('holds an offer no independent rate checks, and again when its warning changes', () => {
    const view = renderRequest();

    expect(view.getByTestId('mbsx-offer-warning-low')).toHaveTextContent(
      `${UNCHECKED_RATE} Tap this warning to accept anyway.`,
    );
    expect(view.getByTestId('mbsx-accept-low')).toBeDisabled();
    expect(view.getByTestId('mbsx-accept-fair')).toBeDisabled();
    fireEvent.press(view.getByTestId('mbsx-offer-warning-low'));
    expect(view.getByTestId('mbsx-accept-low')).toBeEnabled();

    view.setRates(freshRates());
    expect(view.getByTestId('mbsx-offer-warning-low')).toHaveTextContent(
      'You would receive 10% less than the CoinGecko rate. Tap this warning to accept anyway.',
    );
    expect(view.getByTestId('mbsx-accept-low')).toBeDisabled();
    expect(view.queryByTestId('mbsx-offer-warning-fair')).toBeNull();
    expect(view.getByTestId('mbsx-accept-fair')).toBeEnabled();
  });
});
