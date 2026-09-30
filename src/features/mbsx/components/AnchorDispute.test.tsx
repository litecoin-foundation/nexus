import React from 'react';
import {Alert} from 'react-native';
import {act, fireEvent, render, waitFor} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';

import mbsxReducer from '../mbsxSlice';
import AnchorDispute from './AnchorDispute';
import {applyConfig, getInfo, onMessage, readConfig} from '../adapter';

jest.mock('../adapter', () => ({
  applyConfig: jest.fn(() => Promise.resolve()),
  getInfo: jest.fn(),
  isRunning: jest.fn(() => true),
  onMessage: jest.fn(() => ({remove: jest.fn()})),
  readConfig: jest.fn(),
}));

const config = {
  chain: 'regtest',
  debug: false,
  bridge_host: '',
  coins: {
    part: {
      enabled: true,
      electrumx: [{url: 'tcp://a:1'}, {url: 'tcp://b:2', haveverbosetx: false}],
    },
    btc: {enabled: true, electrumx: [{url: 'tcp://b:2'}]},
  },
};

const disputed = {
  connected: true,
  coins: {
    PART: {
      chain_height: 10,
      bridge_supported: true,
      anchor_dispute: {url: 'tcp://b:2', height: 5, source: 'glue'},
    },
    BTC: {chain_height: 10, bridge_supported: true},
  },
};

const renderBanner = () => {
  const store = configureStore({reducer: {mbsx: mbsxReducer}});
  store.dispatch({type: 'mbsx/setRunning', payload: true});
  return render(
    <Provider store={store}>
      <AnchorDispute />
    </Provider>,
  );
};

describe('AnchorDispute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (readConfig as jest.Mock).mockResolvedValue(config);
  });

  it('shows a dispute once a message reports one', () => {
    (getInfo as jest.Mock).mockReturnValue({
      connected: true,
      coins: {PART: {chain_height: 10, bridge_supported: true}},
    });
    const {getByText, queryByTestId} = renderBanner();
    expect(queryByTestId('mbsx-anchor-dispute-disable-PART')).toBeNull();

    (getInfo as jest.Mock).mockReturnValue(disputed);
    const load = (onMessage as jest.Mock).mock.calls[0][0];
    act(() => load({type: 'error', data: ''}));
    getByText('PART server tcp://b:2 disagrees with the swap server');
    expect(queryByTestId('mbsx-anchor-dispute-disable-BTC')).toBeNull();
  });

  it('disables only the disagreeing server of that coin', async () => {
    (getInfo as jest.Mock).mockReturnValue(disputed);
    const alert = jest.spyOn(Alert, 'alert');
    const {getByTestId, getByText, queryByTestId} = renderBanner();
    getByText('PART server tcp://b:2 disagrees with the swap server');

    fireEvent.press(getByTestId('mbsx-anchor-dispute-disable-PART'));
    expect(applyConfig).not.toHaveBeenCalled();
    const buttons = alert.mock.calls[0][2]!;
    (getInfo as jest.Mock).mockReturnValue({
      ...disputed,
      coins: {
        ...disputed.coins,
        PART: {chain_height: 10, bridge_supported: true},
      },
    });
    await act(async () => {
      buttons.find(button => button.text === 'Disable')!.onPress!();
    });

    await waitFor(() =>
      expect(queryByTestId('mbsx-anchor-dispute-disable-PART')).toBeNull(),
    );
    expect(applyConfig).toHaveBeenCalledTimes(1);
    const applied = (applyConfig as jest.Mock).mock.calls[0][0];
    expect(applied.coins.part.electrumx).toEqual([
      {url: 'tcp://a:1'},
      {url: 'tcp://b:2', haveverbosetx: false, disabled: true},
    ]);
    expect(applied.coins.btc.electrumx).toEqual([{url: 'tcp://b:2'}]);
  });
});
