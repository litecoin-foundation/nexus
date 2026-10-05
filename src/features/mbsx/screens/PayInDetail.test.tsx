import React from 'react';
import {render} from '@testing-library/react-native';

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

jest.mock('../adapter', () => ({
  cancelDeposit: jest.fn(),
  getCoinPrices: () => null,
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

const renderScreen = (shown: Deposit) => {
  jest.requireMock('../adapter').listDeposits.mockReturnValue([shown]);
  return render(
    <ScreenSizeContext.Provider value={screenSize as any}>
      <PayInDetail navigation={navigation as any} route={route} />
    </ScreenSizeContext.Provider>,
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
});
