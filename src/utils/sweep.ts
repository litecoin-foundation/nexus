import ecc from '@bitcoinerlab/secp256k1';
import * as bitcoin from 'bitcoinjs-lib';
import {ECPairFactory, ECPairInterface} from 'ecpair';
import wif from 'wif';

import {LITECOIN} from './litecoin';
import getTxInputData from './getTxInputData';
import {estimateTxSize} from './estimateTxSize';
import {getDerivedKeyPairsWithBalance} from './hdWallets';
import {fetchResolve} from '../../utils/tor';

const ECPair = ECPairFactory(ecc);

type IMnemonic = string[];

interface AddressWithKeyPair {
  address: string;
  keyPair: ECPairInterface;
}

interface SweptAddress {
  inputsArr: any;
  addressBalance: number;
  addressUnspentsLength: number;
}

interface InputWithKeyPair {
  input: any;
  keyPair: ECPairInterface;
}

function isArrayEmpty(obj: any[]) {
  if (obj.length >= 1) {
    return false;
  } else {
    return true;
  }
}

export const sweepLitewallet = async (
  mnemonic: IMnemonic,
  receiveAddress: string,
  useTor: boolean,
) => {
  const startPath = "m/0'/0/";
  const changePath = "m/0'/1/";
  const isChildHardened = false;

  const rawTopUpTxs: any[] = [];

  try {
    const mainTxs = await sweepMnemonic(
      mnemonic,
      receiveAddress,
      startPath,
      isChildHardened,
      useTor,
    );
    const changeTxs = await sweepMnemonic(
      mnemonic,
      receiveAddress,
      changePath,
      isChildHardened,
      useTor,
    );

    if (isArrayEmpty(mainTxs) && isArrayEmpty(changeTxs)) {
      throw new Error(
        'No balances detected in addresses derived from seed phrase.',
      );
    }

    // we don't push empty arrays!
    if (!isArrayEmpty(mainTxs)) {
      rawTopUpTxs.push(mainTxs);
    }
    if (!isArrayEmpty(changeTxs)) {
      rawTopUpTxs.push(changeTxs);
    }

    return rawTopUpTxs;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error(String(error));
    }
  }
};

export const sweepQrKey = async (
  qrKey: string,
  receiveAddress: string,
  useTor: boolean,
) => {
  const startPath = "m/0'/0/";
  const changePath = "m/0'/1/";
  const isChildHardened = false;

  const rawTopUpTxs: any[] = [];

  try {
    if (qrKey.indexOf('Ltpv') !== -1) {
      const mainTxs = await sweepBase58Ltpv(
        qrKey,
        receiveAddress,
        startPath,
        isChildHardened,
        useTor,
      );
      const changeTxs = await sweepBase58Ltpv(
        qrKey,
        receiveAddress,
        changePath,
        isChildHardened,
        useTor,
      );

      if (isArrayEmpty(mainTxs) && isArrayEmpty(changeTxs)) {
        throw new Error('No derived addresses with balance.');
      }

      // we don't push empty arrays!
      if (!isArrayEmpty(mainTxs)) {
        rawTopUpTxs.push(mainTxs);
      }
      if (!isArrayEmpty(changeTxs)) {
        rawTopUpTxs.push(changeTxs);
      }
    } else {
      const txs = await sweepWIF(qrKey, receiveAddress, useTor);

      rawTopUpTxs.push(txs);
    }

    return rawTopUpTxs;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error(String(error));
    }
  }
};

const sweepBase58Ltpv = async (
  seedBase58: string,
  receiveAddress: string,
  startPath: string,
  isChildHardened: boolean,
  useTor: boolean,
) => {
  try {
    const keyPairsWithBalance = await getDerivedKeyPairsWithBalance(
      startPath,
      isChildHardened,
      useTor,
      undefined,
      seedBase58,
    );

    const rawTopUpTxs = await createRawTxsFromHDWallet(
      keyPairsWithBalance,
      receiveAddress,
      useTor,
    );

    return rawTopUpTxs;
  } catch (error: any) {
    if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error(String(error));
    }
  }
};

