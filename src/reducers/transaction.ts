import {createAction, createSelector, createSlice} from '@reduxjs/toolkit';
import {
  getTransactions as getLndTransactions,
  sendCoins,
  subscribeTransactions as subscribeLndTransactions,
  walletKitLabelTransaction,
} from 'react-native-turbo-lnd';
import {
  GetTransactionsRequestSchema,
  OutputScriptType,
  PreviousOutPoint,
} from 'react-native-turbo-lnd/protos/lightning_pb';
import {create} from '@bufbuild/protobuf';

import {AppThunk} from './types';
import {formatDate, formatTime} from '../lib/utils/date';
import {getBalance} from './balance';

// types
type IDecodedTx = {
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
  priceOnDateMeta: number | null;
  moonpayMeta: {
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
};

export type IDisplayedTx = {
  hash: string;
  isMweb: boolean;
  blockHash: string;
  blockHeight: number;
  amount: number;
  confs: number;
  day: string;
  time: Date;
  timestamp: number;
  fee: number;
  lightning: boolean;
  myOutputs: string[];
  otherOutputs: string[];
  label: string | null | undefined;
  metaLabel: string;
  priceOnDateMeta: number;
  moonpayMeta: {
    moonpayTxId: string;
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
    moonpayFee: number;
    txDetailsUrl: string;
    status: string;
    country: string;
    paymentMethod: string;
  } | null;
  renderIndex: number;
};

type IOutputDetails = {
  address: string;
  amount: Number;
  isOurAddress: boolean;
  outputIndex: number;
  outputType: OutputScriptType;
  pkScript: string;
};

interface ITx {
  txSubscriptionStarted: boolean;
  transactions: IDecodedTx[];
}

// initial state
const initialState = {
  txSubscriptionStarted: false,
  transactions: [],
  invoices: [],
  memos: [],
} as ITx;

// actions
const getTransactionsAction = createAction<IDecodedTx[]>(
  'transaction/getTransactionsAction',
);
const txSubscriptionStartedAction = createAction<boolean>(
  'transaction/txSubscriptionStartedAction',
);

// functions
const getPriceOnDate = (timestamp: number): Promise<number | null> => {
  return new Promise(async (resolve, reject) => {
    try {
      const res = await fetch(
        'https://api.nexuswallet.com/api/prices/dateprice',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            timestamp,
          }),
        },
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error);
      }

      const data = await res.json();

      if (data.hasOwnProperty('datePrice')) {
        resolve(data.datePrice);
      } else {
        resolve(null);
      }
    } catch (error) {
      reject(error);
    }
  });
};

const changeEndianness = (string: string) => {
  const result = [];
  let len = string.length - 2;
  while (len >= 0) {
    result.push(string.substr(len, 2));
    len -= 2;
  }
  return result.join('');
};

export const labelTransaction = (txid: string, label: string) => async () => {
  try {
    const reversedId = changeEndianness(txid);
    const idBytes = Uint8Array.from(Buffer.from(reversedId, 'hex'));

    const request = {
      txid: idBytes,
      label: label || ' ',
      overwrite: true,
    };
    await walletKitLabelTransaction(request);
  } catch (error) {
    console.error(error);
  }
};

export const subscribeTransactions =
  (): AppThunk => async (dispatch, getState) => {
    const {txSubscriptionStarted} = getState().transaction;
    try {
      if (!txSubscriptionStarted) {
        dispatch(txSubscriptionStartedAction(true));

        subscribeLndTransactions(
          {},
          async transaction => {
            try {
              console.log(`new tx detected!: ${transaction}`);
              dispatch(getTransactions());
              dispatch(getBalance());
            } catch (error) {
              dispatch(txSubscriptionStartedAction(false));
              throw new Error(String(error));
            }
          },
          error => {
            console.error(error);
          },
        );
      }
    } catch (error) {
      console.error(error);
    }
  };

