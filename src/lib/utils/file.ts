import * as RNFS from '@dr.pogodin/react-native-fs';

const lndDir = RNFS.DocumentDirectoryPath;

// tools
export const fileExists = async (path: string) => {
  const exists = await RNFS.exists(path);
  return exists;
};

// wallet database
export const deleteWalletDB = async () => {
  const dbPath = `${lndDir}/lndltc/data/chain/litecoin/mainnet/wallet.db`;
  try {
    // do not error out when file does not exist
    if ((await fileExists(dbPath)) === false) {
      return;
    }
    await RNFS.unlink(dbPath);
  } catch (error) {
    // if initial install, then no wallet db will exist
    console.log('no wallet db exists');
  }
};

// delete macaroon files
export const deleteMacaroonFiles = async () => {
  const macaroonDir = `${lndDir}/lndltc/data/chain/litecoin/mainnet`;
  const macaroonFiles = [
    'admin.macaroon',
    'chainnotifier.macaroon',
    'invoice.macaroon',
    'invoices.macaroon',
    'macaroons.db',
    'readonly.macaroon',
    'router.macaroon',
    'signer.macaroon',
    'walletkit.macaroon',
  ];

  for (const file of macaroonFiles) {
    const filePath = `${macaroonDir}/${file}`;
    try {
      const exists = await RNFS.exists(filePath);
      if (exists) {
        await RNFS.unlink(filePath);
        console.log(`Deleted macaroon file: ${file}`);
      }
    } catch (error) {
      console.log(`Could not delete macaroon file ${file}:`, error);
    }
  }
};

// delete lndltc directory
export const deleteLNDDir = async () => {
  const path = `${lndDir}/lndltc`;
  try {
    await RNFS.unlink(path);
  } catch (error) {
    console.error(error);
  }
};
