// The MIT License (MIT)

// Copyright (c) 2011-2020 bitcoinjs-lib contributors

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

import * as bitcoin from 'bitcoinjs-lib';
import {LITECOIN} from './litecoin';

function getWitnessUtxo(utxoHex: string, value: number): any {
  let out = {script: {}, value: 0};
  out.script = Buffer.from(utxoHex, 'hex');
  out.value = value;
  return out;
}

export default function ƒ(
  txId: string,
  vout: number,
  utxoHex: string,
  value: number,
  isSegwit: boolean,
  redeemType: string,
  pubKey: Buffer,
): any {
  const nonWitnessUtxo = Buffer.from(utxoHex, 'hex');

  // for segwit inputs, you only need the output script and value as an object.
  //   const witnessUtxo: any = {};
  const witnessUtxo = getWitnessUtxo(utxoHex, value);

  const mixin = isSegwit ? {witnessUtxo} : {nonWitnessUtxo};

  const mixin2: any = {};
  switch (redeemType) {
    case 'P2SH':
      mixin2.redeemScript = bitcoin.payments.p2sh({
        pubkey: pubKey,
        network: LITECOIN,
      });
      break;
    case 'P2WSH':
      mixin2.witnessScript = bitcoin.payments.p2wsh({
        pubkey: pubKey,
        network: LITECOIN,
      });
      break;
    case 'P2SH-P2WSH':
      mixin2.witnessScript = bitcoin.payments.p2wsh({
        redeem: bitcoin.payments.p2sh({
          pubkey: pubKey,
          network: LITECOIN,
        }),
        network: LITECOIN,
      });
      mixin2.redeemScript = bitcoin.payments.p2sh({
        pubkey: pubKey,
        network: LITECOIN,
      });
      break;
    case 'P2PKH':
    case 'P2WPKH':
    case 'P2SH-P2WPKH':
      //noredeem
      break;
  }

  return {
    hash: txId,
    index: vout,
    ...mixin,
    ...mixin2,
  };
}