export const getTransactions = (): AppThunk => async (dispatch, getState) => {
  const {buyHistory, sellHistory} = getState().buy;

  try {
    const transactions = await getLndTransactions(
      create(GetTransactionsRequestSchema),
    );

    let txs: IDecodedTx[] = [];
    let unmatchedBuyTxs: string[] = [];
    let unmatchedSellTxs: string[] = [];

    for await (const tx of transactions.transactions) {
      const outputDetails: IOutputDetails[] = [];
      tx.outputDetails?.forEach(outputDetail => {
        const output: IOutputDetails = {
          address: outputDetail.address,
          amount: Number(outputDetail.amount),
          isOurAddress: outputDetail.isOurAddress,
          outputIndex: Number(outputDetail.outputIndex),
          outputType: outputDetail.outputType,
          pkScript: outputDetail.pkScript,
        };
        outputDetails.push(output);
      });

      const previousOutpoints: PreviousOutPoint[] = [];
      tx.previousOutpoints?.forEach(prevOutpoint => {
        previousOutpoints.push(prevOutpoint);
      });

      let metaLabel = 'All';
      const priceOnDateMeta = await getPriceOnDate(Number(tx.timeStamp));
      let moonpayMeta = null;

      if (Math.sign(parseFloat(String(tx.amount))) === -1) {
        metaLabel = 'Send';
      }

      if (Math.sign(parseFloat(String(tx.amount))) === 1) {
        metaLabel = 'Receive';
      }

      if (buyHistory && buyHistory.length >= 1) {
        const buyTxs = buyHistory.filter(buyTx => {
          if (buyTx.cryptoTransactionId === tx.txHash) {
            return buyTx;
          } else if (
            buyTx.txHash &&
            buyTx.status === 'completed' &&
            !unmatchedBuyTxs.includes(buyTx.txHash)
          ) {
            unmatchedBuyTxs.push(buyTx.txHash);
          }
        });
        if (buyTxs && buyTxs.length > 0) {
          const buyTx = buyTxs[0];
          moonpayMeta = {
            id: buyTx.id,
            cryptoTransactionId: buyTx.cryptoTransactionId || null,
            createdAt: buyTx.createdAt,
            updatedAt: buyTx.updatedAt || null,
            walletAddress: buyTx.walletAddress || null,
            baseCurrency: buyTx.baseCurrency.code || null, // fiat
            quoteCurrency: buyTx.currency.code || null, // ltc
            baseCurrencyAmount: buyTx.baseCurrencyAmount || null, // fiat
            quoteCurrencyAmount: buyTx.quoteCurrencyAmount || null, // ltc
            usdRate: buyTx.usdRate || null,
            eurRate: buyTx.eurRate || null,
            gbpRate: buyTx.gbpRate || null,
            areFeesIncluded: buyTx.areFeesIncluded || null,
            networkFeeAmount: buyTx.networkFeeAmount || null,
            feeAmount: buyTx.feeAmount || null,
            feeAmountDiscount: buyTx.feeAmountDiscount || null,
            extraFeeAmount: buyTx.extraFeeAmount || null,
            extraFeeAmountDiscount: buyTx.extraFeeAmountDiscount || null,
            returnUrl: buyTx.returnUrl,
            status: buyTx.status || null,
            country: buyTx.country || null,
            cardType: buyTx.cardType || null,
          };
          metaLabel = 'Buy';
        }
      }

      if (sellHistory && sellHistory.length >= 1) {
        const sellTxs = sellHistory.filter(sellTx => {
          if (sellTx.depositHash === tx.txHash) {
            return sellTx;
          } else if (
            sellTx.depositHash &&
            sellTx.status === 'completed' &&
            !unmatchedSellTxs.includes(sellTx.depositHash)
          ) {
            unmatchedSellTxs.push(sellTx.depositHash);
          }
        });
        if (sellTxs && sellTxs.length > 0) {
          const sellTx = sellTxs[0];
          moonpayMeta = {
            id: sellTx.id,
            cryptoTransactionId: sellTx.depositHash || null,
            createdAt: sellTx.createdAt,
            updatedAt: sellTx.updatedAt || null,
            walletAddress: null,
            baseCurrency: sellTx.baseCurrency.code || null, // ltc
            quoteCurrency: sellTx.currency.code || null, // fiat
            baseCurrencyAmount: sellTx.baseCurrencyAmount || null, // ltc
            quoteCurrencyAmount: sellTx.quoteCurrencyAmount || null, // fiat
            usdRate: sellTx.usdRate || null,
            eurRate: sellTx.eurRate || null,
            gbpRate: sellTx.gbpRate || null,
            areFeesIncluded: null,
            networkFeeAmount: null,
            feeAmount: sellTx.feeAmount || null,
            feeAmountDiscount: null,
            extraFeeAmount: sellTx.extraFeeAmount || null,
            extraFeeAmountDiscount: null,
            returnUrl: null,
            status: sellTx.status || null,
            country: sellTx.country || null,
            cardType: null,
          };
          metaLabel = 'Sell';
        }
      }

      let decodedTx = {
        txHash: tx.txHash,
        blockHash: tx.blockHash,
        blockHeight: tx.blockHeight,
        amount: Number(tx.amount),
        numConfirmations: tx.numConfirmations,
        timeStamp: String(tx.timeStamp),
        fee: Number(tx.totalFees),
        outputDetails,
        previousOutpoints,
        label: tx.label,
        metaLabel,
        priceOnDateMeta: Number(priceOnDateMeta) || 0,
        moonpayMeta,
      };
      txs.push(decodedTx);
    }

    for await (const unmatchedBuyTx of unmatchedBuyTxs) {
      const buyTx = buyHistory.find(tx => tx.depositHash === unmatchedBuyTx);
      const moonpayMeta = {
        id: buyTx.id,
        cryptoTransactionId: buyTx.cryptoTransactionId || null,
        createdAt: buyTx.createdAt,
        updatedAt: buyTx.updatedAt || null,
        walletAddress: buyTx.walletAddress || null,
        baseCurrency: buyTx.baseCurrency.code || null,
        quoteCurrency: buyTx.currency.code || null,
        baseCurrencyAmount: buyTx.baseCurrencyAmount || null,
        quoteCurrencyAmount: buyTx.quoteCurrencyAmount || null,
        usdRate: buyTx.usdRate || null,
        eurRate: buyTx.eurRate || null,
        gbpRate: buyTx.gbpRate || null,
        areFeesIncluded: buyTx.areFeesIncluded || null,
        networkFeeAmount: buyTx.networkFeeAmount || null,
        feeAmount: buyTx.feeAmount || null,
        feeAmountDiscount: buyTx.feeAmountDiscount || null,
        extraFeeAmount: buyTx.extraFeeAmount || null,
        extraFeeAmountDiscount: buyTx.extraFeeAmountDiscount || null,
        returnUrl: buyTx.returnUrl,
        status: buyTx.status || null,
        country: buyTx.country || null,
        cardType: buyTx.cardType || null,
      };
      const txTimeStamp = String(Date.parse(buyTx.createdAt) / 1000); // from iso to timestamp
      const priceOnDateMeta = await getPriceOnDate(Number(txTimeStamp));
      let decodedTx = {
        txHash: buyTx.cryptoTransactionId,
        blockHash: '',
        blockHeight: 0,
        amount: buyTx.quoteCurrencyAmount,
        numConfirmations: buyTx.confirmations || 0,
        timeStamp: txTimeStamp,
        fee: buyTx.feeAmount,
        outputDetails: [],
        previousOutpoints: [],
        label: '',
        metaLabel: 'Buy',
        priceOnDateMeta: Number(priceOnDateMeta) || 0,
        moonpayMeta,
      };
      txs.push(decodedTx);
    }

    for await (const unmatchedSellTx of unmatchedSellTxs) {
      const sellTx = sellHistory.find(tx => tx.depositHash === unmatchedSellTx);
      const moonpayMeta = {
        id: sellTx.id,
        cryptoTransactionId: sellTx.depositHash || null,
        createdAt: sellTx.createdAt,
        updatedAt: sellTx.updatedAt || null,
        walletAddress: null,
        baseCurrency: sellTx.baseCurrency?.code || null,
        quoteCurrency: sellTx.quoteCurrency?.code || null,
        baseCurrencyAmount: sellTx.baseCurrencyAmount || null, //ltc
        quoteCurrencyAmount: sellTx.quoteCurrencyAmount || null, //fiat
        usdRate: sellTx.usdRate || null,
        eurRate: sellTx.eurRate || null,
        gbpRate: sellTx.gbpRate || null,
        areFeesIncluded: null,
        networkFeeAmount: null, // IS IT UNDEFINED?
        feeAmount: sellTx.feeAmount || null,
        feeAmountDiscount: null,
        extraFeeAmount: sellTx.extraFeeAmount || null,
        extraFeeAmountDiscount: null,
        returnUrl: null,
        status: sellTx.status || null,
        country: sellTx.country || null,
        cardType: null,
      };
      const txTimeStamp = String(Date.parse(sellTx.createdAt) / 1000); // from iso to timestamp
      const priceOnDateMeta = await getPriceOnDate(Number(txTimeStamp));
      let decodedTx = {
        txHash: sellTx.depositHash,
        blockHash: '',
        blockHeight: 0,
        amount: sellTx.baseCurrencyAmount * 100000000,
        numConfirmations: sellTx.confirmations,
        timeStamp: txTimeStamp,
        fee: sellTx.feeAmount,
        outputDetails: [],
        previousOutpoints: [],
        label: '',
        metaLabel: 'Sell',
        priceOnDateMeta: Number(priceOnDateMeta) || 0,
        moonpayMeta,
      };
      txs.push(decodedTx);
    }

    dispatch(getTransactionsAction(txs));
  } catch (error) {
    console.error(error);
  }
};

