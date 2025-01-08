import {createAction, createSelector, createSlice} from '@reduxjs/toolkit';
import {
  getTransactions as getLndTransactions,
  sendCoins,
  subscribeTransactions as subscribeLndTransactions,
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
  amount: Number;
  numConfirmations: number;
  timeStamp: string;
  fee: Number;
  destAddresses: string[];
  outputDetails: IOutputDetails[];
  previousOutpoints: PreviousOutPoint[];
  label: string | null | undefined;
  metaLabel: string;
  priceOnDateMeta: number | null;
  moonpayMeta: {
    status: string | null;
    baseCurrency: string | null;
    currency: string | null;
    areFeesIncluded: boolean | null;
    networkFeeAmount: number | null;
    feeAmount: number | null;
    feeAmountDiscount: number | null;
    extraFeeAmount: number | null;
    extraFeeAmountDiscount: number | null;
    baseCurrencyAmount: number | null;
    quoteCurrencyAmount: number | null;
    usdRate: number | null;
    eurRate: number | null;
    gbpRate: number | null;
  } | null;
};

export type IDisplayedTx = {
  hash: string;
  blockHash: string;
  blockHeight: number;
  amount: number;
  confs: number;
  day: string;
  time: Date;
  timestamp: number;
  fee: undefined;
  lightning: boolean;
  addresses: string[];
  inputTxs: string[];
  label: string | null | undefined;
  metaLabel: string;
  priceOnDateMeta: number | null;
  moonpayMeta: {
    status: string | null;
    baseCurrency: string | null;
    currency: string | null;
    areFeesIncluded: boolean | null;
    networkFeeAmount: number | null;
    feeAmount: number | null;
    feeAmountDiscount: number | null;
    extraFeeAmount: number | null;
    extraFeeAmountDiscount: number | null;
    baseCurrencyAmount: number | null;
    quoteCurrencyAmount: number | null;
    usdRate: number | null;
    eurRate: number | null;
    gbpRate: number | null;
  } | null;
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
        'https://mobile.litecoin.com/api/prices/dateprice',
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
      // console.error(error);
      reject(error);
    }
  });
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

    for await (const tx of transactions.transactions) {
      // deserialisation
      const destAddresses: string[] = [];
      tx.destAddresses?.forEach(addresses => {
        destAddresses.push(addresses);
      });
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
        const buyTxs = buyHistory.filter(
          buyTx => buyTx.cryptoTransactionId === tx.txHash,
        );
        if (buyTxs && buyTxs.length > 0) {
          const buyTx = buyTxs[0];
          moonpayMeta = {
            status: buyTx.status || null,
            baseCurrency: buyTx.baseCurrency.code || null,
            currency: buyTx.currency.code || null,
            areFeesIncluded: buyTx.areFeesIncluded || null,
            networkFeeAmount: buyTx.networkFeeAmount || null,
            feeAmount: buyTx.feeAmount || null,
            feeAmountDiscount: buyTx.feeAmountDiscount || null,
            extraFeeAmount: buyTx.extraFeeAmount || null,
            extraFeeAmountDiscount: buyTx.extraFeeAmountDiscount || null,
            baseCurrencyAmount: buyTx.baseCurrencyAmount || null,
            quoteCurrencyAmount: buyTx.quoteCurrencyAmount || null,
            usdRate: buyTx.usdRate || null,
            eurRate: buyTx.eurRate || null,
            gbpRate: buyTx.gbpRate || null,
          };
          metaLabel = 'Buy';
        }
      }

      if (sellHistory && sellHistory.length >= 1) {
        if (
          sellHistory.filter(sellTx => sellTx.cryptoTransactionId === tx.txHash)
            .length > 0
        ) {
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
        destAddresses,
        outputDetails,
        previousOutpoints,
        label: tx.label,
        metaLabel,
        priceOnDateMeta,
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
  ): AppThunk =>
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
            });
            resolve(response.txid);
            return;
          } else {
            const response = await sendCoins({
              addr: address,
              amount: BigInt(amount),
              satPerVbyte: fee ? BigInt(fee) : undefined,
              label: label ? label : undefined,
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
      console.log(response);
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
  txs.map((data: any) => {
    const addresses: string[] = [];
    data.outputDetails?.forEach((outputDetail: any) => {
      addresses.push(outputDetail.address);
    });

    return {
      hash: data.txHash,
      blockHash: data.blockHash,
      blockHeight: data.blockHeight,
      amount: data.amount,
      confs: data.numConfirmations,
      day: formatDate(Number(data.timeStamp) * 1000),
      time: formatTime(Number(data.timeStamp) * 1000),
      timestamp: data.timeStamp,
      fee: data.fee,
      lightning: false,
      addresses,
      inputTxs: data.previousOutpoints,
      label: data.label,
      metaLabel: data.metaLabel,
      priceOnDateMeta: data.priceOnDateMeta,
      moonpayMeta: data.moonpayMeta,
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
