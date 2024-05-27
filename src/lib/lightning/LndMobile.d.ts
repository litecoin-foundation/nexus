export enum ELndMobileStatusCodes {
  STATUS_SERVICE_BOUND = 1,
  STATUS_PROCESS_STARTED = 2,
  STATUS_WALLET_UNLOCKED = 4,
}

export interface ILndMobile {
  // General
  initialize(): Promise<{data: string}>;
  startLnd(torEnabled: boolean, args?: string): Promise<{data: string}>;
  stopLnd(): Promise<{data: string}>;
  initWallet(
    seed: string[],
    password: string,
    recoveryWindow: number,
    channelBackupsBase64: string | null,
  ): Promise<{data: string}>;
  unlockWallet(password: string): Promise<{data: string}>;

  checkStatus(): Promise<ELndMobileStatusCodes>;

  // Send gRPC LND API request
  sendCommand(method: string, base64Payload: string): Promise<{data: string}>;
  sendStreamCommand(
    method: string,
    base64Payload: string,
    streamOnlyOnce: boolean,
  ): Promise<'done'>;
  sendBidiStreamCommand(
    method: string,
    streamOnlyOnce: boolean,
  ): Promise<'done'>;
  writeToStream(method: string, payload: string): Promise<boolean>;

  // Android-specific
  unbindLndMobileService(): Promise<void>; // TODO(hsjoberg): function looks broken
  sendPongToLndMobileservice(): Promise<{data: string}>;
  checkLndMobileServiceConnected(): Promise<boolean>;
  gossipSync(networkType: string): Promise<{data: string}>;
}

export type WorkInfo =
  | 'BLOCKED'
  | 'CANCELLED'
  | 'ENQUEUED'
  | 'FAILED'
  | 'RUNNING'
  | 'SUCCEEDED'
  | 'WORK_NOT_EXIST';

declare module 'react-native' {
  interface NativeModulesStatic {
    LndMobile: ILndMobile;
  }
}