export const sendOnchainPayment =
  (
    address: string,
    amount: number,
    label: string | undefined = undefined,
    fee: number | undefined = undefined,
  ): AppThunk<Promise<string>> =>
  (dispatch, getState) => {
    return new Promise(async (resolve, reject) => {
      try {
        const {confirmedBalance} = getState().balance;
        const sendAll = Number(confirmedBalance) === amount ? true : false;

        try {
          if (sendAll) {
            const response = await sendCoins({
              sendAll: true,
              addr: address,
              satPerVbyte: fee ? BigInt(fee) : undefined,
              // Set ghost label if it's undefined in order to prevent default labeling
              label: label || ' ',
            });
            resolve(response.txid);
            return;
          } else {
            const response = await sendCoins({
              addr: address,
              amount: BigInt(amount),
              satPerVbyte: fee ? BigInt(fee) : undefined,
              // Set ghost label if it's undefined in order to prevent default labeling
              label: label || ' ',
            });
            resolve(response.txid);
            return;
          }
        } catch (error) {
          reject(String(error));
        }
      } catch (error) {
        reject(String(error));
      }
    });
  };

export const publishTransaction = (txHex: string) => {
  return new Promise(async (resolve, reject) => {
    try {
      const request = await fetch('https://litecoinspace.org/api/tx', {
        method: 'POST',
        body: txHex,
      });

      if (!request.ok) {
        const error = await request.text();
        reject(`Tx Broadcast failed: ${error}`);
      }

      const response = await request.text();
      // TODO: verify this reponse is just txid

      resolve(response);
    } catch (error) {
      reject(String(error));
    }
  });
};

