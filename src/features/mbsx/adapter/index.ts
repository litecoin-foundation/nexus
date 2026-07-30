import * as RNFS from '@dr.pogodin/react-native-fs';
import NitroBSX from 'react-native-nitro-bsx';

import {fileExists} from '../../../utils/file';
import type {
  MbsxSettings,
  SwapDetails,
  SwapRequestDetails,
  SwapRequestSummary,
  SwapSummary,
} from '../types';

export const MBSX_DATA_DIR = `${RNFS.DocumentDirectoryPath}/mbsx`;

// The module reports "busy" when it could not take its locks. It is not a
// failure: the next onMessage tick retries, so callers keep their last data.
export const BUSY = 'busy';

type MbsxResult<T> = T & {error?: string};

const isBusy = (rv: {error?: string}) => rv.error === BUSY;

export type MbsxConfig = {
  chain: 'mainnet' | 'testnet' | 'regtest';
  debug: boolean;
  bridge_host: string;
  bridge_pubkey: string;
  coins: Record<string, unknown>;
};

export const writeConfig = async (config: MbsxConfig) => {
  if (!(await fileExists(MBSX_DATA_DIR))) {
    await RNFS.mkdir(MBSX_DATA_DIR);
  }
  await RNFS.writeFile(
    `${MBSX_DATA_DIR}/config.json`,
    JSON.stringify(config, null, 2),
  );
};

export const isRunning = () => NitroBSX.isRunning();

export const start = async (config: MbsxConfig) => {
  if (NitroBSX.isRunning()) {
    return;
  }
  await writeConfig(config);
  NitroBSX.setDataDir(MBSX_DATA_DIR);
  NitroBSX.initialise();
};

export const stop = () => {
  if (NitroBSX.isRunning()) {
    NitroBSX.stop();
  }
};

export const getVersion = () => NitroBSX.getVersionString();

export const onMessage = NitroBSX.onMessage;
export const onSettingsChanged = NitroBSX.onSettingsChanged;

// Every read below reaches the native core, which is only safe once
// initialise() has run. Calling before that crashes rather than returning an
// error, so isRunning() gates all of them.
export const listSwaps = (): SwapSummary[] | null => {
  if (!NitroBSX.isRunning()) {
    return null;
  }
  const rv = NitroBSX.listSwaps() as MbsxResult<{swaps?: SwapSummary[]}>;
  if (rv.error) {
    if (!isBusy(rv)) {
      console.error('mbsx listSwaps failed:', rv.error);
    }
    return null;
  }
  return rv.swaps ?? [];
};

export const listRequests = (): SwapRequestSummary[] | null => {
  if (!NitroBSX.isRunning()) {
    return null;
  }
  const rv = NitroBSX.listRequests() as MbsxResult<{
    requests?: SwapRequestSummary[];
  }>;
  if (rv.error) {
    if (!isBusy(rv)) {
      console.error('mbsx listRequests failed:', rv.error);
    }
    return null;
  }
  return rv.requests ?? [];
};

export const getSwapInfo = (swapId: string): SwapDetails | null =>
  NitroBSX.isRunning() ? (NitroBSX.getSwapInfo(swapId) as SwapDetails) : null;

export const getRequestInfo = (
  requestId: string,
): SwapRequestDetails | null =>
  NitroBSX.isRunning()
    ? (NitroBSX.getRequestInfo(requestId) as SwapRequestDetails)
    : null;

export const getSettings = (): MbsxSettings | null =>
  NitroBSX.isRunning() ? (NitroBSX.getSettings() as MbsxSettings) : null;

export const getInfo = () => (NitroBSX.isRunning() ? NitroBSX.getInfo() : null);

export type SwapRequest = {
  coin_from: string;
  coin_to: string;
  amount_from: number;
  amount_to: number;
  address_to: string;
  outputs: string[];
};

export const requestSwap = (request: SwapRequest) =>
  NitroBSX.requestSwap(request) as Promise<MbsxResult<{request_id: string}>>;

export const acceptSwap = (swapId: string) =>
  NitroBSX.acceptSwap(swapId) as Promise<MbsxResult<{}>>;

// WS4 seam. The module asks for a key by id whenever it needs to sign; off
// regtest it has no other source, since getRandomKey is debug-only. Registering
// must happen once before initialise() and outlive every screen, so the store
// lives here rather than in a component.
const keys = new Map<string, string>();

export const registerKey = (key: string) => {
  keys.set(NitroBSX.getKeyID(key), key);
};

export const clearKeys = () => keys.clear();

export const installKeyProvider = () => {
  NitroBSX.setGetKey((keyId: string) => keys.get(keyId) ?? '');
};
