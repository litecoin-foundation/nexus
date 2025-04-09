import * as RNFS from '@dr.pogodin/react-native-fs';

const lndDir = RNFS.DocumentDirectoryPath;
// const externalStorageDir = RNFS.ExternalStorageDirectoryPath;

// tools
export const fileExists = async (path: string) => {
  const exists = await RNFS.exists(path);
  return exists;
};

// wallet database
export const deleteWalletDB = async () => {
  const dbPath = `${lndDir}/lndltc/data/chain/litecoin/mainnet/wallet.db`;
  try {
    await RNFS.unlink(dbPath);
  } catch (error) {
    // if initial install, then no wallet db will exist
    console.log('no wallet db exists');
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
