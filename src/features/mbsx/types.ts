export type SwapSummary = {
  id: string;
  created_at: string;
  state: string;
  coin_from: string;
  coin_to: string;
  // Decimal strings in whole coins, matching getSwapInfo.
  amount_from: string;
  amount_to: string;
  initiating: boolean;
  participating: boolean;
};

export type SwapRequestSummary = {
  id: string;
  created_at: string;
  state: string;
  coin_from: string;
  coin_to: string;
  amount_from: string;
  min_amount_to: string;
};

export type SwapRequestDetails = SwapRequestSummary & {
  swapids?: string[];
  error?: string;
};

export type SwapEvent = {
  [key: string]: any;
};

export type SwapDetails = SwapSummary & {
  // Sats per kvB, not an amount in the coin's scale.
  fee_rate_from: number;
  fee_rate_to: number;
  lock_type: string;
  // Seconds or blocks, per lock_type.
  lock_time_1: number;
  lock_time_2: number;
  events?: SwapEvent[];
  error?: string;
};

export type MbsxSettings = {
  bridge_pubkey: string;
  bridge_host: string;
  bridge_port: number;
};

// getInfo is declared as AnyMap in the spec, which cannot describe a record.
export type MbsxInfo = {
  connected: boolean;
  coins: Record<string, {chain_height: number}>;
};

export type MbsxCoinPrices = {
  currency: string;
  updated_at: string;
  prices: Record<string, string>;
};

export type MbsxDrawerParamList = {
  CreateSwap: {scanData?: string} | undefined;
  AddressList: undefined;
  CoinAddresses: {coin: string; scanData?: string};
  SwapList: undefined;
  SwapDetail: {swapId: string};
  RequestList: undefined;
  RequestDetail: {requestId: string};
  MbsxSettings: undefined;
  MbsxDebug: undefined;
};
