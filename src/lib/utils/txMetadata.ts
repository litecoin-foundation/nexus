import {
  OutputScriptType,
  PreviousOutPoint,
} from 'react-native-turbo-lnd/protos/lightning_pb';
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

// nexus-api trade interface
export type ITrade = {
  userAppUniqueId: string;
  provider: ProviderTypes;
  providerTxId: string;
  type: TxTypeTypes;
  amountInLTC: number;
  priceInFiat: number;
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
  txHash: string;
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
  // moonpayMeta: MoonpayMetaType;
  // onramperMeta: OnramperMetaType;
  tradeTx: ITrade;
};

export type MoonpayMetaType = {
  id: string;
  cryptoTransactionId: string | null;
  createdAt: string;
  updatedAt: string | null;
  walletAddress: string | null;
  baseCurrency: string | null;
  quoteCurrency: string | null;
  baseCurrencyAmount: number | null;
  quoteCurrencyAmount: number | null;
  usdRate: number | null;
  eurRate: number | null;
  gbpRate: number | null;
  areFeesIncluded: boolean | null;
  networkFeeAmount: number | null;
  feeAmount: number | null;
  feeAmountDiscount: number | null;
  extraFeeAmount: number | null;
  extraFeeAmountDiscount: number | null;
  returnUrl: string | null;
  status: string | null;
  country: string | null;
  cardType: string | null;
} | null;

export type OnramperMetaType = {
  onrampTransactionId: string;
  transactionHash: string;
  statusDate: string;
  walletAddress: string;
  sourceCurrency: string;
  targetCurrency: string;
  inAmount: number;
  outAmount: number;
  partnerContext: string;
  status: string;
  country: string;
  onramp: string;
  paymentMethod: string;
} | null;

// type CombinedMetaType = {
//   moonpayMeta: MoonpayMetaType;
//   onramperMeta: OnramperMetaType;
// };

export type DisplayedMetadataType = {
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
  totalFee: number;
  blockchainFee: number;
  tipLFFee: number;
  providerFee: number;
  txDetailsUrl: string;
  status: string;
  country: string;
  paymentMethod: string;
} | null;

// const moonpayBuyTxProjection = (tx: any): MoonpayMetaType => {
//   return {
//     id: tx.id,
//     cryptoTransactionId: tx.cryptoTransactionId || null,
//     createdAt: tx.createdAt,
//     updatedAt: tx.updatedAt || null,
//     walletAddress: tx.walletAddress || null,
//     baseCurrency: tx.baseCurrency.code || null, // fiat
//     quoteCurrency: tx.currency.code || null, // ltc
//     baseCurrencyAmount: tx.baseCurrencyAmount || null, // fiat
//     quoteCurrencyAmount: tx.quoteCurrencyAmount || null, // ltc
//     usdRate: tx.usdRate || null,
//     eurRate: tx.eurRate || null,
//     gbpRate: tx.gbpRate || null,
//     areFeesIncluded: tx.areFeesIncluded || null,
//     networkFeeAmount: tx.networkFeeAmount || null,
//     feeAmount: tx.feeAmount || null,
//     feeAmountDiscount: tx.feeAmountDiscount || null,
//     extraFeeAmount: tx.extraFeeAmount || null,
//     extraFeeAmountDiscount: tx.extraFeeAmountDiscount || null,
//     returnUrl: tx.returnUrl,
//     status: tx.status || null,
//     country: tx.country || null,
//     cardType: tx.cardType || null,
//   };
// };

// const moonpaySellTxProjection = (tx: any): MoonpayMetaType => {
//   return {
//     id: tx.id,
//     cryptoTransactionId: tx.depositHash || null,
//     createdAt: tx.createdAt,
//     updatedAt: tx.updatedAt || null,
//     walletAddress: null,
//     baseCurrency: tx.baseCurrency.code || null, // ltc
//     quoteCurrency: tx.quoteCurrency.code || null, // fiat
//     baseCurrencyAmount: tx.baseCurrencyAmount || null, // ltc
//     quoteCurrencyAmount: tx.quoteCurrencyAmount || null, // fiat
//     usdRate: tx.usdRate || null,
//     eurRate: tx.eurRate || null,
//     gbpRate: tx.gbpRate || null,
//     areFeesIncluded: null,
//     networkFeeAmount: null,
//     feeAmount: tx.feeAmount || null,
//     feeAmountDiscount: null,
//     extraFeeAmount: tx.extraFeeAmount || null,
//     extraFeeAmountDiscount: null,
//     returnUrl: null,
//     status: tx.status || null,
//     country: tx.country || null,
//     cardType: null,
//   };
// };

