import {PreviousOutPoint} from 'react-native-turbo-lndltc/protos/lightning_pb';
import {IConvertedTx} from '../reducers/transaction';

type IOutputDetails = {
  address: string;
  amount: number;
  isOurAddress: boolean;
  outputIndex: number;
  outputType: any;
  pkScript: string;
};

export type ProcessedConvertTransaction = {
  txHash: string;
  blockHash: string;
  blockHeight: number;
  amount: number;
  numConfirmations: number;
  timeStamp: string;
  fee: number;
  outputDetails: IOutputDetails[];
  previousOutpoints: PreviousOutPoint[];
  label: string;
  metaLabel: string;
  priceOnDate: number;
  tradeTx: {
    conversionType: 'regular' | 'private';
    destinationAddress: string;
    targetAmount: number;
    timestamp: number;
    selectedUtxos: Array<{
      address: string;
      amountSat: number;
      addressType: number;
    }>;
    mergedInputDetails: PreviousOutPoint[];
    mergedOutputDetails: IOutputDetails[];
    totalFees: number;
    sendTxHash?: string;
    receiveTxHash?: string;
  };
};

/**
 * Process convert transactions to find all related transactions and merge their outputs
 * @param convertedTransactions Array of converted transaction metadata
 * @param transactions Raw transaction data from LND
 * @param getPriceOnDate Function to get price on a specific date
 * @returns Array of processed convert transactions and set of processed transaction hashes
 */
