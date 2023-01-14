import bjs from 'bitcoinjs-lib';
import bip39 from 'bip39';
import ecc from 'tiny-secp256k1';
import axios from 'axios';
import {BIP32Factory} from 'bip32';

import {LITECOIN} from './litecoin';

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
