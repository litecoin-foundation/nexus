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

// Integers cross from the module as int64 and arrive as bigint, so these are
// not numbers and cannot be mixed with one.
export type MbsxFee = {
  desc: string;
  bps: bigint;
  amount: string;
};

// Absent when the coin has no fee schedule configured. fees_coin names the
// chain they sit on, which follows the role: the initiating chain for a pushed
// swap, the participating one for a bridged swap.
export type MbsxSwapFees = {
  fees?: MbsxFee[];
  fees_coin?: string;
  fees_total?: string;
};

export type SwapRequestDetails = SwapRequestSummary &
  MbsxSwapFees & {
    swapids?: string[];
    error?: string;
  };

export type SwapEvent = {
  [key: string]: any;
};

export type SwapDetails = SwapSummary &
  MbsxSwapFees & {
    // Sats per kvB, not an amount in the coin's scale.
    fee_rate_from: bigint;
    fee_rate_to: bigint;
    // What that rate costs on each chain, estimated from the vsizes the module
    // knows before the transactions exist. Decimal strings, like the amounts.
    chain_fee_from?: string;
    chain_fee_to?: string;
    lock_type: string;
    // Seconds or blocks, per lock_type.
    lock_time_1: bigint;
    lock_time_2: bigint;
    expire_at: string;
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
