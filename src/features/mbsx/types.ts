export type SwapSummary = {
  id: string;
  request_id: string;
  created_at: string;
  state: string;
  coin_from: string;
  coin_to: string;
  // Decimal strings in whole coins, matching getSwapInfo.
  amount_from: string;
  amount_to: string;
  kind?: OfferKind;
  initiating: boolean;
  participating: boolean;
};

export type SwapRequestSummary = {
  id: string;
  created_at: string;
  expire_at: string;
  state: string;
  coin_from: string;
  coin_to: string;
  amount_from: string;
  min_amount_to: string;
};

export type Deposit = {
  deposit_id: string;
  coin: string;
  address: string;
  state: string;
  amount_due: string;
  received: string;
  refund_address: string;
  coin_to: string;
  min_amount_to: string;
  address_to: string;
  created_at: bigint;
  expire_at: bigint;
  request_id?: string;
  sweep_txid?: string;
};

// Integers cross from the module as int64 and arrive as bigint, so these are
// not numbers and cannot be mixed with one.
export type MbsxFee = {
  desc: string;
  bps: bigint;
  amount: string;
};

// Absent when the coin has no fee schedule configured. fees_coin names the
// chain they sit on, which follows the role the offer assigns: our initiating
// chain when initiating, the participating one when not.
export type MbsxSwapFees = {
  fees?: MbsxFee[];
  fees_coin?: string;
  fees_total?: string;
};

export type OfferKind = 'PRIVATE' | 'BRIDGED';

// An offer to accept. A bridged offer's amounts are what its rate would mean for
// the request, not the network offer's own size.
export type SwapOffer = {
  id: string;
  kind: OfferKind;
  expire_at: string;
  accepted: boolean;
  state: 'RECEIVED' | 'REVOKED' | 'REJECTED';
  coin_send: string;
  coin_receive: string;
  amount_send: string;
  amount_receive: string;
  // Absent when the server had no price.
  market_amount_receive?: string;
  // Bridged only: the server's record of the offerer, its address and 0-100
  // from what the server has seen of it, 50 for one it has not.
  offerer_address?: string;
  offerer_reliability?: bigint;
};

export type SwapRequestDetails = SwapRequestSummary &
  MbsxSwapFees & {
    swapids?: string[];
    // Any swap under the request in a state the module counts as in progress.
    swaps_active?: boolean;
    offers?: SwapOffer[];
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
  db_version?: number;
  // Only the coins config enabled; compiled_coins is every one the build has.
  coins: Record<
    string,
    {
      chain_height: number;
      bridge_supported: boolean;
      anchor_dispute?: {
        url: string;
        height: number;
        source: 'glue' | 'database';
      };
    }
  >;
  compiled_coins?: string[];
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
  PayInDetail: {depositId: string};
  MbsxSettings: undefined;
  MbsxDebug: undefined;
};
