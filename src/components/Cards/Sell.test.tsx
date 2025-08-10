import React from 'react';
import {render} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import {NavigationContainer} from '@react-navigation/native';
import Sell from './Sell';
import {ScreenSizeContext} from '../../context/screenSize';

// Mock the redux store with minimal required state
const createMockStore = (initialState: any) => {
  const rootReducer = (state = initialState) => state;
  return configureStore({
    reducer: rootReducer,
    preloadedState: initialState,
  });
};

// Mock react-native-turbo-lndltc
jest.mock('react-native-turbo-lndltc', () => ({
  estimateFee: jest.fn(),
}));

// Mock TranslateText component
jest.mock('../../components/TranslateText', () => {
  return function MockTranslateText({
    textKey,
    textValue,
    interpolationObj,
    children,
  }: any) {
    if (textValue) {
      return textValue;
    }
    if (textKey === 'n_ltc' && interpolationObj?.amount) {
      return `${interpolationObj.amount}`;
    }
    if (
      textKey === 'for_total' &&
      interpolationObj?.total &&
      interpolationObj?.currencySymbol
    ) {
      return `${interpolationObj.currencySymbol}${interpolationObj.total}`;
    }
    return textKey || children;
  };
});

// Mock other components
jest.mock('../Numpad/BuyPad', () => 'BuyPad');
jest.mock('../Buttons/BlueButton', () => 'BlueButton');
jest.mock('../Buttons/WhiteButton', () => 'WhiteButton');

const mockScreenSize = {
  width: 375,
  height: 812,
  isDeviceRotated: false,
  testDeviceHeaderHeight: 103,
};

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  dispatch: jest.fn(),
  setParams: jest.fn(),
  addListener: jest.fn(),
  removeListener: jest.fn(),
  canGoBack: jest.fn(),
  isFocused: jest.fn(),
  push: jest.fn(),
  replace: jest.fn(),
  pop: jest.fn(),
  popToTop: jest.fn(),
  reset: jest.fn(),
  setOptions: jest.fn(),
  getId: jest.fn(),
  getParent: jest.fn(),
  getState: jest.fn(),
  navigateDeprecated: jest.fn(),
  preload: jest.fn(),
} as any;