const sweepMnemonic = async (
  mnemonic: IMnemonic,
  receiveAddress: string,
  startPath: string,
  isChildHardened: boolean,
  useTor: boolean,
) => {
  try {
    const keyPairsWithBalance = await getDerivedKeyPairsWithBalance(
      startPath,
      isChildHardened,
      useTor,
      mnemonic,
    );

    const rawTopUpTxs = await createRawTxsFromHDWallet(
      keyPairsWithBalance,
      receiveAddress,
      useTor,
    );

    return rawTopUpTxs;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error(String(error));
    }
  }
};

const createRawTxsFromHDWallet = async (
  keyPairsWithBalance: AddressWithKeyPair[],
  receiveAddress: string,
  useTor: boolean = false,
) => {
  const inputsWithKeyPairs: InputWithKeyPair[] = [];
  let totalBalance = 0;
  let unspentsLength = 0;

  try {
    // Collect all inputs with their corresponding key pairs
    await Promise.all(
      keyPairsWithBalance.map(async addressWithKeyPair => {
        const sweepy = await sweepAddressViaLitecoinspace(
          addressWithKeyPair.address,
          addressWithKeyPair.keyPair,
          'P2PKH',
          useTor,
        );

        const {inputsArr, addressBalance, addressUnspentsLength} = sweepy;

        // Map each input to its key pair
        inputsArr.forEach(input => {
          inputsWithKeyPairs.push({
            input,
            keyPair: addressWithKeyPair.keyPair,
          });
        });

        totalBalance += addressBalance;
        unspentsLength += addressUnspentsLength;
      }),
    );

    // Create a single transaction with all inputs
    if (inputsWithKeyPairs.length > 0) {
      const rawTx = createTopUpTx(
        inputsWithKeyPairs,
        receiveAddress,
        0,
        totalBalance,
        unspentsLength,
        'P2PKH',
      );
      return [rawTx];
    }

    return [];
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error(String(error));
    }
  }
};

export const sweepWIF = async (
  wifString: string,
  receiveAddress: string,
  useTor: boolean = false,
) => {
  let compressed;

  try {
    const key = wif.decode(wifString);
    compressed = key.compressed;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error(String(error));
    }
  }

  const keyPair = ECPair.fromWIF(wifString, LITECOIN);

  let p2shAddress;
  let bech32Address;
  // let bech32mAddress;
  let address, inputScript;

  const inputsFromAllAddressesWithBalance: any[] = [];
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
    const {inputsArr, addressBalance, addressUnspentsLength} =
      await sweepAddressViaLitecoinspace(
        String(address),
        keyPair,
        String(inputScript),
        useTor,
      );
    inputsFromAllAddressesWithBalance.push(...inputsArr);
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
      const {inputsArr, addressBalance, addressUnspentsLength} =
        await sweepAddressViaLitecoinspace(
          String(address),
          keyPair,
          String(inputScript),
          useTor,
        );
      inputsFromAllAddressesWithBalance.push(...inputsArr);
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
      const {inputsArr, addressBalance, addressUnspentsLength} =
        await sweepAddressViaLitecoinspace(
          String(address),
          keyPair,
          String(inputScript),
          useTor,
        );
      inputsFromAllAddressesWithBalance.push(...inputsArr);
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

  if (totalBalance > 0) {
    try {
      // Convert inputs to InputWithKeyPair format
      const inputsWithKeyPairs: InputWithKeyPair[] =
        inputsFromAllAddressesWithBalance.map(input => ({
          input,
          keyPair,
        }));

      const rawTx = createTopUpTx(
        inputsWithKeyPairs,
        receiveAddress,
        0,
        totalBalance,
        unspentsLength,
        'P2PKH',
      );

      return [rawTx];
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      } else {
        throw new Error(String(error));
      }
    }
  } else {
    throw new Error('Private Key is empty.');
  }
};

