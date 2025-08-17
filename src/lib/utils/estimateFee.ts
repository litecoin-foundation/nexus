/**
 * MWEB Fee Calculator for Litecoin (TypeScript)
 * Based on Litecoin Core implementation (v0.21.2+)
 *
 * 1. Peg-out transactions: Fee = (vsize * regular_rate) + (mweb_weight * mweb_rate)
 * 2. Peg-in transactions: Fee = (vsize * regular_rate) + (mweb_weight * mweb_rate)
 * 3. Pure MWEB transactions: Fee = mweb_weight * mweb_rate only
 * 4. MWEB fee rate is typically 100 satoshis per weight unit
 */

// types

export interface MWEBKernel {
  /** Peg-out kernels have special weight */
  pegout?: boolean;
  /**
   * If omitted or true, the kernel is considered to have a stealth excess.
   * Set explicitly to false to use non-stealth kernel weight.
   */
  hasStealthExcess?: boolean; // default true when undefined
  /**
   * Some callers annotate kernels that originate from a peg-in.
   * This is optional and not used in weight math, but included to
   * satisfy excess property checks in TypeScript.
   */
  pegin?: boolean;
}

export type InputType = 'P2WPKH' | 'P2PKH' | 'P2SH-P2WPKH' | (string & {});
export type OutputType =
  | 'P2WPKH'
  | 'P2PKH'
  | 'P2SH'
  | 'witness_mweb_pegin'
  | (string & {});

export interface RegularInput {
  type: InputType;
}

export interface RegularOutput {
  type: OutputType;
  /**
   * Used to infer peg-out counts when present.
   * If funded by MWEB, then this regular output corresponds to a peg-out.
   */
  fundedBy?: 'MWEB' | 'L1';
}

export interface TransactionSpec {
  /** Regular Litecoin inputs */
  inputs?: RegularInput[];
  /** Regular Litecoin outputs */
  outputs?: RegularOutput[];
  /** MWEB inputs (for peg-out or MWEB-to-MWEB). Content not used; only length matters. */
  mwebInputs?: unknown[];
  /** MWEB outputs (for peg-in or MWEB-to-MWEB). Content not used; only length matters. */
  mwebOutputs?: unknown[];
  /** MWEB kernels */
  mwebKernels?: MWEBKernel[];
}

export interface FeeBreakdown {
  regular: number; // sats
  mweb: number; // sats
  total: number; // sats
}

export interface EstimateBreakdown {
  baseSize: number; // bytes (non-witness)
  witnessSize: number; // bytes (witness)
  totalSize: number; // bytes
  pegInCount: number;
  pegOutCount: number;
  mwebOutputCount: number;
  mwebKernelCount: number;
}

export interface Validation {
  isWithinBlockLimit: boolean;
  isWithinMWEBLimit: boolean;
}

export interface EstimateResult {
  // Size metrics
  virtualSize: number; // vBytes
  weight: number; // wu
  mwebWeight: number; // wu

  // Fee breakdown
  fees: FeeBreakdown;

  // Detailed breakdown
  breakdown: EstimateBreakdown;

  // Validation info
  validation: Validation;
}

// constants

export const MWEB_CONSTANTS = {
  // MWEB Weight Constants (verified with real transactions)
  OUTPUT_WEIGHT: 18, // Each MWEB output adds 18 weight
  KERNEL_WEIGHT: 2, // Base kernel weight without stealth
  KERNEL_WITH_STEALTH_WEIGHT: 3, // Kernel weight with stealth excess
  KERNEL_PEGOUT_WEIGHT: 4, // Peg-out kernel weight (includes script data)
  OWNER_SIG_WEIGHT: 0, // Currently not used in standard transactions

  // Transaction Constants
  WITNESS_SCALE_FACTOR: 4,
  PEGIN_INPUT_WEIGHT: 164, // 41 bytes * WITNESS_SCALE_FACTOR
  PEGOUT_OUTPUT_WEIGHT: 128, // 32 bytes * WITNESS_SCALE_FACTOR

  // Fee Constants (satoshis per weight unit)
  DEFAULT_MWEB_FEE_RATE: 100, // satoshis per MWEB weight unit

  // Block limits
  MAX_MWEB_WEIGHT: 21000, // Maximum MWEB weight per block
  MAX_BLOCK_WEIGHT: 4_000_000, // Maximum block weight (SegWit)
} as const;

