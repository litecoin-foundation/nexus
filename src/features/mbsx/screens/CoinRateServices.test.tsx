import React from 'react';
import {fireEvent, render, waitFor} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';

import {ScreenSizeContext} from '../../../context/screenSize';
import {getItem, setItem} from '../../../utils/keychain';
import mbsxReducer, {ratesFetched} from '../mbsxSlice';
import {refreshRates} from '../rates';
import CoinRateServices from './CoinRateServices';

jest.mock('../useKeyboardHeight', () => ({useKeyboardHeight: () => 0}));
jest.mock('../../../components/Buttons/HeaderButton', () => () => null);
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({addListener: () => () => {}, navigate: jest.fn()}),
}));
jest.mock('@dr.pogodin/react-native-fs', () => ({
  DocumentDirectoryPath: '/tmp',
}));
jest.mock('../network', () => ({getNetwork: () => 'mainnet'}));
jest.mock('../../../utils/keychain', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(() => Promise.resolve()),
}));
jest.mock('../../../utils/tor', () => ({
  getTor: jest.fn(),
  isTorReady: jest.fn(),
}));
jest.mock('../adapter', () => ({
  applyConfig: jest.fn(),
  defaultConfig: jest.fn(),
  electrumUrlError: jest.fn(() => ''),
  readConfig: jest.fn(),
}));
jest.mock('../rates', () => ({
  ...jest.requireActual('../rates'),
  refreshRates: jest.fn(),
}));

const screenSize = {
  width: 375,
  height: 812,
  isDeviceRotated: false,
  testDeviceHeaderHeight: 103,
};

const renderPage = () => {
  const store = configureStore({reducer: {mbsx: mbsxReducer}});
  const view = render(
    <Provider store={store}>
      <ScreenSizeContext.Provider value={screenSize}>
        <CoinRateServices navigation={{} as any} route={{} as any} />
      </ScreenSizeContext.Provider>
    </Provider>,
  );
  return {store, view};
};

describe('CoinRateServices', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('keeps keys in the keychain only, and fetches again on save', async () => {
    (getItem as jest.Mock).mockResolvedValue(null);
    const {store, view} = renderPage();
    const enabled = await waitFor(() => view.getByTestId('mbsx-rates-enabled'));
    expect(enabled.props.value).toBe(true);

    fireEvent.press(view.getByTestId('mbsx-rates-coingecko-pro'));
    fireEvent.changeText(view.getByTestId('mbsx-rates-coingecko-key'), 'gk');
    fireEvent.changeText(view.getByTestId('mbsx-rates-coinpaprika-key'), 'pk');
    fireEvent.press(view.getByTestId('mbsx-rates-save'));

    await waitFor(() => expect(refreshRates).toHaveBeenCalledTimes(1));
    expect(setItem).toHaveBeenCalledWith(
      'mbsx_rate_services',
      JSON.stringify({
        enabled: true,
        coingecko: {key: 'gk', plan: 'pro'},
        coinpaprika: {key: 'pk'},
      }),
    );
    expect(JSON.stringify(store.getState())).not.toMatch(/gk|pk/);
    expect(view.queryByTestId('mbsx-rates-save')).toBeNull();
  });

  it('turns fetching off, and every source then reads off', async () => {
    (getItem as jest.Mock).mockResolvedValue(
      JSON.stringify({enabled: true, coingecko: {key: 'gk', plan: 'demo'}}),
    );
    const {view} = renderPage();
    const enabled = await waitFor(() => view.getByTestId('mbsx-rates-enabled'));
    fireEvent(enabled, 'valueChange', false);
    fireEvent.press(view.getByTestId('mbsx-rates-save'));

    await waitFor(() => expect(refreshRates).toHaveBeenCalledTimes(1));
    expect(JSON.parse((setItem as jest.Mock).mock.calls[0][1]).enabled).toBe(
      false,
    );
    expect(view.getByTestId('mbsx-rates-status-coingecko')).toHaveTextContent(
      'Off',
    );
  });

  it("shows each source's last result", async () => {
    (getItem as jest.Mock).mockResolvedValue(null);
    const {store, view} = renderPage();
    store.dispatch(
      ratesFetched({
        rates: {},
        results: {
          coingecko: {kind: 'limited', until: 1_800_000_000},
          coinpaprika: {kind: 'ok', at: 1_800_000_000, coins: ['PART']},
          mexc: {kind: 'failed', at: 1_800_000_000, message: 'HTTP 500'},
        },
      }),
    );
    await waitFor(() => view.getByTestId('mbsx-rates-status-coingecko'));
    expect(view.getByTestId('mbsx-rates-status-coingecko')).toHaveTextContent(
      /^Rate limited until /,
    );
    expect(view.getByTestId('mbsx-rates-status-coinpaprika')).toHaveTextContent(
      /^PART at /,
    );
    expect(view.getByTestId('mbsx-rates-status-mexc')).toHaveTextContent(
      /: HTTP 500$/,
    );
  });
});
