// aezeed implementation adapted from: https://github.com/guggero/cryptography-toolkit/blob/7019bfed32346fbb0af0f71372e07d0376a2a6e5/pages/aezeed/aezeed.js#L117
// Copyright (c) 2019 Oliver Gugger

import {Buffer} from 'buffer';

import {checkBIP39Word, getBIP39Index} from './bip39';
import lpad from './lpad';
import crc32c from './crc32c';

const AEZEED_VERSION = 0;
const ENCIPHERED_LENGTH = 33;
const CHECKSUM_LENGTH = 4;
const CHECKSUM_OFFSET = ENCIPHERED_LENGTH - CHECKSUM_LENGTH;
const NUM_WORDS = 24;

const mnemonicToSeedBytes = mnemonic => {
  return new Promise((resolve, reject) => {
    if (!mnemonic) {
      reject('No mnemonic');
      return;
    }

    if (mnemonic.length !== NUM_WORDS) {
      reject('Mnemonic is not 24 words');
      return;
    }

    const belongToList = mnemonic.every(word => checkBIP39Word(word));
    if (!belongToList) {
      reject('Mnemonic word is not in BIP39 wordlist');
      return;
    }

    const bits = mnemonic
      .map(word => {
        const index = getBIP39Index(word);
        return lpad(index.toString(2), '0', 11);
      })
      .join('');
    const seedBytes = bits.match(/(.{1,8})/g).map(bin => parseInt(bin, 2));
    resolve(seedBytes);
  });
};

export const checkSeedChecksum = async seed => {
  return new Promise(async (resolve, reject) => {
    try {
      const words = await mnemonicToSeedBytes(seed);

      if (!words || words.length === 0 || words[0] !== AEZEED_VERSION) {
        reject('Mnemonic ERROR');
        return;
      }

      const checksum = words.slice(CHECKSUM_OFFSET);
      const newChecksum = crc32c(words.slice(0, CHECKSUM_OFFSET));

      if (newChecksum !== Buffer.from(checksum).readInt32BE(0)) {
        reject('Mnemonic checksum invalid!');
        return;
      } else {
        resolve();
      }
    } catch (error) {
      reject(error);
    }
  });
};
