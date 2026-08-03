export type SwapSummary = {
  id: string;
  created_at: string;
  state: string;
  coin_from: string;
  coin_to: string;
  amount_from: string;
  amount_to: string;
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
  initiating?: boolean;
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

export type MbsxDrawerParamList = {
  CreateSwap: undefined;
  SwapList: undefined;
  SwapDetail: {swapId: string};
  RequestList: undefined;
  RequestDetail: {requestId: string};
  MbsxSettings: undefined;
  MbsxDebug: undefined;
};