// const onramperBuyTxProjection = (tx: any): OnramperMetaType => {
//   return {
//     onrampTransactionId: tx.onrampTransactionId,
//     transactionHash: tx.transactionHash,
//     statusDate: tx.statusDate,
//     walletAddress: tx.walletAddress,
//     sourceCurrency: tx.sourceCurrency,
//     targetCurrency: tx.targetCurrency,
//     inAmount: tx.inAmount,
//     outAmount: tx.outAmount,
//     partnerContext: tx.partnerContext,
//     status: tx.status,
//     country: tx.country,
//     onramp: tx.onramp,
//     paymentMethod: tx.paymentMethod,
//   };
// };

// const onramperSellTxProjection = (tx: any): OnramperMetaType => {
//   return onramperBuyTxProjection(tx);
// };

export const decodedTxMetadataProjection = (
  trade: ITrade,
  priceOnDate: number,
): IDecodedTx => {
  const projectedObj = {
    txHash: trade.metadata?.txId || null,
    blockHash: '',
    blockHeight: 0,
    amount: trade.amountInLTC * 100000000 || 0,
    numConfirmations: trade.metadata?.confirmations || 0,
    timeStamp: trade.metadata?.createdAt || trade.metadata?.updatedAt || '',
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
): DisplayedMetadataType => {
  const projectedObj = {
    providerTxId: trade.providerTxId,
    cryptoTxId: trade.metadata?.txId || '',
    createdAt: trade.metadata?.createdAt || trade.metadata?.updatedAt || '',
    updatedAt: trade.metadata?.updatedAt || trade.metadata?.createdAt || '',
    walletAddress: trade.metadata?.walletAddress || '',
    cryptoCurrency: trade.metadata?.crypto || 'ltc',
    fiatCurrency: trade.metadata?.fiat || 'unknown',
    cryptoCurrencyAmount: trade.amountInLTC || 0,
    fiatCurrencyAmount: trade.priceInFiat || 0,
    usdRate: trade.metadata?.usdRate || 0,
    eurRate: trade.metadata?.eurRate || 0,
    gbpRate: trade.metadata?.gbpRate || 0,
    totalFee:
      Number(trade.metadata?.networkFeeAmount) +
        Number(trade.metadata?.extraFeeAmount) +
        Number(trade.metadata?.feeAmount) || -1,
    blockchainFee: Number(trade.metadata?.networkFeeAmount) || -1,
    tipLFFee: Number(trade.metadata?.extraFeeAmount) || -1,
    providerFee: Number(trade.metadata?.feeAmount) || -1,
    // txDetailsUrl: `${providerMeta.returnUrl}?transactionId=${providerMeta.id}`,
    txDetailsUrl: trade.metadata?.txDetailsUrl,
    status: trade.status || 'unknown',
    country: trade.metadata?.country || 'unknown',
    paymentMethod: trade.metadata?.cardType || 'unknown',
  };

  return projectedObj;
};

// Old tx data projection (separate for each tx provider)
// used when nexus-api returns raw data
// export const displayedTxMetadataProjection = (
//   providerMetaCollection: any,
//   txType: TxTypeTypes,
// ): DisplayedMetadataType => {
//   let projectedObj = null;

//   Object.keys(providerMetaCollection).forEach((providerKeyName: any) => {
//     const providerMeta = providerMetaCollection[providerKeyName];
//     if (providerMeta) {
//       switch (providerKeyName) {
//         case 'Moonpay':
//           projectedObj = {
//             providerTxId: providerMeta.id,
//             cryptoTxId: providerMeta.cryptoTransactionId || '',
//             createdAt: providerMeta.createdAt,
//             updatedAt: providerMeta.updatedAt,
//             walletAddress: providerMeta.walletAddress || '',
//             cryptoCurrency:
//               txType === 'sell'
//                 ? providerMeta.baseCurrency || 'ltc'
//                 : providerMeta.quoteCurrency || 'ltc',
//             fiatCurrency:
//               txType === 'sell'
//                 ? providerMeta.quoteCurrency || 'unknown'
//                 : providerMeta.baseCurrency || 'unknown',
//             cryptoCurrencyAmount:
//               txType === 'sell'
//                 ? providerMeta.baseCurrencyAmount || 0
//                 : providerMeta.quoteCurrencyAmount || 0,
//             fiatCurrencyAmount:
//               txType === 'sell'
//                 ? providerMeta.quoteCurrencyAmount || 0
//                 : providerMeta.baseCurrencyAmount || 0,
//             usdRate: providerMeta.usdRate || 0,
//             eurRate: providerMeta.eurRate || 0,
//             gbpRate: providerMeta.gbpRate || 0,
//             totalFee:
//               Number(providerMeta.networkFeeAmount) +
//               Number(providerMeta.extraFeeAmount) +
//               Number(providerMeta.feeAmount),
//             blockchainFee: Number(providerMeta.networkFeeAmount),
//             tipLFFee: Number(providerMeta.extraFeeAmount),
//             providerFee: Number(providerMeta.feeAmount),
//             txDetailsUrl: `${providerMeta.returnUrl}?transactionId=${providerMeta.id}`,
//             status: providerMeta.status || 'unknown',
//             country: providerMeta.country || 'unknown',
//             paymentMethod: providerMeta.cardType || 'unknown',
//           };
//           break;
//         case 'Onramper':
//           projectedObj = {
//             providerTxId: providerMeta.onrampTransactionId,
//             cryptoTxId: providerMeta.transactionHash || '',
//             createdAt: providerMeta.statusDate,
//             updatedAt: providerMeta.statusDate,
//             walletAddress: providerMeta.walletAddress || '',
//             cryptoCurrency:
//               txType === 'sell'
//                 ? providerMeta.sourceCurrency || 'ltc'
//                 : providerMeta.targetCurrency || 'ltc',
//             fiatCurrency:
//               txType === 'sell'
//                 ? providerMeta.targetCurrency || 'unknown'
//                 : providerMeta.sourceCurrency || 'unknown',
//             cryptoCurrencyAmount:
//               txType === 'sell'
//                 ? providerMeta.inAmount || 0
//                 : providerMeta.outAmount || 0,
//             fiatCurrencyAmount:
//               txType === 'sell'
//                 ? providerMeta.outAmount || 0
//                 : providerMeta.inAmount || 0,
//             usdRate: 0,
//             eurRate: 0,
//             gbpRate: 0,
//             totalFee: 0,
//             blockchainFee: 0,
//             tipLFFee: 0,
//             providerFee: 0,
//             // TODO: onramper details url?
//             txDetailsUrl: 'onramper' + providerMeta.onrampTransactionId,
//             status: providerMeta.status || 'unknown',
//             country: providerMeta.country || 'unknown',
//             paymentMethod: providerMeta.paymentMethod || 'unknown',
//           };
//           break;
//         default:
//           break;
//       }
//     }
//   });

//   return projectedObj;
// };

// export const getMoonpayTxMetadata = (
//   tx: any,
//   txType: TxTypeTypes,
// ): MoonpayMetaType => {
//   const metaObj =
//     txType === 'buy' ? moonpayBuyTxProjection(tx) : moonpaySellTxProjection(tx);
//   return metaObj;
// };

// export const getOnramperTxMetadata = (
//   tx: any,
//   txType: TxTypeTypes,
// ): OnramperMetaType => {
//   const metaObj =
//     txType === 'buy'
//       ? onramperBuyTxProjection(tx)
//       : onramperSellTxProjection(tx);
//   return metaObj;
// };

// export const getTxCombinedMetadata = (
//   tx: any,
//   provider: ProviderTypes,
//   txType: TxTypeTypes,
// ): CombinedMetaType => {
//   let moonpayMetaObj: any = null;
//   let onramperMetaObj: any = null;
//   switch (provider) {
//     case 'Moonpay':
//       moonpayMetaObj =
//         txType === 'buy'
//           ? moonpayBuyTxProjection(tx)
//           : moonpaySellTxProjection(tx);
//       break;
//     case 'Onramper':
//       onramperMetaObj =
//         txType === 'buy'
//           ? onramperBuyTxProjection(tx)
//           : onramperSellTxProjection(tx);
//       break;
//     default:
//       break;
//   }
//   return {
//     moonpayMeta: moonpayMetaObj,
//     onramperMeta: onramperMetaObj,
//   };
// };