// selectors
const txSelector = (state: any): any => state.transaction.transactions;

export const txDetailSelector = createSelector<
  [(state: any) => any],
  IDisplayedTx[]
>(txSelector, (txs: any) =>
  txs.map((data: any, index: number) => {
    const myOutputs: string[] = [];
    const otherOutputs: string[] = [];

    // We can only determine MWEB txs by their outputs
    // since lnd does not return valid inputs
    let isMweb = false;

    data.outputDetails?.forEach((outputDetail: any) => {
      if (outputDetail.isOurAddress) {
        myOutputs.push(outputDetail.address);
      } else {
        otherOutputs.push(outputDetail.address);
      }

      if (outputDetail.address.substring(0, 7) === 'ltcmweb') {
        isMweb = true;
      }
    });

    // Consider tx as mweb if lnd cannot detect outputs
    if (myOutputs.length === 0 && otherOutputs.length === 0) {
      isMweb = true;
    }

    return {
      hash: data.txHash,
      isMweb: isMweb,
      blockHash: data.blockHash,
      blockHeight: data.blockHeight,
      amount: data.amount,
      confs: data.numConfirmations,
      day: formatDate(Number(data.timeStamp) * 1000),
      time: formatTime(Number(data.timeStamp) * 1000),
      timestamp: data.timeStamp,
      fee: data.fee,
      lightning: false,
      myOutputs,
      otherOutputs,
      label: data.label,
      metaLabel: data.metaLabel,
      priceOnDateMeta: data.priceOnDateMeta,
      moonpayMeta: data.moonpayMeta
        ? {
            moonpayTxId: data.moonpayMeta.id,
            cryptoTxId: data.moonpayMeta.cryptoTransactionId || '',
            createdAt: data.moonpayMeta.createdAt,
            updatedAt: data.moonpayMeta.updatedAt,
            walletAddress: data.moonpayMeta.walletAddress || '',
            cryptoCurrency:
              data.metaLabel === 'Sell'
                ? data.moonpayMeta.baseCurrency || 'ltc'
                : data.moonpayMeta.quoteCurrency || 'ltc',
            fiatCurrency:
              data.metaLabel === 'Sell'
                ? data.moonpayMeta.quoteCurrency || 'unknown'
                : data.moonpayMeta.baseCurrency || 'unknown',
            cryptoCurrencyAmount:
              data.metaLabel === 'Sell'
                ? data.moonpayMeta.baseCurrencyAmount || 0
                : data.moonpayMeta.quoteCurrencyAmount || 0,
            fiatCurrencyAmount:
              data.metaLabel === 'Sell'
                ? data.moonpayMeta.quoteCurrencyAmount || 0
                : data.moonpayMeta.baseCurrencyAmount || 0,
            usdRate: data.moonpayMeta.usdRate || 0,
            eurRate: data.moonpayMeta.eurRate || 0,
            gbpRate: data.moonpayMeta.gbpRate || 0,
            totalFee:
              Number(data.moonpayMeta.networkFeeAmount) +
              Number(data.moonpayMeta.extraFeeAmount) +
              Number(data.moonpayMeta.feeAmount),
            blockchainFee: Number(data.moonpayMeta.networkFeeAmount),
            tipLFFee: Number(data.moonpayMeta.extraFeeAmount),
            moonpayFee: Number(data.moonpayMeta.feeAmount),
            txDetailsUrl: `${data.moonpayMeta.returnUrl}?transactionId=${data.moonpayMeta.id}`,
            status: data.moonpayMeta.status || 'unknown',
            country: data.moonpayMeta.country || 'unknown',
            paymentMethod: data.moonpayMeta.cardType || 'unknown',
          }
        : null,
      renderIndex: index,
    };
  }),
);

// slice
export const transactionSlice = createSlice({
  name: 'transaction',
  initialState,
  reducers: {
    getTransactionsAction: (state, action) => ({
      ...state,
      transactions: action.payload,
    }),
    txSubscriptionStartedAction: (state, action) => ({
      ...state,
      txSubscriptionStarted: action.payload,
    }),
  },
});

export default transactionSlice.reducer;
