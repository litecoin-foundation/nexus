import ecc from '@bitcoinerlab/secp256k1';
import * as bitcoin from 'bitcoinjs-lib';
import bip39 from 'bip39';
import axios from 'axios';
import {BIP32Factory} from 'bip32';
import {ECPairFactory, ECPairInterface} from 'ecpair';
import wif from 'wif';

import {LITECOIN} from './litecoin';
import {estimateTxSize} from './estimateTxSize';
import getInputData from './getInputData';

bitcoin.initEccLib(ecc);

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
    const {address} = bitcoin.payments.p2pkh({
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
export const sweepWIF = async (wifString: string, receiveAddress: string) => {
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
  // let bech32mAddress;
  let address, inputScript;

  let inputsFromAllAdressesWithBalance: any[] = [];
  let totalBalance = 0;
  let unspentsLength = 0;

  // build p2pkh address
  const legacyAddress = bitcoin.payments.p2pkh({
    pubkey: keyPair.publicKey,
    network: LITECOIN,
  }).address;

  if (legacyAddress !== undefined) {
    address = legacyAddress;
    inputScript = 'P2PKH';
    // sweepAddress(String(address), keyPair, String(inputScript))
    //   .then(data => console.log(data))
    //   .catch(err => console.log(err));
    const {inputsArr, addressBalance, addressUnspentsLength} =
      await sweepAddress(String(address), keyPair, String(inputScript));
    inputsFromAllAdressesWithBalance.push(...inputsArr);
    totalBalance += addressBalance;
    unspentsLength += addressUnspentsLength;
  }

  // only compressed WIFs can generate p2sh/bech32
  if (compressed) {
    // build p2sh segwit address
    p2shAddress = bitcoin.payments.p2sh({
      redeem: bitcoin.payments.p2wpkh({
        pubkey: keyPair.publicKey,
        network: LITECOIN,
      }),
      network: LITECOIN,
    }).address;

    if (p2shAddress !== undefined) {
      address = p2shAddress;
      inputScript = 'P2SH-P2WPKH';
      // sweepAddress(String(address), keyPair, String(inputScript))
      //   .then(data => console.log(data))
      //   .catch(err => console.log(err));
      const {inputsArr, addressBalance, addressUnspentsLength} =
        await sweepAddress(String(address), keyPair, String(inputScript));
      inputsFromAllAdressesWithBalance.push(...inputsArr);
      totalBalance += addressBalance;
      unspentsLength += addressUnspentsLength;
    }

    // build bech32 address
    bech32Address = bitcoin.payments.p2wpkh({
      pubkey: keyPair.publicKey,
      network: LITECOIN,
    }).address;

    if (bech32Address !== undefined) {
      address = bech32Address;
      inputScript = 'P2WPKH';
      // sweepAddress(String(address), keyPair, String(inputScript))
      //   .then(data => console.log(data))
      //   .catch(err => console.log(err));
      const {inputsArr, addressBalance, addressUnspentsLength} =
        await sweepAddress(String(address), keyPair, String(inputScript));
      inputsFromAllAdressesWithBalance.push(...inputsArr);
      totalBalance += addressBalance;
      unspentsLength += addressUnspentsLength;
    }

    // build bech32m address
    // const internalPubkey = keyPair.publicKey.slice(1, 33);
    // bech32mAddress = bitcoin.payments.p2tr({
    //   internalPubkey: internalPubkey,
    //   network: LITECOIN,
    // }).address;
  }

  console.log(inputsFromAllAdressesWithBalance);
  console.log(totalBalance);
  console.log(unspentsLength);
  console.log(legacyAddress);
  console.log(p2shAddress);
  console.log(bech32Address);
  // console.log(bech32mAddress);

  if (totalBalance > 0) {
    try {
      const rawTx = createTopUpTx(
        inputsFromAllAdressesWithBalance,
        receiveAddress,
        0,
        totalBalance,
        0,
        keyPair,
        'P2PKH',
      );
      return rawTx;
    } catch (error) {
      throw new Error(String(error));
    }
  } else {
    throw new Error('No funds in this key.');
  }
};

const sweepAddress = (
  address: string,
  keyPair: ECPairInterface,
  inputScript: string,
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const {data: unspents} = await axios.get(
        `https://litecoinspace.org/api/address/${address}/utxo`,
      );

      let inputsArr: any[] = [];
      let addressBalance = 0;

      await Promise.all(
        unspents.map(async utxo => {
          addressBalance += utxo.value;

          const {data: utxoHex} = await axios.get(
            `https://litecoinspace.org/api/tx/${utxo.txid}/hex`,
          );

          switch (inputScript) {
            case 'P2PKH':
              inputsArr.push(
                getInputData(
                  utxo.txid,
                  utxo.vout,
                  utxoHex,
                  utxo.value,
                  false,
                  inputScript,
                  keyPair.publicKey,
                ),
              );
              break;
            case 'P2SH':
            case 'P2WPKH':
            case 'P2SH-P2WPKH':
            case 'P2WSH':
            case 'P2SH-P2WSH':
              inputsArr.push(
                getInputData(
                  utxo.txid,
                  utxo.vout,
                  utxoHex,
                  utxo.value,
                  true,
                  inputScript,
                  keyPair.publicKey,
                ),
              );
              break;
          }
        }),
      );

      if (addressBalance !== 0) {
        resolve({
          inputsArr,
          addressBalance,
          addressUnspentsLength: unspents.length,
        });
      } else {
        // throw new Error('No funds in this address.');
        resolve({
          inputsArr,
          addressBalance,
          addressUnspentsLength: unspents.length,
        });
      }
    } catch (error) {
      reject(error);
    }
  });
};

const createTopUpTx = (
  inputsArr: any[],
  receiveAddress: string,
  feeRate: number,
  totalSum: number,
  unspentsLength: number,
  keyPair: ECPairInterface,
  inputScript: string,
): string => {
  // construct psbt tx
  const psbt = new bitcoin.Psbt({network: LITECOIN});

  inputsArr.map(input => {
    psbt.addInput(input);
  });

  // single output
  psbt.addOutput({
    address: receiveAddress,
    value: Math.floor(
      totalSum - Math.ceil(estimateTxSize(inputScript, unspentsLength) * 18.8),
    ),
  });

  psbt.signInput(0, keyPair);
  psbt.finalizeAllInputs();

  const finalTx = psbt.extractTransaction(false);

  return finalTx.toHex();
};
