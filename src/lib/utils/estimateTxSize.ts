// MIT License

// Copyright (c) 2020 Jameson Lopp
// https://github.com/jlopp/bitcoin-transaction-size-calculator/blob/master/index.html

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

// constants
const P2PKH_IN_SIZE = 148;
const P2SH_P2WPKH_IN_SIZE = 90.75;
const P2WPKH_IN_SIZE = 67.75;
const P2TR_IN_SIZE = 57.25;
const P2WPKH_OUT_SIZE = 31;
const PUBKEY_SIZE = 33;
const SIGNATURE_SIZE = 72;

const getSizeOfScriptLengthElement = (length: number) => {
  if (length < 75) {
    return 1;
  } else if (length <= 255) {
    return 2;
  } else if (length <= 65535) {
    return 3;
  } else if (length <= 4294967295) {
    return 5;
  } else {
    throw new Error('Size of redeem script is too large');
  }
};

const getSizeOfVarInt = (length: number) => {
  if (length < 253) {
    return 1;
  } else if (length < 65535) {
    return 3;
  } else if (length < 4294967295) {
    return 5;
  } else if (length < 18446744073709551615) {
    return 9;
  } else {
    throw new Error('Invalid var int');
  }
};

const getTxOverheadVBytes = (
  inputScript: string,
  inputCount: number,
): number => {
  if (inputScript === 'P2PKH' || inputScript === 'P2SH') {
    var witness_vbytes = 0;
  } else {
    // Transactions with segwit inputs have extra overhead
    var witness_vbytes =
      0.25 + // segwit marker
      0.25 + // segwit flag
      inputCount / 4; // witness element count per input
  }

  return (
    4 + // nVersion
    getSizeOfVarInt(inputCount) + // number of inputs
    getSizeOfVarInt(1) + // number of outputs
    4 + // nLockTime
    witness_vbytes
  );
};

export const estimateTxSize = (
  inputScript: string,
  inputCount: number,
): number => {
  // assumptions made
  // single signature & pubkey per input
  // single output - always P2WPKH

  let inputSize = 0;
  let inputWitnessSize = 0;

  switch (inputScript) {
    case 'P2PKH':
      inputSize = P2PKH_IN_SIZE;
      break;
    case 'P2SH-P2WPKH':
      inputSize = P2SH_P2WPKH_IN_SIZE;
      inputWitnessSize = 107; // size(signature) + signature + size(pubkey) + pubkey
      break;
    case 'P2WPKH':
      inputSize = P2WPKH_IN_SIZE;
      inputWitnessSize = 107; // size(signature) + signature + size(pubkey) + pubkey
      break;
    case 'P2TR': // Only consider the cooperative taproot signing path; assume multisig is done via aggregate signatures
      inputSize = P2TR_IN_SIZE;
      inputWitnessSize = 65; // getSizeOfVarInt(schnorrSignature) + schnorrSignature;
      break;
    case 'P2SH':
      var redeemScriptSize =
        1 + // OP_M
        (1 + PUBKEY_SIZE) + // OP_PUSH33 <pubkey>
        1 + // OP_N
        1; // OP_CHECKMULTISIG
      var scriptSigSize =
        1 + // size(0)
        (1 + SIGNATURE_SIZE) + // size(SIGNATURE_SIZE) + signature
        getSizeOfScriptLengthElement(redeemScriptSize) +
        redeemScriptSize;
      inputSize = 32 + 4 + getSizeOfVarInt(scriptSigSize) + scriptSigSize + 4;
      break;
    case 'P2SH-P2WSH':
    case 'P2WSH':
      var redeemScriptSize =
        1 + // OP_M
        (1 + PUBKEY_SIZE) + // OP_PUSH33 <pubkey>
        1 + // OP_N
        1; // OP_CHECKMULTISIG
      inputWitnessSize =
        1 + // size(0)
        (1 + SIGNATURE_SIZE) + // size(SIGNATURE_SIZE) + signature
        getSizeOfScriptLengthElement(redeemScriptSize) +
        redeemScriptSize;
      inputSize =
        36 + // outpoint (spent UTXO ID)
        inputWitnessSize / 4 + // witness program
        4; // nSequence
      if (inputScript === 'P2SH-P2WSH') {
        inputSize += 32 + 3; // P2SH wrapper (redeemscript hash) + overhead?
      }
  }

  let txVBytes =
    getTxOverheadVBytes(inputScript, inputCount) +
    inputSize * inputCount +
    P2WPKH_OUT_SIZE;

  return txVBytes;
};
