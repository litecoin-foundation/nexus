import ecc from '@bitcoinerlab/secp256k1';
import * as bitcoin from 'bitcoinjs-lib';
import {ECPairFactory, ECPairInterface} from 'ecpair';
import wif from 'wif';

import {LITECOIN} from './litecoin';
import getTxInputData from './getTxInputData';
import {estimateTxSize} from './estimateTxSize';
import {getDerivedKeyPairsWithBalance} from './hdWallets';

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
    );
    const changeTxs = await sweepMnemonic(
      mnemonic,
      receiveAddress,
      changePath,
      isChildHardened,
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
    throw new Error(String(error));
  }
};

export const sweepQrKey = async (qrKey: string, receiveAddress: string) => {
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
      );
      const changeTxs = await sweepBase58Ltpv(
        qrKey,
        receiveAddress,
        changePath,
        isChildHardened,
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
      const txs = await sweepWIF(qrKey, receiveAddress);

      rawTopUpTxs.push(txs);
    }

    return rawTopUpTxs;
  } catch (error) {
    throw new Error(String(error));
  }
};

const sweepBase58Ltpv = async (
  seedBase58: string,
  receiveAddress: string,
  startPath: string,
  isChildHardened: boolean,
) => {
  try {
    const keyPairsWithBalance = await getDerivedKeyPairsWithBalance(
      startPath,
      isChildHardened,
      undefined,
      seedBase58,
    );

    const rawTopUpTxs = await createRawTxsFromHDWallet(
      keyPairsWithBalance,
      receiveAddress,
    );

    return rawTopUpTxs;
  } catch (error: any) {
    throw new Error(String(error.message));
  }
};

const sweepMnemonic = async (
  mnemonic: IMnemonic,
  receiveAddress: string,
  startPath: string,
  isChildHardened: boolean,
) => {
  try {
    const keyPairsWithBalance = await getDerivedKeyPairsWithBalance(
      startPath,
      isChildHardened,
      mnemonic,
    );

    const rawTopUpTxs = await createRawTxsFromHDWallet(
      keyPairsWithBalance,
      receiveAddress,
    );

    return rawTopUpTxs;
  } catch (error) {
    throw new Error(String(error));
  }
};

const createRawTxsFromHDWallet = async (
  keyPairsWithBalance: AddressWithKeyPair[],
  receiveAddress: string,
) => {
  const rawTxs: any[] = [];
  const inputsFromAllAddressesWithBalance: any[] = [];
  let totalBalance = 0;
  let unspentsLength = 0;

  await Promise.all(
    keyPairsWithBalance.map(async addressWithKeyPair => {
      const sweepy = await sweepAddress(
        addressWithKeyPair.address,
        addressWithKeyPair.keyPair,
        'P2PKH',
      );

      const {inputsArr, addressBalance, addressUnspentsLength} = sweepy;
      inputsFromAllAddressesWithBalance.push(...inputsArr);
      totalBalance += addressBalance;
      unspentsLength += addressUnspentsLength;

      const rawTx = createTopUpTx(
        inputsFromAllAddressesWithBalance,
        receiveAddress,
        0,
        totalBalance,
        unspentsLength,
        addressWithKeyPair.keyPair,
        'P2PKH',
      );

      rawTxs.push(rawTx);
    }),
  );

  return rawTxs;
};

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
      await sweepAddress(String(address), keyPair, String(inputScript));
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
        await sweepAddress(String(address), keyPair, String(inputScript));
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
        await sweepAddress(String(address), keyPair, String(inputScript));
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

  // console.log(inputsFromAllAddressesWithBalance);
  // console.log(totalBalance);
  // console.log(unspentsLength);
  // console.log(legacyAddress);
  // console.log(p2shAddress);
  // console.log(bech32Address);
  // console.log(bech32mAddress);

  if (totalBalance > 0) {
    try {
      const rawTx = createTopUpTx(
        inputsFromAllAddressesWithBalance,
        receiveAddress,
        0,
        totalBalance,
        unspentsLength,
        keyPair,
        'P2PKH',
      );

      return [rawTx];
    } catch (error) {
      throw new Error(String(error));
    }
  } else {
    throw new Error('Private Key is empty.');
  }
};

const sweepAddress = (
  address: string,
  keyPair: ECPairInterface,
  inputScript: string,
): Promise<SweptAddress> => {
  return new Promise(async (resolve, reject) => {
    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };

    try {
      const utxoRes = await fetch(
        `https://litecoinspace.org/api/address/${address}/utxo`,
        {
          method: 'GET',
          headers,
        },
      );

      if (!utxoRes.ok) {
        const error = await utxoRes.json();
        reject(error);
        return;
      }

      const unspents = await utxoRes.json();
      let inputsArr: any[] = [];
      let addressBalance = 0;

      await Promise.all(
        unspents.map(async (utxo: any) => {
          addressBalance += utxo.value;

          const txHexRes = await fetch(
            `https://litecoinspace.org/api/tx/${utxo.txid}/hex`,
            {
              method: 'GET',
              headers,
            },
          );

          if (!txHexRes.ok) {
            const error = await txHexRes.text();
            reject(error);
          }

          const utxoHex = await txHexRes.text();

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

      if (addressBalance !== 0) {
        resolve({
          inputsArr,
          addressBalance,
          addressUnspentsLength: unspents.length,
        });
      } else {
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
