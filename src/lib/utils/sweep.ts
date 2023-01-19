import bjs from 'bitcoinjs-lib';
import bip39 from 'bip39';
import axios from 'axios';
import {BIP32Factory} from 'bip32';
import {ECPairFactory, ECPairInterface} from 'ecpair';
import wif from 'wif';
import {Buffer} from 'buffer';

import ecc from './nobleSecp256k1Wrapper';
import {LITECOIN} from './litecoin';
import {estimateTxSize} from './estimateTxSize';

const ECPair = ECPairFactory(ecc);
const bip32 = BIP32Factory(ecc);
const GAP_LIMIT = 20;

type IMnemonic = string[];

const fetchAddressData = (address: string, index: number) => {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await axios.get(
        `https://sochain.com/api/v2/address/LTC/${address}`,
      );
      const {data} = response.data;

      // check if address was used (received_value > 0)
      if (parseFloat(data.received_value) === 0) {
        reject(false);
      }

      resolve({
        address,
        index,
        balance: data.balance,
        txs: data.txs,
      });
    } catch (err) {
      reject(err);
    }
  });
};

export const scanAccount = async (mnemonic: IMnemonic) => {
  const mnemonicString = mnemonic.join(' ');
  const seed = bip39.mnemonicToSeedSync(mnemonicString);
  const root = bip32.fromSeed(seed, LITECOIN);

  // loop through child addresses with max gap of GAP_LIMIT
  let currentIndex = 0;
  let currentGap = 0;
  const sweepableAddr = [];

  while (currentGap < GAP_LIMIT) {
    // generate address
    const child = root.derivePath(`m/0'/0/${currentIndex}`);
    const {address} = bjs.payments.p2pkh({
      pubkey: child.publicKey,
      network: LITECOIN,
    });

    if (address === undefined) {
      throw new Error('error: address derivation');
    }

    // check address for txs
    try {
      const response = await fetchAddressData(address, currentIndex);
      currentIndex++;
      sweepableAddr.push(response);
    } catch (error) {
      if (error === false) {
        currentIndex++;
        currentGap++;
      }
    }
  }

  return sweepableAddr;
};

// utils for sweeping WIF keys

export const sweepWIF = (wifString: string, receiveAddress: string) => {
  let compressed;
  try {
    const key = wif.decode(wifString);
    compressed = key.compressed;
  } catch (error) {
    throw new Error(String(error));
  }

  const keyPair = ECPair.fromWIF(wifString, LITECOIN);

  let p2shAddress;
  let bech32Address;

  // build p2pkh address
  const legacyAddress = bjs.payments.p2pkh({
    pubkey: keyPair.publicKey,
    network: LITECOIN,
  }).address;
  // sweep p2pkh address
  if (legacyAddress !== undefined) {
    sweepAddress(legacyAddress, receiveAddress, 0, keyPair, 'P2PKH');
  }

  // only compressed WIFs can generate p2sh/bech32
  if (compressed) {
    // build p2sh segwit address
    p2shAddress = bjs.payments.p2sh({
      redeem: bjs.payments.p2wpkh({
        pubkey: keyPair.publicKey,
        network: LITECOIN,
      }),
      network: LITECOIN,
    }).address;
    // build bech32 address
    bech32Address = bjs.payments.p2wpkh({
      pubkey: keyPair.publicKey,
      network: LITECOIN,
    }).address;
  }

  console.log(legacyAddress);
  console.log(p2shAddress);
  console.log(bech32Address);

  // sweep legacyAddress
};

const sweepAddress = (
  address: string,
  receiveAddress: string,
  feeRate: number,
  keyPair: ECPairInterface,
  inputScript: string,
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const {data} = await axios.get(
        `https://api.blockcypher.com/v1/ltc/main/addrs/${address}/full?unspentOnly=true&includeHex=true`,
      );

      // construct psbt tx
      const psbt = new bjs.Psbt({network: LITECOIN});
      const unspents = data.txs;
      let totalBalance = 0;

      // loops through all utxos
      for (let utxo = 0; utxo < unspents.length; utxo++) {
        // calculate total unspents
        // loops through all outputs to look for address associated to WIF
        for (let output = 0; output < unspents[utxo].outputs.length; output++) {
          if (unspents[utxo].outputs[output].addresses.includes(address)) {
            totalBalance += unspents[utxo].outputs[output].value;
          }
        }

        const outputIndex = unspents[utxo].outputs.findIndex(
          (output: {addresses: string | string[]}) =>
            output.addresses.includes(address),
        );

        // multiple inputs
        psbt.addInput({
          hash: unspents[utxo].hash,
          index: outputIndex,
          nonWitnessUtxo: Buffer.from(unspents[utxo].hex, 'hex'),
        });
      }

      // single output
      psbt.addOutput({
        address: receiveAddress,
        value:
          totalBalance - estimateTxSize(inputScript, unspents.length) * 0.188,
      });

      console.log(estimateTxSize('P2PKH', unspents.length));

      psbt.signInput(0, keyPair);
      psbt.finalizeAllInputs();

      const finalTx = psbt.extractTransaction(false);

      console.log(finalTx.toHex());
      resolve(finalTx.toHex());
    } catch (error) {
      reject(error);
    }
  });
};