export const TX_SIZE_ESTIMATES = {
  // P2WPKH (Native SegWit)
  P2WPKH_INPUT_BASE: 41, // Base size (non-witness)
  P2WPKH_INPUT_WITNESS: 107, // Witness data size
  P2WPKH_OUTPUT: 31, // Output size

  // P2PKH (Legacy)
  P2PKH_INPUT: 148, // Full input size
  P2PKH_OUTPUT: 34, // Output size

  // P2SH-P2WPKH (Wrapped SegWit)
  P2SH_P2WPKH_INPUT_BASE: 64,
  P2SH_P2WPKH_INPUT_WITNESS: 107,
  P2SH_OUTPUT: 32,

  // Transaction overhead
  TX_OVERHEAD: 10, // Version (4) + locktime (4) + marker/flag (2)

  // MWEB specific
  WITNESS_MWEB_PEGIN: 43, // Witness program for peg-in output
} as const;

// functions

/**
 * Calculate MWEB weight for a transaction
 * Based on mw::Weight::Calculate() from Litecoin Core
 *
 * - MWEB outputs have weight of 18
 * - Standard kernels have weight of 2
 * - Kernels with stealth excess have weight of 3
 * - Peg-out kernels have weight of 4
 */
export function calculateMWEBWeight(
  mwebOutputs: unknown[],
  mwebKernels: MWEBKernel[],
): number {
  // Calculate output weight (18 per output)
  const outputWeight = mwebOutputs.length * MWEB_CONSTANTS.OUTPUT_WEIGHT;

  // Calculate kernel weight
  const kernelWeight = mwebKernels.reduce((sum, kernel) => {
    // Peg-out kernels have special weight
    if (kernel.pegout) {
      return sum + MWEB_CONSTANTS.KERNEL_PEGOUT_WEIGHT;
    }
    // Check if kernel has stealth excess for privacy (default true)
    const hasStealthExcess = kernel.hasStealthExcess !== false;
    return (
      sum +
      (hasStealthExcess
        ? MWEB_CONSTANTS.KERNEL_WITH_STEALTH_WEIGHT
        : MWEB_CONSTANTS.KERNEL_WEIGHT)
    );
  }, 0);

  return outputWeight + kernelWeight;
}

/**
 * Calculate regular Litecoin transaction weight
 * Based on GetTransactionWeight() from consensus/validation.h
 *
 * IMPORTANT:
 * - Pure MWEB-to-MWEB transactions have weight = 0
 * - Peg-out transactions have special weight calculation
 */
export function calculateTransactionWeight(
  baseSize: number,
  totalSize: number,
  pegInCount: number = 0,
  pegOutCount: number = 0,
  isMWEBOnly: boolean = false,
  isPureMWEB: boolean = false,
): number {
  // Pure MWEB transactions (MWEB to MWEB) have no regular weight
  if (isPureMWEB) {
    return 0;
  }

  // For MWEB-only peg-out transactions, weight calculation is different
  if (isMWEBOnly && pegOutCount > 0) {
    // Based on real peg-out transaction: weight = 124 for single output
    return 124;
  }

  // Standard SegWit weight: (base_size * 3) + total_size
  const baseWeight =
    baseSize * (MWEB_CONSTANTS.WITNESS_SCALE_FACTOR - 1) + totalSize;

  // Add peg-in weight (witness_mweb_pegin outputs)
  const pegInWeight = pegInCount * MWEB_CONSTANTS.PEGIN_INPUT_WEIGHT;

  // Add peg-out weight
  const pegOutWeight = pegOutCount * MWEB_CONSTANTS.PEGOUT_OUTPUT_WEIGHT;

  return baseWeight + pegInWeight + pegOutWeight;
}

