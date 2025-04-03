import {createAction, createSelector, createSlice} from '@reduxjs/toolkit';
import {
  getTransactions as getLndTransactions,
  sendCoins,
  subscribeTransactions as subscribeLndTransactions,
  newAddress as newLndAddress,
  walletKitLabelTransaction,
  walletKitListUnspent,
  walletKitFundPsbt,
  walletKitFinalizePsbt,
} from 'react-native-turbo-lnd';
import {
  GetTransactionsRequestSchema,
  OutputScriptType,
  PreviousOutPoint,
  Utxo,
  OutPoint,
} from 'react-native-turbo-lnd/protos/lightning_pb';
import {create} from '@bufbuild/protobuf';

import {AppThunk} from './types';
import {poll} from '../lib/utils/poll';
import {formatDate, formatTime} from '../lib/utils/date';
import {
  IDecodedTx,
  DisplayedMetadataType,
  decodedTxMetadataProjection,
  displayedTxMetadataProjection,
  getUTCTimeStampFromMetadata,
} from '../utils/txMetadata';
import {getBalance} from './balance';

// types
export type IDisplayedTx = {
  hash: string;
  isMweb: boolean;
  blockHash: string;
  blockHeight: number;
  amount: number;
  confs: number;
  day: string;
  time: string;
  timestamp: number;
  fee: number;
  lightning: boolean;
  myOutputs: string[];
  otherOutputs: string[];
  label: string | null | undefined;
  metaLabel: string;
  priceOnDate: number;
  providerMeta: DisplayedMetadataType;
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

interface Accumulator {
  selectedUtxos: Utxo[];
  totalAmountSat: number;
}

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
        // NOTE: resolve null so this request won't break math for the TransactionList
        resolve(null);
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

const selectUtxosForConversion = (
  utxos: Utxo[],
  amount: number,
): Accumulator => {
  return utxos.reduce<Accumulator>(
    ({selectedUtxos, totalAmountSat}, utxo) => {
      if (totalAmountSat >= amount) {
        return {selectedUtxos, totalAmountSat};
      }
      return {
        selectedUtxos: [...selectedUtxos, utxo],
        totalAmountSat: totalAmountSat + Number(utxo.amountSat),
      };
    },
    {selectedUtxos: [], totalAmountSat: 0},
  );
};

export const sendConvertPsbtTransaction = async (
  amount: number,
  destination: 'regular' | 'private',
) => {
  try {
    // new destination address
    let type: number;
    if (destination === 'private') {
      type = 7;
    } else {
      type = 2;
    }
    const destinationAddress = await newLndAddress({type});

    // lookup utxos
    const listUnspentResponse = await walletKitListUnspent({});

    if (!listUnspentResponse || !listUnspentResponse.utxos) {
      throw new Error('Invalid response from ListUnspent');
    }
    const {utxos} = listUnspentResponse;

    // filter mweb and non mweb utxos, sort by largest
    // coin selection will use first largest available
    const mwebUtxos = utxos
      .filter(utxo => utxo.addressType === 6)
      .sort((a, b) => Number(b.amountSat) - Number(a.amountSat));
    const nonMwebUtxos = utxos
      .filter(utxo => utxo.addressType !== 6)
      .sort((a, b) => Number(b.amountSat) - Number(a.amountSat));

    const {selectedUtxos, totalAmountSat} = selectUtxosForConversion(
      destination === 'regular' ? mwebUtxos : nonMwebUtxos,
      amount,
    );

    // check if selected UTXOs satisfy the amount
    if (totalAmountSat < amount) {
      throw new Error('Insufficient funds in UTXOs');
    }

    const outpointsArray = selectedUtxos
      .map(utxo => utxo.outpoint)
      .filter((outpoint): outpoint is OutPoint => outpoint !== undefined);

    if (outpointsArray.length < 1 || outpointsArray === undefined) {
      throw new Error('Outpoints empty!');
    }

    const psbt = await walletKitFundPsbt({
      template: {
        case: 'raw',
        value: {
          inputs: outpointsArray,
          outputs: {
            [destinationAddress.address]: BigInt(amount),
          },
        },
      },
      fees: {
        case: 'targetConf',
        value: 3,
      },
    });

    const signedPsbt = await walletKitFinalizePsbt({
      fundedPsbt: psbt.fundedPsbt,
    });
    const txHex = Buffer.from(signedPsbt.rawFinalTx).toString('hex');
    const finalPsbt = Buffer.from(signedPsbt.signedPsbt).toString('base64');
    console.log(txHex);
    console.log(finalPsbt);
    console.log(destinationAddress.address);

    // transaction.ts:270 Error: rpc error: code = Unknown desc = error finalizing PSBT: found UTXO tx cde375a5aaa7d6878e44d502e04af28f34af3836ebb139242ae7f8adbfea1662 but it doesn't match PSBT's input 7e237d4d7a8fdfe941f6caa8aaec5fffcb70ce3084e0f8d99a12a87aa0f37059
    await publishTransaction(txHex);
  } catch (error) {
    console.error(error);
  }
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

      // Type of transaction, All denotes unlabeled txs
      let metaLabel = 'All';
      // Trade transaction is buy/sell tx
      let tradeTx = null;
      // 0 if request fails
      const priceOnDate = (await getPriceOnDate(Number(tx.timeStamp))) || 0;

      if (Math.sign(parseFloat(String(tx.amount))) === -1) {
        metaLabel = 'Send';
      }
      if (Math.sign(parseFloat(String(tx.amount))) === 1) {
        metaLabel = 'Receive';
      }

      if (buyHistory && buyHistory.length >= 1) {
        // Find matching lnd tx with the tx from buyHistory from nexus-api
        // by comparing cryptoTxId with txHash
        // to identify transaction as a Buy one.
        // If lnd fails to return Buy transaction associated with user's wallet
        // it is added to unmatchedBuyTxs array for further processing
        const buyTxs = buyHistory.filter(buyTx => {
          if (buyTx.cryptoTxId === tx.txHash) {
            return true;
          }
          // If tx is valid (not failed) and haven't been pushed in unmatchedBuyTxs yet
          // add providerTxId in unmatchedSellTxs as a unique id for finding the tx
          // TODO: make sure fetched trades from providers always have providerTxId
          if (
            buyTx.status !== 'failed' &&
            !unmatchedBuyTxs.includes(buyTx.providerTxId)
          ) {
            unmatchedBuyTxs.push(buyTx.providerTxId);
          }
          return false;
        });
        // Get filtered out trade tx and label it
        if (buyTxs && buyTxs.length > 0) {
          const buyTx = buyTxs[0];
          tradeTx = buyTx;
          metaLabel = 'Buy';
        }
      }

      // NOTE: when you sell your ltc and make a Send transaction to the provider,
      // wallet will likely show this tx before provider detects it and assigns cryptoTxId to it,
      // this causes a Sell transaction to appear as a Send transaction at first
      // TODO: figure the aforementioned note out
      if (sellHistory && sellHistory.length >= 1) {
        // Find matching lnd tx with the tx from sellHistory from nexus-api
        // by comparing cryptoTxId with txHash
        // to identify transaction as a Sell one.
        // If lnd fails to return Sell transaction associated with user's wallet
        // it is added to unmatchedSellTxs array for further processing
        const sellTxs = sellHistory.filter(sellTx => {
          if (sellTx.cryptoTxId === tx.txHash) {
            return true;
          }
          // If tx is valid (not failed) and haven't been pushed in unmatchedBuyTxs yet
          // add providerTxId in unmatchedSellTxs as a unique id for finding the tx
          // TODO: make sure fetched trades from providers always have providerTxId
          if (
            sellTx.status !== 'failed' &&
            !unmatchedSellTxs.includes(sellTx.providerTxId)
          ) {
            unmatchedSellTxs.push(sellTx.providerTxId);
          }
          return false;
        });
        // Get filtered out trade tx and label it
        if (sellTxs && sellTxs.length > 0) {
          const sellTx = sellTxs[0];
          tradeTx = sellTx;
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
        priceOnDate,
        tradeTx,
      };
      txs.push(decodedTx);
    }

    for await (const unmatchedBuyTx of unmatchedBuyTxs) {
      const buyTx = buyHistory.find(tx => tx.providerTxId === unmatchedBuyTx);
      // Instead of buyTx.createdAt we extract metadata time since
      // it is a transaction of nexus-api trade type
      const txTimeStamp = getUTCTimeStampFromMetadata(buyTx.metadata);
      const priceOnDate = (await getPriceOnDate(Number(txTimeStamp))) || 0;
      const decodedTx = decodedTxMetadataProjection(buyTx, priceOnDate);
      txs.push(decodedTx);
    }

    for await (const unmatchedSellTx of unmatchedSellTxs) {
      const sellTx = sellHistory.find(
        tx => tx.providerTxId === unmatchedSellTx,
      );
      // Instead of sellTx.createdAt we extract metadata time since
      // it is a transaction of nexus-api trade type
      const txTimeStamp = getUTCTimeStampFromMetadata(sellTx.metadata);
      const priceOnDate = (await getPriceOnDate(Number(txTimeStamp))) || 0;
      const decodedTx = decodedTxMetadataProjection(sellTx, priceOnDate);
      txs.push(decodedTx);
    }

    dispatch(getTransactionsAction(txs));
  } catch (error) {
    console.error(error);
  }
};

export const pollTransactions = (): AppThunk => async dispatch => {
  await poll(async () => {
    try {
      dispatch(getTransactions());
    } catch (error) {
      console.warn(error);
    }
  }, 15000);
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
>(txSelector, (txs: any) => {
  const sortedTxs = [...txs];

  sortedTxs.sort((a: any, b: any) => b.timeStamp - a.timeStamp);

  return sortedTxs.map((data: any, index: number) => {
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
      hash: data.txHash || 'unknown',
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
      priceOnDate: data.priceOnDate,
      // if it's buy/sell tx (aka trade tx) fetch its metadata
      providerMeta: data.tradeTx
        ? displayedTxMetadataProjection(data.tradeTx)
        : null,
      renderIndex: index,
    };
  });
});

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
