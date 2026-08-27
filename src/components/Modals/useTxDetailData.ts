import {useEffect, useState} from 'react';

import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {
  IDisplayedTx,
  addToTxHashesWithExtraData,
  checkTxHashesWithExtraData,
} from '../../reducers/transaction';
import {
  defaultExplorerSelector,
  mwebDefaultExplorerSelector,
} from '../../reducers/settings';
import {fetchResolve} from '../../utils/tor';
import {isBuySellMetadata} from '../../utils/txMetadata';

// Input addresses and the network fee come from the explorer because lnd
// reports the fee incorrectly; results are memoised in redux by tx hash.
interface TxExtraData {
  hash: string;
  allInputAddrs: string[];
  fetchedTxFee: number | null;
}

const EMPTY_EXTRA_DATA: string[] = [];

export const useTxSenderAndFee = (transaction: IDisplayedTx) => {
  const dispatch = useAppDispatch();
  const torEnabled = useAppSelector(state => state.settings.torEnabled);

  const [extraData, setExtraData] = useState<TxExtraData | null>(null);

  useEffect(() => {
    const abortController = new AbortController();
    const {hash} = transaction;

    async function getSenderAndFee() {
      try {
        const cached = dispatch(checkTxHashesWithExtraData(hash));
        if (!cached) {
          const data: any = await fetchResolve(
            `https://litecoinspace.org/api/tx/${hash}`,
            {
              signal: abortController.signal,
            },
            torEnabled,
          );

          let inputAddrs: string[] = [];
          let fee: number | null = 0;

          if (data.hasOwnProperty('vin') && Array.isArray(data.vin)) {
            inputAddrs = data.vin.map(
              (input: any) => input.prevout.scriptpubkey_address,
            );
          }
          if (data.hasOwnProperty('fee')) {
            fee = data.fee / 100000000;
          } else {
            fee = null;
          }

          setExtraData({hash, allInputAddrs: inputAddrs, fetchedTxFee: fee});

          dispatch(
            addToTxHashesWithExtraData({
              hash,
              inputAddrs,
              fee,
            }),
          );
        } else {
          setExtraData({
            hash,
            allInputAddrs: cached.inputAddrs,
            fetchedTxFee: cached.fee,
          });
        }
      } catch {
        setExtraData({hash, allInputAddrs: [], fetchedTxFee: null});
      }
    }

    getSenderAndFee();
    return () => abortController.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transaction]);

  const matches = extraData?.hash === transaction.hash;
  return {
    allInputAddrs: matches ? extraData!.allInputAddrs : EMPTY_EXTRA_DATA,
    fetchedTxFee: matches ? extraData!.fetchedTxFee : null,
  };
};

// Both selectors run unconditionally so the hook order never depends on the
// transaction (the old modal branched inside an IIFE and got away with it
// only because isMweb is stable per transaction).
export const useTxExplorerUrl = (transaction: IDisplayedTx) => {
  const mwebExplorer = useAppSelector(state =>
    mwebDefaultExplorerSelector(state, transaction.blockHeight),
  );
  const explorer = useAppSelector(state =>
    defaultExplorerSelector(state, transaction.hash),
  );
  return transaction.isMweb ? mwebExplorer : explorer;
};

export const getTxTitleMeta = (transaction: IDisplayedTx) => {
  switch (transaction.metaLabel) {
    case 'Send':
      return {
        textKey: 'sent',
        amountColor: '#212124',
      };
    case 'Receive':
      return {
        textKey: 'received',
        amountColor: '#1162E6',
      };
    case 'Buy':
      return {
        textKey:
          isBuySellMetadata(transaction.providerMeta) &&
          transaction.providerMeta.status
            ? transaction.providerMeta.status === 'pending'
              ? 'buying'
              : 'bought'
            : 'bought',
        amountColor: '#1162E6',
      };
    case 'Sell':
      return {
        textKey:
          isBuySellMetadata(transaction.providerMeta) &&
          transaction.providerMeta.status
            ? transaction.providerMeta.status === 'pending'
              ? 'selling'
              : 'sold'
            : 'sold',
        amountColor: '#212124',
      };
    case 'Convert':
      return {
        textKey: 'Converted',
        amountColor: '#1162E6',
      };
    default:
      return {
        textKey: 'Unknown',
        amountColor: '#212124',
      };
  }
};
