import {createAction, createSelector, createSlice} from '@reduxjs/toolkit';
import {PURGE} from 'redux-persist';
import {
  getTransactions as getLndTransactions,
  sendCoins,
  subscribeTransactions as subscribeLndTransactions,
  newAddress as newLndAddress,
  walletKitLabelTransaction,
  walletKitListUnspent,
  walletKitFundPsbt,
  walletKitFinalizePsbt,
} from 'react-native-turbo-lndltc';
import {
  GetTransactionsRequestSchema,
  OutputScriptType,
  PreviousOutPoint,
  OutPoint,
  AddressType,
  Utxo,
} from 'react-native-turbo-lndltc/protos/lightning_pb';
import {ChangeAddressType} from 'react-native-turbo-lndltc/protos/walletrpc/walletkit_pb';
import {create} from '@bufbuild/protobuf';

import {AppThunk, AppThunkTxHashesWithExtraData} from './types';
import {poll} from '../utils/poll';
import {formatDate, formatTime} from '../utils/date';
import {
  IDecodedTx,
  ITrade,
  DisplayedMetadataType,
  decodedTxMetadataProjection,
  displayedTxMetadataProjection,
  getUTCTimeStampFromMetadata,
} from '../utils/txMetadata';
import {processConvertTransactions} from '../utils/convertTransactionProcessor';
import {getBalance} from './balance';
import {fetchResolve} from '../utils/tor';

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

export type IConvertedTx = {
  destinationAddress: string;
  targetAmount: number;
  timestamp: number;
  conversionType: 'regular' | 'private';
  selectedUtxos: Array<{
    address: string;
    amountSat: number;
    addressType: number;
  }>;
  selectedOutpoints: string[];
};

export interface ITxHashWithExtraData {
  hash: string;
  inputAddrs: string[];
  fee: number | null;
}

interface ITx {
  txSubscriptionStarted: boolean;
  transactions: IDecodedTx[];
  convertedTransactions: IConvertedTx[];
  cachedTxHashes: string[];
  txHashesWithExtraData: ITxHashWithExtraData[];
}

// initial state
const initialState = {
  txSubscriptionStarted: false,
  transactions: [],
  invoices: [],
  memos: [],
  convertedTransactions: [],
  cachedTxHashes: [],
  txHashesWithExtraData: [],
} as ITx;

// actions
const getTransactionsAction = createAction<IDecodedTx[]>(
  'transaction/getTransactionsAction',
);
const setCachedTxHashes = createAction<string[]>(
  'transaction/setCachedTxHashes',
);
const setTxHashesWithExtraData = createAction<ITxHashWithExtraData[]>(
  'transaction/setTxHashesWithExtraData',
);
const txSubscriptionStartedAction = createAction<boolean>(
  'transaction/txSubscriptionStartedAction',
);
const addConvertedTransactionAction = createAction<IConvertedTx>(
  'transaction/addConvertedTransactionAction',
);

// functions
const getPriceOnDate = (
  timestamp: number,
  torEnabled: boolean,
): Promise<number | null> => {
  return new Promise(async (resolve, reject) => {
    try {
      const res = await fetchResolve(
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
        torEnabled,
      );

      if (res && res.hasOwnProperty('datePrice')) {
        resolve(res.datePrice);
      } else {
        // NOTE: resolve null so this request won't break math for the TransactionList
        resolve(null);
      }
    } catch (error) {
      resolve(null);
    }
  });
};