const sweepAddress = (
  address: string,
  keyPair: ECPairInterface,
  inputScript: string,
  useTor: boolean = false,
): Promise<SweptAddress> => {
  return new Promise(async (resolve, reject) => {
    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };

    try {
      const unspents = await fetchResolve(
        `https://litecoinspace.org/api/address/${address}/utxo`,
        {
          method: 'GET',
          headers,
        },
        useTor,
      );

      if (!unspents && !Array.isArray(unspents)) {
        reject(
          'Failed to connect with API Server - try using a VPN. (UTXO Fetch)',
        );
        return;
      }
      let inputsArr: any[] = [];
      let addressBalance = 0;

      await Promise.all(
        unspents.map(async (utxo: any) => {
          addressBalance += utxo.value;

          const utxoHex = await fetchResolve(
            `https://litecoinspace.org/api/tx/${utxo.txid}/hex`,
            {
              method: 'GET',
              headers,
            },
            useTor,
          );

          if (!utxoHex) {
            reject(
              `Failed to connect with API Server - try using a VPN. (TxHex)`,
            );
            return;
          }

          switch (inputScript) {
            case 'P2PKH':
              inputsArr.push(
                getTxInputData(
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
                getTxInputData(
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

      resolve({
        inputsArr,
        addressBalance,
        addressUnspentsLength: unspents.length,
      });
    } catch (error) {
      reject('Failed to connect with API Server - try using a VPN.');
    }
  });
};

// NOTE: new endpoint required, the `https://litecoinspace.org/api/address/${address}/utxo-hex`
// endpoint should return uxto data with the hex value appended to every unspent
const sweepAddressViaLitecoinspace = (
  address: string,
  keyPair: ECPairInterface,
  inputScript: string,
  useTor: boolean = false,
): Promise<SweptAddress> => {
  return new Promise(async (resolve, reject) => {
    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };

    try {
      const unspents = await fetchResolve(
        `https://litecoinspace.org/api/address/${address}/utxo-hex`,
        {
          method: 'GET',
          headers,
        },
        useTor,
      );
      if (!unspents) {
        reject(
          'UTXO fetch error. Failed to connect with API Server, try using VPN.',
        );
        return;
      }
      let inputsArr: any[] = [];
      let addressBalance = 0;

      unspents.map((utxo: any) => {
        const utxoHex = utxo.hex;
        // skip txs with empty hex
        if (!utxoHex) {
          return;
        }

        addressBalance += utxo.value;

        switch (inputScript) {
          case 'P2PKH':
            inputsArr.push(
              getTxInputData(
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
              getTxInputData(
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
      });

      resolve({
        inputsArr,
        addressBalance,
        addressUnspentsLength: unspents.length,
      });
    } catch (error) {
      reject('Failed to connect with API Server, try using VPN.');
    }
  });
};

const createTopUpTx = (
  inputsWithKeyPairs: InputWithKeyPair[],
  receiveAddress: string,
  feeRate: number,
  totalSum: number,
  unspentsLength: number,
  inputScript: string,
): string => {
  // construct psbt tx
  const psbt = new bitcoin.Psbt({network: LITECOIN});

  // Add all inputs
  inputsWithKeyPairs.forEach(({input}) => {
    psbt.addInput(input);
  });

  // single output
  psbt.addOutput({
    address: receiveAddress,
    value: Math.floor(
      totalSum - Math.ceil(estimateTxSize(inputScript, unspentsLength) * 18.8),
    ),
  });

  // Sign each input with its corresponding key pair
  inputsWithKeyPairs.forEach(({keyPair}, index) => {
    psbt.signInput(index, keyPair);
  });

  psbt.finalizeAllInputs();

  const finalTx = psbt.extractTransaction(false);

  return finalTx.toHex();
};
