import ecc from '@bitcoinerlab/secp256k1';
import * as bitcoin from 'bitcoinjs-lib';
import {BIP32Factory, BIP32Interface} from 'bip32';
import {ECPairFactory, ECPairInterface} from 'ecpair';
import {LITECOIN} from './litecoin';

const bip39 = require('bip39');
const bip32 = BIP32Factory(ecc);
const GAP_LIMIT = 20;

const ECPair = ECPairFactory(ecc);

type IMnemonic = string[];

interface SweepableAddress {
  addressData: {
    address: string;
    index: number;
    balance: number;
  };
  keyPair: any;
}

interface AddressWithKeyPair {
  address: string;
  keyPair: ECPairInterface;
}

export async function getDerivedKeyPairsWithBalance(
  startPath: string,
  isHardened: boolean,
  mnemonic?: IMnemonic,
  seedBase58?: string,
) {
  const keyPairsWithBalance: AddressWithKeyPair[] = [];

  try {
    const sweepableAddresses: SweepableAddress[] =
      await getDerivedUsedAddresses(
        startPath,
        isHardened,
        mnemonic,
        seedBase58,
      );

    sweepableAddresses.map(sweepableAddress => {
      if (sweepableAddress.addressData.balance > 0) {
        // BIP32Interface to ECPairInterface
        const wifString = sweepableAddress.keyPair.toWIF();
        const keyPair = ECPair.fromWIF(wifString, LITECOIN);

        keyPairsWithBalance.push({
          address: sweepableAddress.addressData.address,
          keyPair: keyPair,
        });
      }
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error(String(error));
    }
  }

  return keyPairsWithBalance;
}

async function getDerivedUsedAddresses(
  startPath: string,
  isHardened: boolean,
  mnemonic?: IMnemonic,
  seedBase58?: string,
): Promise<SweepableAddress[]> {
  if (mnemonic) {
    var bip32RootKey = calcBip32RootKeyFromSeedPhrase(mnemonic);
  } else if (seedBase58) {
    if (seedBase58.indexOf('Ltpv') !== -1) {
      var bip32RootKey = calcBip32RootKeyFromSeedBase58(seedBase58);
    } else {
      throw new Error('Master private key is invalid.');
    }
  } else {
    throw new Error('Master private key is undefined.');
  }

  let currentIndex = 0;
  let currentGap = 0;
  const sweepableAddresses: SweepableAddress[] = [];

  while (currentGap < GAP_LIMIT) {
    const childExtendedKey = deriveChildExtendedKey(
      bip32RootKey,
      startPath + currentIndex,
      isHardened ? currentIndex : undefined,
    );

    const address = getPubKeyFromExtendedKey(childExtendedKey);

    // check address for txs
    try {
      const response: any = await fetchAddressData(address, currentIndex);
      currentIndex++;
      sweepableAddresses.push({
        addressData: response,
        keyPair: childExtendedKey,
      });
    } catch (error) {
      if (error === 'This address was never used.') {
        currentIndex++;
        currentGap++;
      } else {
        if (error instanceof Error) {
          throw new Error(error.message);
        } else {
          throw new Error(String(error));
        }
      }
    }
  }

  return sweepableAddresses;
}

function calcBip32RootKeyFromSeedPhrase(seedPhrase: IMnemonic) {
  const mnemonicString = seedPhrase.join(' ');

  const seed = bip39.mnemonicToSeedSync(mnemonicString);
  const bip32RootKey: BIP32Interface = bip32.fromSeed(seed, LITECOIN);

  return bip32RootKey;
}

function calcBip32RootKeyFromSeedBase58(seedBase58: string) {
  const bip32RootKey: BIP32Interface = bip32.fromBase58(seedBase58, LITECOIN);

  return bip32RootKey;
}

function deriveChildExtendedKey(
  bip32RootKey: BIP32Interface,
  derivationPath: string,
  indexForHardened?: number,
) {
  if (indexForHardened) {
    var childExtendedKey = bip32RootKey.deriveHardened(indexForHardened);
  } else {
    var childExtendedKey = bip32RootKey.derivePath(derivationPath);
  }

  return childExtendedKey;
}

function getPubKeyFromExtendedKey(extendedKey: BIP32Interface) {
  const {address} = bitcoin.payments.p2pkh({
    pubkey: extendedKey.publicKey,
    network: LITECOIN,
  });

  if (address === undefined) {
    throw new Error('Address derivation failed.');
  }

  return address;
}

async function fetchAddressData(address: string, index: number) {
  return new Promise(async (resolve, reject) => {
    try {
      const res = await fetch(
        `https://litecoinspace.org/api/address/${address}`,
      );

      if (!res.ok) {
        reject('Failed to connect with API Server - try using a VPN.');
      }

      const data = await res.json();

      if (data.hasOwnProperty('chain_stats')) {
        // check if address was used received value > 0
        if (parseFloat(data.chain_stats.funded_txo_sum) === 0) {
          reject('This address was never used.');
        }

        resolve({
          address,
          index,
          balance:
            data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum,
        });
      } else {
        reject('Invalid request.');
      }
    } catch (err) {
      reject('Unable to fetch balance. Contact in-app support.');
    }
  });
}