export async function processConvertTransactions(
  convertedTransactions: IConvertedTx[],
  transactions: any, // Accept the raw TransactionDetails from LND
  getPriceOnDate: (timestamp: number) => Promise<number | null>,
): Promise<{
  processedTransactions: ProcessedConvertTransaction[];
  processedTxHashes: Set<string>;
}> {
  const processedConvertTxs = new Set<string>();
  const processedConvertTxHashes = new Set<string>();
  const processedTransactions: ProcessedConvertTransaction[] = [];

  for (const convertTx of convertedTransactions) {
    const convertKey = `${convertTx.destinationAddress}-${convertTx.timestamp}`;

    if (processedConvertTxs.has(convertKey)) {
      continue;
    }

    // Find the main convert transaction (has destination address AND matches convert criteria)
    const mainConvertTransaction = transactions.transactions.find(tx => {
      const hasDestinationAddress = tx.outputDetails?.some(
        output => output.address === convertTx.destinationAddress,
      );

      if (!hasDestinationAddress) {
        return false;
      }

      // Additional validation: check if transaction uses selected outpoints
      const selectedOutpointSet = new Set(convertTx.selectedOutpoints || []);
      const usesSelectedOutpoints = tx.previousOutpoints?.some(prevOutpoint =>
        selectedOutpointSet.has(prevOutpoint.outpoint || ''),
      );

      // Additional validation: check amount proximity to target amount
      const amountMatches =
        Math.abs(Number(tx.amount) - Number(convertTx.targetAmount)) <
        Math.max(1000, Number(convertTx.targetAmount) * 0.01); // 1000 sats or 1% tolerance

      // Additional validation: check timestamp proximity (within 1 hour)
      const timestampMatches =
        Math.abs(Number(tx.timeStamp) - convertTx.timestamp) < 3600;

      // Must use selected outpoints OR have matching amount AND timestamp
      return usesSelectedOutpoints || (amountMatches && timestampMatches);
    });

    if (!mainConvertTransaction) {
      continue;
    }

    // Find all related transactions using the same logic
    const directlyRelated = transactions.transactions.filter(relatedTx => {
      // Include if it has the destination address (main convert tx)
      const hasDestinationAddress = relatedTx.outputDetails?.some(
        output => output.address === convertTx.destinationAddress,
      );

      if (hasDestinationAddress) {
        return true;
      }

      // Check if this transaction uses the selected UTXOs as inputs
      const totalSelectedAmount = convertTx.selectedUtxos
        ? convertTx.selectedUtxos.reduce((sum, utxo) => sum + utxo.amountSat, 0)
        : 0;
      const usesSelectedUtxosByAmount =
        totalSelectedAmount > 0 &&
        Math.abs(Number(relatedTx.amount)) === totalSelectedAmount;

      const selectedOutpointSet = new Set(convertTx.selectedOutpoints || []);
      const usesSelectedUtxosByOutpoint =
        relatedTx.previousOutpoints?.some(prevOutpoint =>
          selectedOutpointSet.has(prevOutpoint.outpoint || ''),
        ) || false;

      if (usesSelectedUtxosByAmount || usesSelectedUtxosByOutpoint) {
        return true;
      }

      // Same block transactions - use more intelligent matching
      const sameBlockAsConvert =
        relatedTx.blockHeight === mainConvertTransaction.blockHeight &&
        relatedTx.blockHash === mainConvertTransaction.blockHash;

      if (sameBlockAsConvert) {
        // Skip 0-amount MWEB kernel/peg transactions by including them
        // in the convert set so they don't appear as ghost transactions
        if (
          Number(relatedTx.amount) === 0 &&
          Number(relatedTx.totalFees) === 0
        ) {
          return true;
        }

        // For same-block transactions, only include if:
        // 1) It's a receive to one of our addresses AND
        // 2) It clearly relates to the convert (see conditions below)
        const isReceiveToUs =
          Number(relatedTx.amount) > 0 &&
          relatedTx.outputDetails?.some(o => o.isOurAddress === true) &&
          !hasDestinationAddress;

        if (isReceiveToUs) {
          // Main convert receive (exact to destination)
          const amountMatchesTarget =
            Math.abs(
              Number(relatedTx.amount) - Number(convertTx.targetAmount),
            ) < 1000;

          // MWEB signal (outputType 12) to one of our addresses
          const isMWebChange =
            relatedTx.outputDetails?.some(
              od => od.isOurAddress === true && od.outputType === 12,
            ) ?? false;

          // Receives usually have no inputs
          const looksLikeReceiveNoInputs =
            (relatedTx.previousOutpoints?.length ?? 0) === 0;

          // Total selected inputs for this convert
          const selectedUtxosTotal =
            convertTx.selectedUtxos?.reduce(
              (s, u) => s + Number(u.amountSat),
              0,
            ) ?? 0;

          // Expected change before fees
          const expectedChangeBudget = Math.max(
            0,
            selectedUtxosTotal - Number(convertTx.targetAmount),
          );

          // Tolerance band: max(25k sats, 0.05% of selected inputs)
          const tolerance = Math.max(
            25_000,
            Math.floor(selectedUtxosTotal * 0.0005),
          );

          // Budget match
          const amountMatchesChangeBudget =
            Math.abs(Number(relatedTx.amount) - expectedChangeBudget) <=
            tolerance;

          // Check if this transaction's outputs include any address that appears
          // in the selected UTXOs (indicating it might be change from the same operation)
          const hasRelatedAddress =
            !!convertTx.selectedUtxos &&
            (relatedTx.outputDetails?.some(output =>
              convertTx.selectedUtxos!.some(
                utxo => utxo.address === output.address,
              ),
            ) ??
              false);

          // Check if this transaction receives to an address that appears as an output
          // in the main convert transaction (indicating it's change being received)
          const receivesToChangeAddress =
            relatedTx.outputDetails?.some(output =>
              mainConvertTransaction.outputDetails?.some(
                mainOutput =>
                  mainOutput.address === output.address &&
                  mainOutput.isOurAddress,
              ),
            ) ?? false;

          // Include if it matches target amount, has related address, receives to change address,
          // or looks like MWEB change (with budget band and no-inputs guard)
          return (
            amountMatchesTarget ||
            hasRelatedAddress ||
            receivesToChangeAddress ||
            (isMWebChange &&
              looksLikeReceiveNoInputs &&
              amountMatchesChangeBudget)
          );
        }
      }

      return false;
    });

    // For convert transactions, don't include input transactions (second pass)
    // This prevents outputs from previously spent transactions from being merged
    const allRelatedTxs = directlyRelated;

    // Mark all as processed and create a single convert transaction
    processedConvertTxs.add(convertKey);
    allRelatedTxs.forEach(tx => {
      if (tx.txHash) {
        processedConvertTxHashes.add(tx.txHash);
      }
    });

    // Create the merged convert transaction
    const mergedInputDetails: PreviousOutPoint[] = [];
    const mergedOutputDetails: IOutputDetails[] = [];
    const mergedPreviousOutpoints: PreviousOutPoint[] = [];
    let totalFees = 0;
    let receiveTx: (typeof allRelatedTxs)[0] | undefined;
    let sendTx: (typeof allRelatedTxs)[0] | undefined;

    // Use a Map to deduplicate outputs by address
    const outputMap = new Map<string, IOutputDetails>();

    allRelatedTxs.forEach(relatedTx => {
      if (Number(relatedTx.amount) > 0) {
        const hasDestinationAddress = relatedTx.outputDetails?.some(
          output => output.address === convertTx.destinationAddress,
        );
        const amountMatches =
          Math.abs(Number(relatedTx.amount) - convertTx.targetAmount) < 1000;

        if (hasDestinationAddress && amountMatches) {
          receiveTx = relatedTx;
        }
      } else {
        sendTx = relatedTx;
      }

      // Merge output details with deduplication
      relatedTx.outputDetails?.forEach((outputDetail: any) => {
        const output: IOutputDetails = {
          address: outputDetail.address,
          amount: Number(outputDetail.amount),
          isOurAddress: outputDetail.isOurAddress,
          outputIndex: Number(outputDetail.outputIndex),
          outputType: outputDetail.outputType,
          pkScript: outputDetail.pkScript,
        };

        // Use address as key for deduplication
        const key = outputDetail.address;
        if (!outputMap.has(key)) {
          outputMap.set(key, output);
        }
      });

      // Merge previous outpoints (these represent inputs)
      relatedTx.previousOutpoints?.forEach(prevOutpoint => {
        mergedInputDetails.push(prevOutpoint);
        mergedPreviousOutpoints.push(prevOutpoint);
      });

      totalFees += Number(relatedTx.totalFees);
    });

    // Convert the deduplicated outputs map to array
    outputMap.forEach(output => mergedOutputDetails.push(output));

    // Create the convert transaction using the main convert transaction as base
    const priceOnDate =
      (await getPriceOnDate(Number(mainConvertTransaction.timeStamp))) || 0;

    const processedTx: ProcessedConvertTransaction = {
      txHash: mainConvertTransaction.txHash || '',
      blockHash: mainConvertTransaction.blockHash,
      blockHeight: mainConvertTransaction.blockHeight,
      amount: Number(mainConvertTransaction.amount),
      numConfirmations: mainConvertTransaction.numConfirmations,
      timeStamp: String(mainConvertTransaction.timeStamp),
      fee: Number(mainConvertTransaction.totalFees),
      outputDetails: mergedOutputDetails,
      previousOutpoints: mergedPreviousOutpoints,
      label: mainConvertTransaction.label || '',
      metaLabel: 'Convert',
      priceOnDate,
      tradeTx: {
        conversionType: convertTx.conversionType,
        destinationAddress: convertTx.destinationAddress,
        targetAmount: convertTx.targetAmount,
        timestamp: convertTx.timestamp,
        selectedUtxos: convertTx.selectedUtxos,
        mergedInputDetails,
        mergedOutputDetails,
        totalFees,
        ...(sendTx?.txHash && {sendTxHash: sendTx.txHash}),
        ...(receiveTx?.txHash && {receiveTxHash: receiveTx.txHash}),
      },
    };

    processedTransactions.push(processedTx);
  }

  return {
    processedTransactions,
    processedTxHashes: processedConvertTxHashes,
  };
}
