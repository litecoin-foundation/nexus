// Helper for MWEB target transactions
const buildMWEBTarget = (params: {
  inputs: Array<{type: string}>;
  mwebInputs: Array<{}>;
  outputs: Array<{type: string; fundedBy?: string}>;
  mwebOutputs: Array<{}>;
  mwebKernels: Array<{
    hasStealthExcess?: boolean;
    pegin?: boolean;
    pegout?: boolean;
  }>;
  regularInputAmount: number;
  mwebInputAmount: number;
  sendAmount: number;
  estimatedFee: number;
  hasChange: boolean;
  DUST_THRESHOLD: number;
}) => {
  const {
    inputs,
    mwebInputs,
    outputs,
    mwebOutputs,
    mwebKernels,
    regularInputAmount,
    mwebInputAmount,
    sendAmount,
    estimatedFee,
    hasChange,
    DUST_THRESHOLD,
  } = params;

  if (inputs.length > 0) {
    // L1 → MWEB (peg-in)
    outputs.push({type: 'witness_mweb_pegin'});
    mwebOutputs.push({});
    mwebKernels.push({hasStealthExcess: true, pegin: true});

    if (hasChange) {
      // Determine change allocation
      const totalCost = sendAmount + estimatedFee;

      if (regularInputAmount >= totalCost) {
        // L1 inputs cover everything, L1 change
        outputs.push({type: 'P2WPKH', fundedBy: 'L1'});
      } else if (mwebInputs.length > 0) {
        // Mixed scenario - distribute change
        const regularRemainder = Math.max(0, regularInputAmount - estimatedFee);
        const mwebRemainder = Math.max(0, mwebInputAmount - sendAmount);

        if (regularRemainder > DUST_THRESHOLD) {
          outputs.push({type: 'P2WPKH', fundedBy: 'L1'});
        }
        if (mwebRemainder > DUST_THRESHOLD) {
          mwebOutputs.push({}); // MWEB change
        }
      }
    }
  } else {
    // Pure MWEB → MWEB
    mwebOutputs.push({}); // Recipient
    mwebKernels.push({hasStealthExcess: true});

    if (hasChange) {
      mwebOutputs.push({}); // Change
    }
  }

  return {inputs, outputs, mwebInputs, mwebOutputs, mwebKernels};
};

// Helper for regular target transactions
const buildRegularTarget = (params: {
  inputs: Array<{type: string}>;
  mwebInputs: Array<{}>;
  outputs: Array<{type: string; fundedBy?: string}>;
  mwebOutputs: Array<{}>;
  mwebKernels: Array<{
    hasStealthExcess?: boolean;
    pegin?: boolean;
    pegout?: boolean;
  }>;
  regularInputAmount: number;
  mwebInputAmount: number;
  sendAmount: number;
  estimatedFee: number;
  hasChange: boolean;
  DUST_THRESHOLD: number;
}) => {
  const {
    inputs,
    mwebInputs,
    outputs,
    mwebOutputs,
    mwebKernels,
    regularInputAmount,
    mwebInputAmount,
    sendAmount,
    estimatedFee,
    hasChange,
    DUST_THRESHOLD,
  } = params;

  if (mwebInputs.length > 0) {
    // MWEB inputs present
    if (inputs.length > 0) {
      // Mixed inputs - determine funding source
      if (regularInputAmount >= sendAmount + estimatedFee) {
        // L1 funds target + fee
        outputs.push({type: 'P2WPKH', fundedBy: 'L1'});

        if (hasChange) {
          const regularRemainder =
            regularInputAmount - sendAmount - estimatedFee;
          if (regularRemainder > DUST_THRESHOLD) {
            outputs.push({type: 'P2WPKH', fundedBy: 'L1'});
          }
          if (mwebInputAmount > DUST_THRESHOLD) {
            mwebOutputs.push({}); // MWEB change (all MWEB input becomes change)
          }
        }
      } else {
        // MWEB funds target (peg-out)
        outputs.push({type: 'P2WPKH', fundedBy: 'MWEB'});
        mwebKernels.push({pegout: true});

        if (hasChange) {
          if (regularInputAmount > estimatedFee + DUST_THRESHOLD) {
            outputs.push({type: 'P2WPKH', fundedBy: 'L1'});
          }
          const mwebRemainder = mwebInputAmount - sendAmount;
          if (mwebRemainder > DUST_THRESHOLD) {
            mwebOutputs.push({}); // MWEB change
          }
        }
      }
    } else {
      // Pure MWEB → regular (peg-out)
      outputs.push({type: 'P2WPKH', fundedBy: 'MWEB'});
      mwebKernels.push({pegout: true});

      if (hasChange) {
        mwebOutputs.push({}); // MWEB change
      }
    }
  } else {
    // Pure L1 → regular (standard)
    outputs.push({type: 'P2WPKH', fundedBy: 'L1'});

    if (hasChange) {
      outputs.push({type: 'P2WPKH', fundedBy: 'L1'});
    }
  }

  return {inputs, outputs, mwebInputs, mwebOutputs, mwebKernels};
};

// Refined version of buildTransactionSpec function
export const buildTransactionSpec = (params: {
  regularUtxos: any[];
  mwebUtxos: any[];
  regularInputAmount: number;
  mwebInputAmount: number;
  sendAmount: number;
  isTargetMWEB: boolean;
  estimatedFee: number;
  totalInputAmount: number;
  DUST_THRESHOLD: number;
}) => {
  const {
    regularUtxos,
    mwebUtxos,
    regularInputAmount,
    mwebInputAmount,
    sendAmount,
    isTargetMWEB,
    estimatedFee,
    totalInputAmount,
    DUST_THRESHOLD,
  } = params;

  // Basic transaction structure
  const inputs = regularUtxos.map(() => ({type: 'P2WPKH'}));
  const mwebInputs = mwebUtxos.map(() => ({}));

  let outputs: Array<{type: string; fundedBy?: string}> = [];
  let mwebOutputs: Array<{}> = [];
  let mwebKernels: Array<{
    hasStealthExcess?: boolean;
    pegin?: boolean;
    pegout?: boolean;
  }> = [];

  // Calculate total cost and change
  const totalCost = sendAmount + estimatedFee;
  const totalChange = totalInputAmount - totalCost;
  const hasChange = totalChange > DUST_THRESHOLD;

  if (isTargetMWEB) {
    // Sending to MWEB address
    return buildMWEBTarget({
      inputs,
      mwebInputs,
      outputs,
      mwebOutputs,
      mwebKernels,
      regularInputAmount,
      mwebInputAmount,
      sendAmount,
      estimatedFee,
      hasChange,
      DUST_THRESHOLD,
    });
  } else {
    // Sending to regular address
    return buildRegularTarget({
      inputs,
      mwebInputs,
      outputs,
      mwebOutputs,
      mwebKernels,
      regularInputAmount,
      mwebInputAmount,
      sendAmount,
      estimatedFee,
      hasChange,
      DUST_THRESHOLD,
    });
  }
};
