import {
  OutputScriptType,
  PreviousOutPoint,
} from 'react-native-turbo-lndltc/protos/lightning_pb';

// nexus-api compatible interfaces
type ProviderTypes = 'Moonpay' | 'Onramper';

type TxTypeTypes = 'buy' | 'sell';

type StatusTypes =
  | 'completed'
  | 'failed'
  | 'pending'
  | 'canceled'
  | 'cancelled'
  | 'new'
  | 'paid';

export type ITrade = {
  userAppUniqueId: string;
  provider: ProviderTypes;
  providerTxId: string;
  cryptoTxId: string;
  type: TxTypeTypes;
  amountInLTC: number;
  priceInFiat: number;
  fiatCurrency: string;
  status: StatusTypes;
  metadata: any | undefined;
};

type IOutputDetails = {
  address: string;
  amount: Number;
  isOurAddress: boolean;
  outputIndex: number;
  outputType: OutputScriptType;
  pkScript: string;
};

export type IDecodedTx = {
  txHash: string | null;
  blockHash: string;
  blockHeight: number;
  amount: number;
  numConfirmations: number;
  timeStamp: string;
  fee: number;
  outputDetails: IOutputDetails[];
  previousOutpoints: PreviousOutPoint[];
  label: string | null | undefined;
  metaLabel: string;
  priceOnDate: number | null;
  tradeTx: ITrade;
};

export type BuySellMetadataType = {
  providerTxId: string;
  cryptoTxId: string;
  createdAt: string;
  updatedAt: string;
  walletAddress: string;
  cryptoCurrency: string;
  fiatCurrency: string;
  cryptoCurrencyAmount: number;
  fiatCurrencyAmount: number;
  usdRate: number;
  eurRate: number;
  gbpRate: number;
  totalFee: number | 'unknown';
  blockchainFee: number | 'unknown';
  tipLFFee: number | 'unknown';
  providerFee: number | 'unknown';
  txDetailsUrl: string;
  status: string;
  country: string;
  paymentMethod: string;
};

export type ConvertMetadataType = {
  conversionType: 'regular' | 'private';
  destinationAddress: string;
  targetAmount: number;
  timestamp: number;
  selectedUtxos: Array<{
    address?: string;
    amountSat: number;
    addressType: number;
  }>;
  mergedInputDetails?: any[];
  mergedOutputDetails?: any[];
  sendTxHash?: string;
  receiveTxHash?: string;
};

export type DisplayedMetadataType = BuySellMetadataType | ConvertMetadataType | null;

// Type guard functions
export function isBuySellMetadata(meta: DisplayedMetadataType): meta is BuySellMetadataType {
  return meta !== null && 'providerTxId' in meta;
}

export function isConvertMetadata(meta: DisplayedMetadataType): meta is ConvertMetadataType {
  return meta !== null && 'conversionType' in meta;
}

export const decodedTxMetadataProjection = (
  trade: ITrade,
  priceOnDate: number,
): IDecodedTx => {
  const projectedObj = {
    txHash: trade.cryptoTxId || null,
    blockHash: '',
    blockHeight: 0,
    amount: trade.amountInLTC * 100000000 || 0,
    numConfirmations:
      trade.status === 'completed' || trade.status === 'paid'
        ? 7
        : trade.status === 'pending'
          ? 6
          : 0,
    timeStamp:
      String(
        Number.parseInt(
          String(Date.parse(trade.metadata?.createdAt) / 1000),
          10,
        ),
      ) ||
      String(
        Number.parseInt(
          String(Date.parse(trade.metadata?.updatedAt) / 1000),
          10,
        ),
      ) ||
      '',
    fee: trade.metadata?.networkFeeAmount,
    outputDetails: [],
    previousOutpoints: [],
    label: '',
    metaLabel: trade.type === 'buy' ? 'Buy' : 'Sell',
    priceOnDate,
    tradeTx: trade,
  };

  return projectedObj;
};

export const displayedTxMetadataProjection = (
  trade: ITrade,
): BuySellMetadataType => {
  const projectedObj = {
    providerTxId: trade.providerTxId,
    cryptoTxId: trade.cryptoTxId || '',
    createdAt: trade.metadata?.createdAt || trade.metadata?.updatedAt || '',
    updatedAt: trade.metadata?.updatedAt || trade.metadata?.createdAt || '',
    walletAddress: trade.metadata?.walletAddress || '',
    cryptoCurrency: trade.metadata?.crypto || 'ltc',
    fiatCurrency: trade.fiatCurrency || 'unknown',
    cryptoCurrencyAmount: trade.amountInLTC || 0,
    fiatCurrencyAmount: trade.priceInFiat || 0,
    usdRate: trade.metadata?.usdRate || 0,
    eurRate: trade.metadata?.eurRate || 0,
    gbpRate: trade.metadata?.gbpRate || 0,
    totalFee:
      Number(trade.metadata?.networkFeeAmount || 0) +
        Number(trade.metadata?.extraFeeAmount || 0) +
        Number(trade.metadata?.feeAmount) || ('unknown' as 'unknown'),
    blockchainFee:
      Number(trade.metadata?.networkFeeAmount) || ('unknown' as 'unknown'),
    tipLFFee:
      Number(trade.metadata?.extraFeeAmount) || ('unknown' as 'unknown'),
    providerFee: Number(trade.metadata?.feeAmount) || ('unknown' as 'unknown'),
    txDetailsUrl: trade.metadata?.txDetailsUrl,
    status: trade.status || 'unknown',
    country: trade.metadata?.country || 'unknown',
    paymentMethod: trade.metadata?.cardType || 'unknown',
  };

  return projectedObj;
};

// from iso to timestamp
export const getUTCTimeStampFromMetadata = (
  tradeMetadata: ITrade['metadata'],
): string => {
  return (
    String(
      Number.parseInt(String(Date.parse(tradeMetadata?.createdAt) / 1000), 10),
    ) ||
    String(
      Number.parseInt(String(Date.parse(tradeMetadata?.updatedAt) / 1000), 10),
    ) ||
    ''
  );
};