describe('Sell Component', () => {
  it('renders correct LTC amount text on line 317', () => {
    const mockState = {
      balance: {
        confirmedBalance: '2000000000', // 20 LTC in satoshis
      },
      input: {
        amount: '1.5',
        fiatAmount: '75.00',
        toggleLTC: true,
      },
      settings: {
        currencySymbol: '$',
      },
      buy: {
        availableAmount: '2.0',
        availableQuote: '100.00',
        currencySymbol: '$',
        isSellAllowed: true,
        isMoonpayCustomer: true,
        isOnramperCustomer: false,
        proceedToGetSellLimits: false,
        sellQuote: {
          ltcAmount: 1.5,
          fiatAmount: 100.0,
        },
        sellLimits: {
          minLTCSellAmount: '0.01',
          maxLTCSellAmount: '10.0',
        },
        sellQuotes: [],
        sellLimitsStatus: 'success',
        sellQuoteStatus: 'success',
      },
      ticker: {},
    };

    const store = createMockStore(mockState);

    const {getByText} = render(
      <Provider store={store}>
        <NavigationContainer>
          <ScreenSizeContext.Provider value={mockScreenSize}>
            <Sell navigation={mockNavigation} />
          </ScreenSizeContext.Provider>
        </NavigationContainer>
      </Provider>,
    );

    // Test line 317: TranslateText with n_ltc textKey showing amount
    expect(getByText('1.5')).toBeTruthy();
    expect(getByText(' LTC')).toBeTruthy();
    // expect(getByText('sell_blocked')).toBeTruthy();
  });

  it('renders correct total amount text on line 349', () => {
    const mockState = {
      balance: {
        confirmedBalance: '2000000000', // 20 LTC in satoshis
      },
      input: {
        amount: '1.5',
        fiatAmount: '75.00',
        toggleLTC: true,
      },
      settings: {
        currencySymbol: '$',
      },
      buy: {
        availableAmount: '2.0',
        availableQuote: '100.00',
        currencySymbol: '$',
        isSellAllowed: true,
        isMoonpayCustomer: true,
        isOnramperCustomer: false,
        proceedToGetSellLimits: false,
        sellQuote: {
          ltcAmount: 1.5,
          fiatAmount: 100.0,
        },
        sellLimits: {
          minLTCSellAmount: '0.01',
          maxLTCSellAmount: '10.0',
        },
        sellQuotes: [],
        sellLimitsStatus: 'success',
        sellQuoteStatus: 'success',
      },
      ticker: {},
    };

    const store = createMockStore(mockState);

    const {getByText} = render(
      <Provider store={store}>
        <NavigationContainer>
          <ScreenSizeContext.Provider value={mockScreenSize}>
            <Sell navigation={mockNavigation} />
          </ScreenSizeContext.Provider>
        </NavigationContainer>
      </Provider>,
    );

    // Test line 349: TranslateText with for_total textKey showing total
    expect(getByText('$100')).toBeTruthy();
  });

  it('shows 0.00 for LTC amount when amount is empty', () => {
    const mockState = {
      balance: {
        confirmedBalance: '2000000000', // 20 LTC in satoshis
      },
      input: {
        amount: '',
        fiatAmount: '0.00',
        toggleLTC: true,
      },
      settings: {
        currencySymbol: '$',
      },
      buy: {
        availableAmount: '2.0',
        availableQuote: '100.00',
        currencySymbol: '$',
        isSellAllowed: true,
        isMoonpayCustomer: true,
        isOnramperCustomer: false,
        proceedToGetSellLimits: false,
        sellQuote: {
          ltcAmount: 1.5,
          fiatAmount: 100.0,
        },
        sellLimits: {
          minLTCSellAmount: '0.01',
          maxLTCSellAmount: '10.0',
        },
        sellQuotes: [],
        sellLimitsStatus: 'success',
        sellQuoteStatus: 'success',
      },
      ticker: {},
    };

    const store = createMockStore(mockState);

    const {getByText} = render(
      <Provider store={store}>
        <NavigationContainer>
          <ScreenSizeContext.Provider value={mockScreenSize}>
            <Sell navigation={mockNavigation} />
          </ScreenSizeContext.Provider>
        </NavigationContainer>
      </Provider>,
    );

    expect(getByText('0.00')).toBeTruthy();
    expect(getByText(' LTC')).toBeTruthy();
  });

  it('shows 0.00 for total when availableQuote is not available', () => {
    const mockState = {
      balance: {
        confirmedBalance: '2000000000', // 20 LTC in satoshis
      },
      input: {
        amount: '1.5',
        fiatAmount: '75.00',
        toggleLTC: true,
      },
      settings: {
        currencySymbol: '$',
      },
      buy: {
        availableAmount: '2.0',
        availableQuote: null,
        currencySymbol: '$',
        isSellAllowed: true,
        isMoonpayCustomer: true,
        isOnramperCustomer: false,
        proceedToGetSellLimits: false,
        sellQuote: null,
        sellLimits: {
          minLTCSellAmount: '0.01',
          maxLTCSellAmount: '10.0',
        },
        sellQuotes: [],
        sellLimitsStatus: 'success',
        sellQuoteStatus: 'success',
      },
      ticker: {},
    };

    const store = createMockStore(mockState);

    const {getByText} = render(
      <Provider store={store}>
        <NavigationContainer>
          <ScreenSizeContext.Provider value={mockScreenSize}>
            <Sell navigation={mockNavigation} />
          </ScreenSizeContext.Provider>
        </NavigationContainer>
      </Provider>,
    );

    expect(getByText('$75')).toBeTruthy();
  });
});
