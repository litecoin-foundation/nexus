import {estimateMWEBTransaction} from './estimateFee';

describe('estimateFee compared against real transactions generated with Litecoin Core v0.21.2', () => {
  const transactions = {
    // MWEB to P2WPKH (peg-out)
    pegOut: {
      inputs: [],
      outputs: [{type: 'P2WPKH'}], // Regular output
      mwebInputs: [{}], // MWEB input spent
      mwebOutputs: [{}], // MWEB change output
      mwebKernels: [{pegout: true}], // Peg-out kernel with weight 4
    },

    // P2WPKH to MWEB (peg-in)
    pegIn: {
      inputs: [{type: 'P2WPKH'}], // 1 P2WPKH input
      outputs: [
        {type: 'witness_mweb_pegin'}, // Peg-in output
      ],
      mwebOutputs: [{}, {}], // 2 MWEB outputs (actual + change)
      mwebKernels: [{hasStealthExcess: true, pegin: true}], // Peg-in kernel with stealth
    },

    // MWEB to MWEB
    mwebToMweb: {
      inputs: [],
      outputs: [],
      mwebInputs: [{}], // 1 MWEB input
      mwebOutputs: [{}, {}], // 2 MWEB outputs (destination + change)
      mwebKernels: [{hasStealthExcess: true}],
    },

    // 1 P2WPKH -> MWEB + Change (P2WPKH)
    peginWithChange: {
      inputs: [{type: 'P2WPKH'}], // 1 P2WPKH input
      outputs: [
        {type: 'witness_mweb_pegin'}, // peg-in output on L1
        {type: 'P2WPKH'}, // change on L1
      ],
      mwebInputs: [], // no MWEB inputs (peg-in)
      mwebOutputs: [{}], // 1 MWEB output to the recipient
      mwebKernels: [{hasStealthExcess: true, pegin: true}], // standard kernel w/ stealth
    },

    // 2 P2WPKH -> MWEB + Change (P2WPKH)
    dualPeginWithChange: {
      inputs: [{type: 'P2WPKH'}, {type: 'P2WPKH'}],
      outputs: [{type: 'witness_mweb_pegin'}, {type: 'P2WPKH'}],
      mwebInputs: [],
      mwebOutputs: [{}],
      mwebKernels: [{hasStealthExcess: true, pegin: true}],
    },

    // 2 P2WPKH + 1 MWEB -> MWEB + Change (P2WPKH)
    dualPeginWithMWEBInputWithChange: {
      inputs: [{type: 'P2WPKH'}, {type: 'P2WPKH'}],
      outputs: [{type: 'witness_mweb_pegin'}, {type: 'P2WPKH', fundedBy: 'L1'}],
      mwebInputs: [{}],
      mwebOutputs: [{}],
      mwebKernels: [{hasStealthExcess: true, pegin: true}],
    },

    // 4 P2WPKH -> 1 P2WPKH
    quadInputs: {
      inputs: [
        {type: 'P2WPKH'},
        {type: 'P2WPKH'},
        {type: 'P2WPKH'},
        {type: 'P2WPKH'},
      ],
      outputs: [{type: 'P2WPKH'}],
      mwebInputs: [],
      mwebOutputs: [],
      mwebKernels: [],
    },

    tripleInputPeginWithChange: {
      inputs: [{type: 'P2WPKH'}, {type: 'P2WPKH'}, {type: 'P2WPKH'}],
      outputs: [{type: 'witness_mweb_pegin'}, {type: 'P2WPKH', fundedBy: 'L1'}],
      mwebInputs: [],
      mwebOutputs: [{}],
      mwebKernels: [{hasStealthExcess: true, pegin: true}],
    },
  };

  const reference = {
    pegOut: {vsize: 31, weight: 124, mwebWeight: 22, fee: 2510},
    pegIn: {vsize: 163, weight: 649, mwebWeight: 39, fee: 5530},
    mwebToMweb: {vsize: 0, weight: 0, mwebWeight: 39, fee: 3900},
    peginWithChange: {vsize: 194, mwebWeight: 21, fee: 4040},
    dualPeginWithChange: {},
    dualPeginWithMWEBInputWithChange: {},
    quadInputs: {},
  };

  const feeRate = 10; // 10 sat/vB
  const mwebFeeRate = 100;

  it('MWEB to P2WPKH (peg-out)', () => {
    const est = estimateMWEBTransaction(
      transactions.pegOut,
      feeRate,
      mwebFeeRate,
    );
    expect(est.virtualSize).toBe(reference.pegOut.vsize);
    expect(est.weight).toBe(reference.pegOut.weight);
    expect(est.mwebWeight).toBe(reference.pegOut.mwebWeight);
    expect(est.fees.total).toBe(reference.pegOut.fee);
    expect(est.fees.mweb).toBe(est.mwebWeight * mwebFeeRate);
    expect(est.fees.total).toBe(est.fees.regular + est.fees.mweb);
    expect(est.validation.isWithinBlockLimit).toBe(true);
    expect(est.validation.isWithinMWEBLimit).toBe(true);
  });

  it('P2WPKH to MWEB (peg-in)', () => {
    const est = estimateMWEBTransaction(
      transactions.pegIn,
      feeRate,
      mwebFeeRate,
    );
    expect(est.virtualSize).toBe(reference.pegIn.vsize);
    expect(est.weight).toBe(reference.pegIn.weight);
    expect(est.mwebWeight).toBe(reference.pegIn.mwebWeight);
    expect(est.fees.total).toBe(reference.pegIn.fee);
    expect(est.validation.isWithinBlockLimit).toBe(true);
    expect(est.validation.isWithinMWEBLimit).toBe(true);
  });

  it('MWEB to MWEB', () => {
    const est = estimateMWEBTransaction(
      transactions.mwebToMweb,
      feeRate,
      mwebFeeRate,
    );
    expect(est.virtualSize).toBe(reference.mwebToMweb.vsize);
    expect(est.weight).toBe(reference.mwebToMweb.weight);
    expect(est.mwebWeight).toBe(reference.mwebToMweb.mwebWeight);
    expect(est.fees.total).toBe(reference.mwebToMweb.fee);
    expect(est.fees.regular).toBe(0);
    expect(est.validation.isWithinBlockLimit).toBe(true);
    expect(est.validation.isWithinMWEBLimit).toBe(true);
  });

  it('1 P2WPKH -> MWEB + Change (P2WPKH)', () => {
    const est = estimateMWEBTransaction(
      transactions.peginWithChange,
      feeRate,
      mwebFeeRate,
    );

    expect(est.virtualSize).toBe(reference.peginWithChange.vsize);
    expect(est.mwebWeight).toBe(reference.peginWithChange.mwebWeight);
    expect(est.fees.total).toBe(reference.peginWithChange.fee);
    expect(est.validation.isWithinBlockLimit).toBe(true);
    expect(est.validation.isWithinMWEBLimit).toBe(true);
  });

  it('2 P2WPKH -> MWEB + Change (P2WPKH)', () => {
    const est = estimateMWEBTransaction(
      transactions.dualPeginWithChange,
      feeRate,
      mwebFeeRate,
    );

    expect(est.virtualSize).toBe(261);
    expect(est.weight).toBe(1042);
    expect(est.mwebWeight).toBe(21);
    expect(est.fees.total).toBe(4710);
    expect(est.validation.isWithinBlockLimit).toBe(true);
    expect(est.validation.isWithinMWEBLimit).toBe(true);
  });

  it('2 P2WPKH + 1 MWEB -> MWEB + Change (P2WPKH)', () => {
    const est = estimateMWEBTransaction(
      transactions.dualPeginWithMWEBInputWithChange,
      feeRate,
      mwebFeeRate,
    );

    expect(est.virtualSize).toBe();
    expect(est.weight).toBe();
    expect(est.mwebWeight).toBe();
    expect(est.fees.total).toBe();
    expect(est.validation.isWithinBlockLimit).toBe(true);
    expect(est.validation.isWithinMWEBLimit).toBe(true);
  });

  it('3 P2WPKH -> MWEB + Change (P2WPKH)', () => {
    const est = estimateMWEBTransaction(
      transactions.tripleInputPeginWithChange,
      feeRate,
      mwebFeeRate,
    );

    // expect(est.virtualSize).toBe();
    // expect(est.weight).toBe();
    // expect(est.mwebWeight).toBe();
    expect(est.fees.total).toBe(6880);
    expect(est.validation.isWithinBlockLimit).toBe(true);
    expect(est.validation.isWithinMWEBLimit).toBe(true);
  });
});
