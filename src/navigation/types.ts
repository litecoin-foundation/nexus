export type NewWalletStackParamList = {
  Main: {
    scanData?: string;
    isInitial?: boolean;
    updateHeader?: boolean;
  };
  SettingsStack: undefined;
  AlertsStack: undefined;
  Scan: {
    returnRoute: string;
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
};

export type OnboardingStackParamList = {
  Initial: undefined;
  InitialWithSeed: {
    existingSeed: string;
  };
  Pin: undefined;
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
  Settings: undefined;
  ChangePincode: undefined;
  Seed: undefined;
  About: undefined;
  Currency: undefined;
  Explorer: undefined;
  Language: undefined;
  Scan: {
    returnRoute: string;
  };
  Import: {
    scanData?: string;
  };
  RecoverLitewallet: undefined;
  ImportSuccess: {
    txHash: string;
  };
  Support: undefined;
  ResetWallet: undefined;
  TestPayment: undefined;
};