export const sendConvertWithPsbt =
  (amount: number, destination: 'regular' | 'private'): AppThunk =>
  async (dispatch, getState) => {
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
        .filter(utxo => utxo.addressType === AddressType.MWEB)
        .sort((a, b) => Number(b.amountSat) - Number(a.amountSat));
      const nonMwebUtxos = utxos
        .filter(utxo => utxo.addressType !== AddressType.MWEB)
        .sort((a, b) => Number(b.amountSat) - Number(a.amountSat));

      const outpoints = destination === 'private' ? nonMwebUtxos : mwebUtxos;

      // Perform coin selection to find minimum inputs needed to satisfy the amount
      const selectedUtxos = [];
      const selectedUtxoDetails = []; // Store full UTXO details for Redux
      let totalSelected = BigInt(-2000);
      const targetAmount = BigInt(Math.floor(amount));

      // Utxo[] -> OutPoint[]
      for (const utxo of outpoints) {
        if (utxo.outpoint === undefined) {
          continue;
        }

        if (utxo.outpoint) {
          selectedUtxos.push(utxo.outpoint);
          // Store the full UTXO details (convert BigInt to number for Redux serialization)
          selectedUtxoDetails.push({
            address: utxo.address,
            amountSat: Number(utxo.amountSat),
            addressType: utxo.addressType,
          });
        }
        totalSelected += utxo.amountSat;

        // Break when we have enough to cover the amount (fees will be calculated by FundPsbt)
        if (totalSelected >= targetAmount) {
          break;
        }
      }

      if (totalSelected < targetAmount) {
        throw new Error(
          `Insufficient funds: need ${targetAmount}, have ${totalSelected}`,
        );
      }

      if (selectedUtxos.length < 1) {
        throw new Error('No valid inputs found!');
      }

      if (!destinationAddress || destinationAddress === undefined) {
        throw new Error('No destination address!');
      }

      const psbt = await walletKitFundPsbt({
        template: {
          case: 'raw',
          value: {
            inputs: selectedUtxos,
            outputs: {
              [destinationAddress.address]: targetAmount,
            },
          },
        },
        fees: {
          case: 'satPerVbyte',
          value: destination === 'private' ? BigInt(30) : BigInt(2000),
        },
        changeType:
          destination === 'private'
            ? ChangeAddressType.UNSPECIFIED
            : ChangeAddressType.MWEB,
      });

      const signedPsbt = await walletKitFinalizePsbt({
        fundedPsbt: psbt.fundedPsbt,
      });

      if (!signedPsbt || !signedPsbt.rawFinalTx) {
        throw new Error('Failed to finalize PSBT: rawFinalTx is undefined');
      }

      const txHex = Buffer.from(signedPsbt.rawFinalTx).toString('hex');

      console.log(txHex);
      console.log(Buffer.from(signedPsbt.signedPsbt).toString('hex'));

      try {
        const {torEnabled} = getState().settings!;
        // broadcast transaction
        await publishTransaction(txHex, torEnabled);

        // Store conversion data for transaction matching
        if (destinationAddress.address) {
          // Create outpoint strings for efficient lookup
          const outpointStrings = selectedUtxos.map(
            outpoint =>
              `${Buffer.from(outpoint.txidBytes).toString('hex')}:${outpoint.outputIndex}`,
          );

          dispatch(
            addConvertedTransactionAction({
              destinationAddress: destinationAddress.address,
              targetAmount: parseInt(targetAmount.toString(), 10),
              timestamp: Math.floor(Date.now() / 1000),
              conversionType: destination,
              selectedUtxos: selectedUtxoDetails,
              selectedOutpoints: outpointStrings,
            }),
          );
        }
      } catch (error) {
        throw new Error(error ? String(error) : 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Error in sendConvertWithPsbt:', error || 'Unknown error');
      throw error;
    }
  };

export const sendConvertWithCoinControl = async (
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
      .filter(utxo => utxo.addressType === AddressType.MWEB)
      .sort((a, b) => Number(b.amountSat) - Number(a.amountSat));
    const nonMwebUtxos = utxos
      .filter(utxo => utxo.addressType !== AddressType.MWEB)
      .sort((a, b) => Number(b.amountSat) - Number(a.amountSat));

    const outpoints = destination === 'private' ? nonMwebUtxos : mwebUtxos;

    const outpointsArray = outpoints
      .map(utxo => utxo.outpoint)
      .filter((outpoint): outpoint is OutPoint => outpoint !== undefined);

    if (outpointsArray.length < 1 || outpointsArray === undefined) {
      throw new Error('Outpoints empty!');
    }

    if (!destinationAddress || destinationAddress === undefined) {
      throw new Error('No destination address!');
    }

    const txid = await sendCoins({
      addr: destinationAddress.address,
      amount: BigInt(amount),
      outpoints: outpointsArray,
      // Set ghost label if it's undefined in order to prevent default labeling
      label: ' ',
    });

    return txid;
  } catch (error) {
    throw new Error(String(error));
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
    const {txSubscriptionStarted} = getState().transaction!;
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

function getUnmatchedNexusApiTxsWithLndTxs(
  lndTxs: any[],
  nexusApiTxs: ITrade[],
) {
  const unmatchedTxs: any[] = [];

  nexusApiTxs.forEach(nexusApiTx => {
    const matchedTx = lndTxs.find(
      lndTx => lndTx.txHash === nexusApiTx.cryptoTxId,
    );
    if (!matchedTx) {
      unmatchedTxs.push(nexusApiTx);
    }
  });

  return unmatchedTxs;
}

const checkTxCache = (
  cachedTxHashSet: Set<string>,
  transactionsByHash: Map<string, IDecodedTx>,
  txHash: string,
): IDecodedTx | null => {
  if (cachedTxHashSet.has(txHash)) {
    const cachedTx = transactionsByHash.get(txHash);
    if (cachedTx) {
      return cachedTx;
    }
  }
  return null;
};

export const addToTxHashesWithExtraData =
  (hashWithData: ITxHashWithExtraData): AppThunk =>
  (dispatch, getState) => {
    const {txHashesWithExtraData} = getState().transaction!;
    if (txHashesWithExtraData) {
      const alreadyExist = txHashesWithExtraData.find(
        tx => tx.hash === hashWithData.hash,
      );
      if (!alreadyExist) {
        const txHashesWithExtraDataBuf: ITxHashWithExtraData[] = [
          ...txHashesWithExtraData,
        ];
        txHashesWithExtraDataBuf.push(hashWithData);
        dispatch(setTxHashesWithExtraData(txHashesWithExtraDataBuf));
      }
    } else {
      dispatch(setTxHashesWithExtraData([hashWithData]));
    }
  };

export const checkTxHashesWithExtraData =
  (hash: string): AppThunkTxHashesWithExtraData =>
  (dispatch, getState) => {
    const {txHashesWithExtraData} = getState().transaction!;
    // NOTE: for older versions with missing txHashesWithExtraData in the initial state
    if (!txHashesWithExtraData) {
      dispatch(setTxHashesWithExtraData([]));
      return null;
    }
    const alreadyExist = txHashesWithExtraData.find(tx => tx.hash === hash);
    if (!alreadyExist) {
      return null;
    } else {
      return alreadyExist;
    }
  };

export const getTransactions = (): AppThunk => async (dispatch, getState) => {
  const {buyHistory, sellHistory} = getState().buy!;
  const {transactions, convertedTransactions, cachedTxHashes} =
    getState().transaction!;
  const {torEnabled} = getState().settings!;

  try {
    const lndTransactions = await getLndTransactions(
      create(GetTransactionsRequestSchema),
    );

    // NOTE: for older versions with missing cachedTxHashes in the initial state
    if (!cachedTxHashes) {
      dispatch(setCachedTxHashes([]));
      return;
    }

    const txs: IDecodedTx[] = [];
    const cachedTxHashesBuf: string[] = [...cachedTxHashes];

    const cachedTxHashSet = new Set(cachedTxHashes);
    const transactionsByHash = new Map(transactions.map(tx => [tx.txHash, tx]));

    let processedConvertTxHashes = new Set<string>();

    // Process convert transactions using the extracted utility function
    if (convertedTransactions && convertedTransactions.length > 0) {
      const {processedTransactions, processedTxHashes} =
        await processConvertTransactions(
          convertedTransactions,
          lndTransactions,
          (timestamp: number) => getPriceOnDate(timestamp, torEnabled),
        );

      // Add processed convert transactions to the txs array
      processedTransactions.forEach(processedTx => {
        // NOTE: skip processing if tx was cached before
        // TODO: move the skipping to the processConvertTransactions
        // when it's finished and stable to avoid getPriceOnDate calls
        const cachedTx = checkTxCache(
          cachedTxHashSet,
          transactionsByHash,
          processedTx.txHash,
        );
        if (cachedTx) {
          txs.push(cachedTx);
        } else {
          const decodedTx: IDecodedTx = {
            txHash: processedTx.txHash,
            blockHash: processedTx.blockHash,
            blockHeight: processedTx.blockHeight,
            amount: processedTx.amount,
            numConfirmations: processedTx.numConfirmations,
            timeStamp: processedTx.timeStamp,
            fee: processedTx.fee,
            outputDetails: processedTx.outputDetails,
            previousOutpoints: processedTx.previousOutpoints,
            label: processedTx.label,
            metaLabel: processedTx.metaLabel,
            priceOnDate: processedTx.priceOnDate,
            tradeTx: processedTx.tradeTx,
          };
          txs.push(decodedTx);
          cachedTxHashesBuf.push(decodedTx.txHash);
        }
      });

      processedConvertTxHashes = processedTxHashes;
    }

    // Compare nexus-api txs with lnd txs to append missing ones in lnd
    const unmatchedBuyTxs: ITrade[] = getUnmatchedNexusApiTxsWithLndTxs(
      lndTransactions.transactions,
      buyHistory,
    );
    const unmatchedSellTxs: ITrade[] = getUnmatchedNexusApiTxsWithLndTxs(
      lndTransactions.transactions,
      sellHistory,
    );

    for await (const tx of lndTransactions.transactions) {
      // Skip if this transaction is already part of a convert operation
      if (tx.txHash && processedConvertTxHashes.has(tx.txHash)) {
        continue;
      }
      // NOTE: skip processing if tx was cached before
      const cachedTx = checkTxCache(
        cachedTxHashSet,
        transactionsByHash,
        tx.txHash,
      );
      if (cachedTx) {
        txs.push(cachedTx);
        continue;
      }

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
      // Transaction is a Buy/Sell transaction
      let tradeTx = null;
      // Assign 0 if request fails so math won't break
      const priceOnDate =
        (await getPriceOnDate(Number(tx.timeStamp), torEnabled)) || 0;

      if (Math.sign(parseFloat(String(tx.amount))) === -1) {
        metaLabel = 'Send';
        if (
          tx.numConfirmations === 0 &&
          Number(tx.timeStamp) + 600 < Math.floor(Date.now() / 1000)
        ) {
          try {
            await publishTransaction(tx.rawTxHex, torEnabled);
          } catch (error) {
            console.log('remove tx');
          }
        }
      }
      if (Math.sign(parseFloat(String(tx.amount))) === 1) {
        metaLabel = 'Receive';
      }

      // If tx is present in buyHistory then label it as Buy and include trade metadata
      if (buyHistory && buyHistory.length >= 1) {
        const buyTx = buyHistory.find(
          buyHistoryItem => buyHistoryItem.cryptoTxId === tx.txHash,
        );
        if (buyTx) {
          tradeTx = buyTx;
          metaLabel = 'Buy';
        }
      }

      // NOTE: when you sell your ltc and make a Send transaction to the provider,
      // wallet will likely show this tx before provider detects it and assigns cryptoTxId to it,
      // this causes a Sell transaction to appear as a Send transaction at first
      // TODO: figure the aforementioned note out
      // If tx is present in sellHistory then label it as Sell and include trade metadata
      if (sellHistory && sellHistory.length >= 1) {
        const sellTx = sellHistory.find(
          sellHistoryItem => sellHistoryItem.cryptoTxId === tx.txHash,
        );
        if (sellTx) {
          tradeTx = sellTx;
          metaLabel = 'Sell';
        }
      }

      let decodedTx: IDecodedTx = {
        txHash: tx.txHash || '',
        blockHash: tx.blockHash,
        blockHeight: tx.blockHeight,
        amount: Number(tx.amount),
        numConfirmations: tx.numConfirmations,
        timeStamp: String(tx.timeStamp),
        fee: Number(tx.totalFees),
        outputDetails,
        previousOutpoints,
        label: tx.label || '',
        metaLabel,
        priceOnDate,
        tradeTx,
      };
      txs.push(decodedTx);
      cachedTxHashesBuf.push(decodedTx.txHash);
    }

    const buyHistoryMap = new Map(buyHistory.map(tx => [tx.providerTxId, tx]));
    const sellHistoryMap = new Map(
      sellHistory.map(tx => [tx.providerTxId, tx]),
    );

    for await (const unmatchedBuyTx of unmatchedBuyTxs) {
      // NOTE: skip processing if tx was cached before
      const cachedTx = checkTxCache(
        cachedTxHashSet,
        transactionsByHash,
        unmatchedBuyTx.cryptoTxId,
      );
      if (cachedTx) {
        txs.push(cachedTx);
        continue;
      }

      const buyTx = buyHistoryMap.get(unmatchedBuyTx.providerTxId);
      // Instead of buyTx.createdAt we extract metadata time since
      // it is a transaction of nexus-api trade type
      const txTimeStamp = getUTCTimeStampFromMetadata(buyTx.metadata);
      const priceOnDate =
        (await getPriceOnDate(Number(txTimeStamp), torEnabled)) || 0;
      const decodedTx = decodedTxMetadataProjection(buyTx, priceOnDate);
      txs.push(decodedTx);
      cachedTxHashesBuf.push(decodedTx.txHash);
    }

    for await (const unmatchedSellTx of unmatchedSellTxs) {
      // NOTE: skip processing if tx was cached before
      const cachedTx = checkTxCache(
        cachedTxHashSet,
        transactionsByHash,
        unmatchedSellTx.cryptoTxId,
      );
      if (cachedTx) {
        txs.push(cachedTx);
        continue;
      }

      const sellTx = sellHistoryMap.get(unmatchedSellTx.providerTxId);
      // Instead of sellTx.createdAt we extract metadata time since
      // it is a transaction of nexus-api trade type
      const txTimeStamp = getUTCTimeStampFromMetadata(sellTx.metadata);
      const priceOnDate =
        (await getPriceOnDate(Number(txTimeStamp), torEnabled)) || 0;
      const decodedTx = decodedTxMetadataProjection(sellTx, priceOnDate);
      txs.push(decodedTx);
      cachedTxHashesBuf.push(decodedTx.txHash);
    }

    dispatch(getTransactionsAction(txs));
    dispatch(setCachedTxHashes(cachedTxHashesBuf));
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
        const {confirmedBalance} = getState().balance!;
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

export const sendAllOnchainPayment =
  (
    address: string,
    label: string | undefined = undefined,
  ): AppThunk<Promise<string>> =>
  (_, __) => {
    return new Promise(async (resolve, reject) => {
      try {
        try {
          const response = await sendCoins({
            sendAll: true,
            addr: address,
            satPerVbyte: undefined,
            // Set ghost label if it's undefined in order to prevent default labeling
            label: label || ' ',
          });
          resolve(response.txid);
          return;
        } catch (error) {
          reject(String(error));
        }
      } catch (error) {
        reject(String(error));
      }
    });
  };

export const sendOnchainWithCoinSelectionPayment = (
  address: string,
  amount: number,
  label: string | undefined = undefined,
  fee: number | undefined = undefined,
  coinSelectionUtxos: Utxo[],
): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      if (coinSelectionUtxos.length < 1) {
        throw new Error('No valid inputs found!');
      }

      if (!address || address === undefined) {
        throw new Error('No destination address!');
      }

      // Utxo[] -> OutPoint[]
      const selectedUtxos = [];
      for (const utxo of coinSelectionUtxos) {
        if (utxo.outpoint === undefined) {
          continue;
        }

        if (utxo.outpoint) {
          selectedUtxos.push(utxo.outpoint);
        }
      }

      // construct transaction as psbt
      const psbt = await walletKitFundPsbt({
        template: {
          case: 'raw',
          value: {
            inputs: selectedUtxos,
            outputs: {
              [address]: BigInt(amount),
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

      if (!signedPsbt || !signedPsbt.rawFinalTx) {
        throw new Error('Failed to finalize PSBT: rawFinalTx is undefined');
      }

      const txHex = Buffer.from(signedPsbt.rawFinalTx).toString('hex');

      console.log(txHex);
      console.log(Buffer.from(signedPsbt.signedPsbt).toString('hex'));

      try {
        const txid = await publishTransaction(txHex);
        resolve(txid);
      } catch (error) {
        throw new Error(error ? String(error) : 'Unknown error occurred');
      }
    } catch (error) {
      console.error(
        'Error in sendOnchainWithCoinSelectionPayment:',
        error || 'Unknown error',
      );
      reject(String(error));
    }
  });
};

export const publishTransaction = (
  txHex: string,
  torEnabled: boolean = false,
): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      const fallbackResolve = await publishTransactionFallback1(
        txHex,
        torEnabled,
      );
      resolve(fallbackResolve);
    } catch (error2) {
      reject(error2);
    }
  });
};

const publishTransactionFallback1 = (
  txHex: string,
  torEnabled: boolean = false,
): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await fetchResolve(
        'https://litecoinspace.org/api/tx',
        {
          method: 'POST',
          body: txHex,
        },
        torEnabled,
      );

      // TODO: verify this response is just txid
      if (typeof response === 'string' && response.length > 0) {
        resolve(response);
      } else {
        console.error(`Failed to broadcast tx via Litecoin Space`);
        console.info('Attempting to broadcast tx via Blockcypher!');

        const fallbackResolve = await publishTransactionFallback2(
          txHex,
          torEnabled,
        );
        resolve(fallbackResolve);
      }
    } catch (error) {
      reject(String(error));
    }
  });
};