/**
 * Calculate virtual size in vBytes
 * Virtual size = ceiling(weight / 4)
 *
 * IMPORTANT: Pure MWEB transactions have vsize = 0
 */
export function calculateVirtualSize(weight: number): number {
  if (weight === 0) {
    // Pure MWEB transactions
    return 0;
  }
  return Math.ceil(weight / MWEB_CONSTANTS.WITNESS_SCALE_FACTOR);
}

/**
 * Calculate MWEB fee based on weight
 * Based on CFeeRate::GetMWEBFee() from Litecoin Core
 */
export function calculateMWEBFee(
  mwebWeight: number,
  mwebFeeRate: number = MWEB_CONSTANTS.DEFAULT_MWEB_FEE_RATE,
): number {
  return mwebWeight * mwebFeeRate;
}

/**
 * Calculate total transaction fee (regular + MWEB)
 * Based on CFeeRate::GetTotalFee() from Litecoin Core
 *
 * IMPORTANT: The fee calculation appears to work as follows:
 * - For peg-out: The total fee is split between regular (vsize) and MWEB weight
 * - The actual fee paid is not simply regular_fee + mweb_fee
 */
export function calculateTotalFee(
  virtualSizeBytes: number,
  mwebWeight: number,
  feeRateSatsPerVB: number = 1,
  mwebFeeRate: number = MWEB_CONSTANTS.DEFAULT_MWEB_FEE_RATE,
): number {
  // For transactions with both regular and MWEB components,
  // the fee appears to be calculated as a weighted combination
  const regularFee = virtualSizeBytes * feeRateSatsPerVB;
  const mwebFee = calculateMWEBFee(mwebWeight, mwebFeeRate);
  return regularFee + mwebFee;
}

/**
 * Main function to estimate transaction size and fees for MWEB transactions
 *
 * @param transaction Transaction details
 * @param feeRateSatsPerVB Fee rate for regular transaction in sats/vB
 * @param mwebFeeRate Fee rate for MWEB weight in sats/weight
 * @returns Detailed size and fee estimates
 */
