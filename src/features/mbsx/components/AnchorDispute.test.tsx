import React from 'react';
import {Alert} from 'react-native';
import {act, fireEvent, render, waitFor} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';

import mbsxReducer from '../mbsxSlice';
import AnchorDispute from './AnchorDispute';
import {
  applyConfig,
  coinsWithActiveSwaps,
  dismissDispute,
  getInfo,
  onMessage,
  readConfig,
  readDismissedDisputes,
} from '../adapter';

jest.mock('../adapter', () => ({
  applyConfig: jest.fn(() => Promise.resolve()),
  coinsWithActiveSwaps: jest.fn(() => new Set()),
  dismissDispute: jest.fn(() => Promise.resolve()),
  getInfo: jest.fn(),
  isRunning: jest.fn(() => true),
  onMessage: jest.fn(() => ({remove: jest.fn()})),
  readConfig: jest.fn(),
  readDismissedDisputes: jest.fn(() => Promise.resolve([])),
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

const renderBanner = async () => {
  const store = configureStore({reducer: {mbsx: mbsxReducer}});
  store.dispatch({type: 'mbsx/setRunning', payload: true});
  const screen = render(
    <Provider store={store}>
      <AnchorDispute />
    </Provider>,
  );
  await act(async () => {});
  return screen;
};

describe('AnchorDispute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (readConfig as jest.Mock).mockResolvedValue(config);
  });

  it('shows a dispute once a message reports one', async () => {
    (getInfo as jest.Mock).mockReturnValue({
      connected: true,
      coins: {PART: {chain_height: 10, bridge_supported: true}},
    });
    const {getByText, queryByTestId} = await renderBanner();
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
    const {getByTestId, getByText, queryByTestId} = await renderBanner();
    getByText('PART server tcp://b:2 disagrees with the swap server');

    fireEvent.press(getByTestId('mbsx-anchor-dispute-disable-PART'));
    await waitFor(() => expect(alert).toHaveBeenCalled());
    expect(applyConfig).not.toHaveBeenCalled();
    expect(alert.mock.calls[0][1]).toContain('Either may be wrong');
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

  it('names the stored chain when that is what disagrees', async () => {
    (getInfo as jest.Mock).mockReturnValue({
      ...disputed,
      coins: {
        ...disputed.coins,
        PART: {
          ...disputed.coins.PART,
          anchor_dispute: {url: 'tcp://b:2', height: 5, source: 'database'},
        },
      },
    });
    const {getByText} = await renderBanner();
    getByText(
      'PART server tcp://b:2 disagrees with the chain stored on this device',
    );
  });

  it('dismisses a dispute until another comes up', async () => {
    (getInfo as jest.Mock).mockReturnValue(disputed);
    const {getByTestId, queryByTestId} = await renderBanner();
    fireEvent.press(getByTestId('mbsx-anchor-dispute-dismiss-PART'));
    expect(queryByTestId('mbsx-anchor-dispute-disable-PART')).toBeNull();
    expect(dismissDispute).toHaveBeenCalledWith('PART tcp://b:2 5 glue');

    (getInfo as jest.Mock).mockReturnValue({
      ...disputed,
      coins: {
        ...disputed.coins,
        PART: {
          ...disputed.coins.PART,
          anchor_dispute: {url: 'tcp://b:2', height: 6, source: 'glue'},
        },
      },
    });
    const load = (onMessage as jest.Mock).mock.calls[0][0];
    act(() => load({type: 'error', data: ''}));
    getByTestId('mbsx-anchor-dispute-disable-PART');
  });

  it('stays dismissed when the banner comes back', async () => {
    (getInfo as jest.Mock).mockReturnValue(disputed);
    (readDismissedDisputes as jest.Mock).mockResolvedValueOnce([
      'PART tcp://b:2 5 glue',
    ]);
    const first = await renderBanner();
    expect(first.queryByTestId('mbsx-anchor-dispute-disable-PART')).toBeNull();
    first.unmount();

    (getInfo as jest.Mock).mockReturnValue({
      ...disputed,
      coins: {
        ...disputed.coins,
        PART: {
          ...disputed.coins.PART,
          anchor_dispute: {url: 'tcp://b:2', height: 5, source: 'database'},
        },
      },
    });
    (readDismissedDisputes as jest.Mock).mockResolvedValueOnce([
      'PART tcp://b:2 5 glue',
    ]);
    const second = await renderBanner();
    second.getByTestId('mbsx-anchor-dispute-disable-PART');
  });

  it('refuses to disable the only enabled server', async () => {
    (getInfo as jest.Mock).mockReturnValue({
      connected: true,
      coins: {
        BTC: {
          chain_height: 10,
          bridge_supported: true,
          anchor_dispute: {url: 'tcp://b:2', height: 5, source: 'glue'},
        },
      },
    });
    const alert = jest.spyOn(Alert, 'alert');
    const {getByTestId} = await renderBanner();
    fireEvent.press(getByTestId('mbsx-anchor-dispute-disable-BTC'));
    await waitFor(() => expect(alert).toHaveBeenCalled());
    expect(alert.mock.calls[0][1]).toContain('the only BTC server enabled');
    expect(alert.mock.calls[0][2]).toBeUndefined();
    expect(applyConfig).not.toHaveBeenCalled();
  });

  it('warns before changing servers during a swap', async () => {
    (getInfo as jest.Mock).mockReturnValue(disputed);
    (coinsWithActiveSwaps as jest.Mock).mockReturnValueOnce(new Set(['PART']));
    const alert = jest.spyOn(Alert, 'alert');
    const {getByTestId} = await renderBanner();
    fireEvent.press(getByTestId('mbsx-anchor-dispute-disable-PART'));
    await waitFor(() => expect(alert).toHaveBeenCalled());
    expect(alert.mock.calls[0][1]).toContain('A PART swap is in progress');
  });

  it('drops a dispute whose server is no longer enabled', async () => {
    (getInfo as jest.Mock).mockReturnValue(disputed);
    (readConfig as jest.Mock).mockResolvedValue({
      ...config,
      coins: {
        ...config.coins,
        part: {
          enabled: true,
          electrumx: [{url: 'tcp://a:1'}, {url: 'tcp://b:2', disabled: true}],
        },
      },
    });
    const alert = jest.spyOn(Alert, 'alert');
    const {getByTestId, queryByTestId} = await renderBanner();
    fireEvent.press(getByTestId('mbsx-anchor-dispute-disable-PART'));
    await waitFor(() => expect(alert).toHaveBeenCalled());
    expect(alert.mock.calls[0][1]).toContain(
      'no longer an enabled PART server',
    );
    expect(queryByTestId('mbsx-anchor-dispute-disable-PART')).toBeNull();
    expect(dismissDispute).toHaveBeenCalledWith('PART tcp://b:2 5 glue');
    expect(applyConfig).not.toHaveBeenCalled();
  });
});