const publishTransactionFallback2 = (
  txHex: string,
  torEnabled: boolean = false,
): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await fetchResolve(
        'https://api.blockcypher.com/v1/ltc/main/txs/push',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tx: txHex,
          }),
        },
        torEnabled,
      );

      // NOTE: works but hash is undefined
      if (response && response.hash) {
        resolve(response.hash);
      } else {
        reject(`Tx Broadcast 2nd failed: Invalid response`);
      }
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
  if (!txs || !Array.isArray(txs)) {
    return [];
  }
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
      // For convert transactions, use tradeTx directly; for buy/sell, use projection
      providerMeta: data.tradeTx
        ? data.metaLabel === 'Convert'
          ? data.tradeTx
          : displayedTxMetadataProjection(data.tradeTx)
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
    setCachedTxHashes: (state, action) => ({
      ...state,
      cachedTxHashes: action.payload,
    }),
    setTxHashesWithExtraData: (state, action) => ({
      ...state,
      txHashesWithExtraData: action.payload,
    }),
    txSubscriptionStartedAction: (state, action) => ({
      ...state,
      txSubscriptionStarted: action.payload,
    }),
    addConvertedTransactionAction: (state, action) => ({
      ...state,
      convertedTransactions: [
        ...(state.convertedTransactions || []),
        action.payload,
      ],
    }),
  },
  extraReducers: builder => {
    builder.addCase(PURGE, () => {
      return initialState;
    });
  },
});

export default transactionSlice.reducer;
