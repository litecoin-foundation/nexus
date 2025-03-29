// aezeed implementation adapted from: https://github.com/guggero/cryptography-toolkit/blob/7019bfed32346fbb0af0f71372e07d0376a2a6e5/pages/aezeed/aezeed.js#L117
// Copyright (c) 2019 Oliver Gugger

import {Buffer} from 'buffer';
import Crypto from 'react-native-quick-crypto';
import aez from 'aez';
import {Scrypt} from 'react-native-turbo-scrypt';

import wordlist from './bip39/english.json';
import {checkBIP39Word, getBIP39Index} from './bip39';
import lpad from './lpad';
import crc32c from './crc32c';
import {hexStringToHexArray} from './hexStringToHexArray';

const AEZEED_VERSION = 0;
const BITCOIN_GENESIS_BLOCK_TIMESTAMP = 1231006505;
const SCRYPT_N = 32768;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEY_LENGTH = 32;
const PLAINTEXT_LENGTH = 19;
const ENCIPHERED_LENGTH = 33;
const CHECKSUM_LENGTH = 4;
const CHECKSUM_OFFSET = ENCIPHERED_LENGTH - CHECKSUM_LENGTH;
const NUM_WORDS = 24;
const SALT_LENGTH = 5;
const AD_LENGTH = SALT_LENGTH + 1;
const AEZ_TAU = 4;
const SALT_OFFSET = CHECKSUM_OFFSET - SALT_LENGTH;

//
// aezeed generation
//

export const generateMnemonic = () => {
  return new Promise((resolve, reject) => {
    try {
      const passwordString = 'aezeed';
      const passwordBuffer = new Uint8Array(
        [...passwordString].map(char => char.charCodeAt(0)),
      ).buffer;

      const s = Crypto.randomBytes(5).toString('hex');
      const saltBytes = hexStringToHexArray(s);

      const salt = new ArrayBuffer(5);
      const saltView = new Uint8Array(salt);
      saltView.set(saltBytes);

      const entropy = Crypto.randomBytes(16).toString('hex');

      const key = Scrypt.scrypt(
        passwordBuffer,
        salt,
        SCRYPT_N,
        SCRYPT_R,
        SCRYPT_P,
        SCRYPT_KEY_LENGTH,
      );

      const keyUInt8Array = new Uint8Array(key);
      const saltBuffer = Buffer.from(salt);

      const cipherText = aez.encrypt(
        keyUInt8Array,
        null,
        [getAD(saltBuffer)],
        AEZ_TAU,
        getSeedBytes(entropy),
      );

      const mnemonicBytes = getMnemonicBytes(cipherText, saltBuffer);
      const mnemonic = seedToMnemonic(mnemonicBytes);
      const mnemonicArray = mnemonic.split(' ');
      resolve(mnemonicArray);
    } catch (error) {
      reject(error);
    }
  });
};

const getMnemonicBytes = (cipherText, salt) => {
  const mnemonicBytes = Buffer.alloc(ENCIPHERED_LENGTH);
  mnemonicBytes.writeUInt8(AEZEED_VERSION);
  cipherText.copy(mnemonicBytes, 1);
  salt.copy(mnemonicBytes, SALT_OFFSET);
  const checkSum = crc32c(mnemonicBytes.slice(0, CHECKSUM_OFFSET));
  mnemonicBytes.writeUInt32BE(checkSum, CHECKSUM_OFFSET);
  return mnemonicBytes;
};

const getAD = salt => {
  const ad = Buffer.alloc(AD_LENGTH, AEZEED_VERSION);
  salt.copy(ad, 1);
  return ad;
};

const getSeedBytes = entropy => {
  const seedBytes = Buffer.alloc(PLAINTEXT_LENGTH);
  seedBytes.writeUInt8(AEZEED_VERSION);
  seedBytes.writeUInt16BE(calculateBirthday(), 1);
  Buffer.from(entropy, 'hex').copy(seedBytes, 3);
  return seedBytes;
};

const calculateBirthday = () => {
  const unixTimestamp = Math.round(new Date().getTime() / 1000);
  return Math.floor(
    (unixTimestamp - BITCOIN_GENESIS_BLOCK_TIMESTAMP) / (60 * 60 * 24),
  );
};

const seedToMnemonic = function (seed) {
  const entropyBits = bytesToBinary([].slice.call(seed));
  const words = entropyBits.match(/(.{1,11})/g).map(function (binary) {
    const index = parseInt(binary, 2);
    return wordlist[index];
  });
  return words.join(' ');
};

const bytesToBinary = bytes => {
  return bytes.map(x => lpad(x.toString(2), '0', 8)).join('');
};

//
// aezeed validation
//

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

      if (newChecksum !== Buffer.from(checksum).readUInt32BE(0)) {
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