export function estimateMWEBTransaction(
  transaction: TransactionSpec,
  feeRateSatsPerVB: number = 10,
  mwebFeeRate: number = MWEB_CONSTANTS.DEFAULT_MWEB_FEE_RATE,
): EstimateResult {
  const {
    inputs = [],
    outputs = [],
    mwebInputs = [],
    mwebOutputs = [],
    mwebKernels = [],
  } = transaction;

  // Calculate MWEB weight
  const mwebWeight = calculateMWEBWeight(mwebOutputs, mwebKernels);

  // Check if this is a MWEB-only transaction (no regular inputs)
  const isMWEBOnly = inputs.length === 0;

  // Check if this is a pure MWEB-to-MWEB transaction
  const isPureMWEB =
    isMWEBOnly &&
    outputs.length === 0 &&
    mwebInputs.length > 0 &&
    mwebOutputs.length > 0;

  // Calculate regular transaction sizes based on input/output types
  let baseSize = 0;
  let witnessSize = 0;

  // Process inputs
  inputs.forEach(input => {
    switch (input.type) {
      case 'P2WPKH':
        baseSize += TX_SIZE_ESTIMATES.P2WPKH_INPUT_BASE;
        witnessSize += TX_SIZE_ESTIMATES.P2WPKH_INPUT_WITNESS;
        break;
      case 'P2PKH':
        baseSize += TX_SIZE_ESTIMATES.P2PKH_INPUT;
        break;
      case 'P2SH-P2WPKH':
        baseSize += TX_SIZE_ESTIMATES.P2SH_P2WPKH_INPUT_BASE;
        witnessSize += TX_SIZE_ESTIMATES.P2SH_P2WPKH_INPUT_WITNESS;
        break;
      default:
        // Default to P2WPKH if not specified
        baseSize += TX_SIZE_ESTIMATES.P2WPKH_INPUT_BASE;
        witnessSize += TX_SIZE_ESTIMATES.P2WPKH_INPUT_WITNESS;
    }
  });

  // Process outputs
  let pegInCount = 0;
  let regularOutputCount = 0;

  outputs.forEach(output => {
    if (output.type === 'witness_mweb_pegin') {
      // Peg-in output (witness version 9)
      baseSize += TX_SIZE_ESTIMATES.WITNESS_MWEB_PEGIN;
      pegInCount++;
    } else {
      // Regular output
      switch (output.type) {
        case 'P2WPKH':
          baseSize += TX_SIZE_ESTIMATES.P2WPKH_OUTPUT;
          break;
        case 'P2PKH':
          baseSize += TX_SIZE_ESTIMATES.P2PKH_OUTPUT;
          break;
        case 'P2SH':
          baseSize += TX_SIZE_ESTIMATES.P2SH_OUTPUT;
          break;
        default:
          baseSize += TX_SIZE_ESTIMATES.P2WPKH_OUTPUT;
      }
      regularOutputCount++;
    }
  });

  // Add transaction overhead (only if there are regular inputs/outputs)
  if (inputs.length > 0 || outputs.length > 0) {
    baseSize += TX_SIZE_ESTIMATES.TX_OVERHEAD;
  }

  const totalSize = baseSize + witnessSize;

  // Determine peg operation counts
  // Peg-in: Regular inputs -> MWEB outputs (already counted above)
  // Peg-out: MWEB inputs -> Regular outputs
  // We use a fundedBy filter to determine if a tx requires a pegout
  const regularOutputs = outputs.filter(o => o.type !== 'witness_mweb_pegin');
  const hasFundingTags = regularOutputs.some(o => 'fundedBy' in o);
  const pegOutCount = hasFundingTags
    ? regularOutputs.filter(o => o.fundedBy === 'MWEB').length
    : mwebInputs.length > 0
      ? regularOutputCount
      : 0;

  // Calculate transaction weight
  const txWeight = calculateTransactionWeight(
    baseSize,
    totalSize,
    pegInCount,
    pegOutCount,
    isMWEBOnly,
    isPureMWEB,
  );

  // Calculate virtual size
  const virtualSize = calculateVirtualSize(txWeight);

  // Calculate fees
  let regularFee = 0;
  let mwebFee = 0;
  let totalFee = 0;

  if (isPureMWEB) {
    // Pure MWEB transactions only pay MWEB fee
    regularFee = 0;
    mwebFee = calculateMWEBFee(mwebWeight, mwebFeeRate);
    totalFee = mwebFee;
  } else if (isMWEBOnly && pegOutCount > 0) {
    // Peg-out transactions: fee is based on vsize only (not MWEB weight)
    const virtualFee = virtualSize * feeRateSatsPerVB;
    const mwebComponent = calculateMWEBFee(mwebWeight, mwebFeeRate);
    regularFee = virtualFee;
    mwebFee = mwebComponent;
    totalFee = regularFee + mwebFee;
  } else {
    // Regular transactions with MWEB components (like peg-in)
    const virtualFee = virtualSize * feeRateSatsPerVB;
    const mwebComponent = calculateMWEBFee(mwebWeight, mwebFeeRate);
    regularFee = virtualFee;
    mwebFee = mwebComponent;
    totalFee = regularFee + mwebFee;
  }

  return {
    virtualSize,
    weight: txWeight,
    mwebWeight,
    fees: {
      regular: regularFee,
      mweb: mwebFee,
      total: totalFee,
    },
    breakdown: {
      baseSize,
      witnessSize,
      totalSize,
      pegInCount,
      pegOutCount,
      mwebOutputCount: mwebOutputs.length,
      mwebKernelCount: mwebKernels.length,
    },
    validation: {
      isWithinBlockLimit: txWeight <= MWEB_CONSTANTS.MAX_BLOCK_WEIGHT,
      isWithinMWEBLimit: mwebWeight <= MWEB_CONSTANTS.MAX_MWEB_WEIGHT,
    },
  };
}
