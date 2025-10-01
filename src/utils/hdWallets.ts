import ecc from '@bitcoinerlab/secp256k1';
import * as bitcoin from 'bitcoinjs-lib';
import {BIP32Factory, BIP32Interface} from 'bip32';
import {ECPairFactory, ECPairInterface} from 'ecpair';
import * as bip39 from 'bip39';

import {LITECOIN} from './litecoin';
import {fetchResolve} from '../utils/tor';

const bip32 = BIP32Factory(ecc);
const ECPair = ECPairFactory(ecc);
const GAP_LIMIT = 50;

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
  useTor: boolean,
  mnemonic?: IMnemonic,
  seedBase58?: string,
) {
  const keyPairsWithBalance: AddressWithKeyPair[] = [];

  try {
    const sweepableAddresses: SweepableAddress[] =
      await getDerivedUsedAddresses(
        startPath,
        isHardened,
        useTor,
        mnemonic,
        seedBase58,
      );

    sweepableAddresses.map(sweepableAddress => {
      if (sweepableAddress.addressData.balance > 0) {
        // BIP32Interface to ECPairInterface
        // Convert privateKey Uint8Array to Buffer to avoid "Expected Buffer, got Uint8Array" error
        const privateKeyBuffer = Buffer.from(sweepableAddress.keyPair.privateKey!);
        const keyPair = ECPair.fromPrivateKey(privateKeyBuffer, {
          network: LITECOIN,
          compressed: true,
        });

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
  useTor: boolean,
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
      const response: any = await fetchAddressData(
        address,
        currentIndex,
        useTor,
      );
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

async function fetchAddressData(
  address: string,
  index: number,
  useTor: boolean,
) {
  return new Promise(async (resolve, reject) => {
    try {
      const data = await fetchResolve(
        `https://litecoinspace.org/api/address/${address}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        },
        useTor,
      );

      if (data.hasOwnProperty('chain_stats')) {
        // check if address has ever been used (received any funds or sent any tx)
        if (
          parseFloat(data.chain_stats.funded_txo_sum) === 0 &&
          parseFloat(data.chain_stats.spent_txo_sum) === 0 &&
          data.chain_stats.tx_count === 0
        ) {
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
      if (
        err instanceof Error &&
        err.message.includes('Failed to connect with API Server')
      ) {
        reject('Failed to connect with API Server - try using a VPN.');
      } else {
        reject('Unable to fetch balance. Contact in-app support.');
      }
    }
  });
}
