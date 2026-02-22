import {NavigatorScreenParams} from '@react-navigation/native';

export type RootStackParamList = {
  Loading: undefined;
  AuthStack: undefined;
  Onboarding: undefined;
  NewWalletStack: undefined;
};

export type AuthStackParamList = {
  Auth: undefined;
  Forgot: undefined;
  ChangePincode: undefined;
};

export type AlertsStackParamList = {
  Alert: undefined;
  Dial: {identifier: string};
};

export type MainDrawerParamList = {
  MainScreen: {
    scanData?: string;
    isInitial?: boolean;
    activeCard?: number;
  };
};

export type NewWalletStackParamList = {
  Main: NavigatorScreenParams<MainDrawerParamList>;
  SettingsStack: undefined;
  NexusShopStack: undefined;
  AlertsStack: undefined;
  Scan: {
    returnRoute: string;
    returnScreen?: string;
  };
  WebPage: {
    uri: string;
    observeURL?: string;
    returnRoute?: string;
  };
  SearchTransaction: {
    openFilter?: string;
  };
  ConfirmSend: {
    sendAll?: boolean;
  };
  SuccessSend: {
    txid: string;
  };
  ConfirmBuy: {
    [key: string]: any;
  };
  ConfirmBuyOnramper: {
    [key: string]: any;
  };
  ConfirmSell: {
    [key: string]: any;
  };
  ConfirmSellOnramper: {
    [key: string]: any;
  };
  ConfirmConvert: {
    isRegular: boolean;
    regularAmount: string;
    privateAmount: string;
    regularConfirmedBalance: string;
    privateConfirmedBalance: string;
  };
  SuccessConvert: {
    txid: string;
    amount: number;
    isRegular: boolean;
  };
};

export type OnboardingStackParamList = {
  Initial: undefined;
  InitialWithSeed: {
    existingSeed: string;
  };
  Pin: undefined;
  RecoverPin: undefined;
  Generate: undefined;
  Verify: undefined;
  Recover:
    | {
        existingSeed?: string;
      }
    | undefined;
  Biometric: undefined;
  Welcome: undefined;
};

export type SettingsStackParamList = {
  Settings: {
    updateHeader?: boolean;
  };
  ChangePincode: undefined;
  Seed: undefined;
  RootKey: undefined;
  About: undefined;
  Currency: undefined;
  Explorer: undefined;
  Language: undefined;
  Products: undefined;
  Scan: {
    returnRoute: string;
    returnScreen?: string;
  };
  Import: {
    scanData?: string;
  };
  ImportSuccess: {
    txHash: string;
  };
  ImportDeeplink: {
    scanData?: string;
  };
  RecoverLitewallet: undefined;
  Support: undefined;
  ResetWallet: undefined;
  TestPayment: undefined;
  Tor: undefined;
  LitecoinBackend: undefined;
  ExportElectrum: undefined;
};
