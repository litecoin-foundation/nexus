import * as FileSystem from 'expo-file-system';

const lndDir = FileSystem.documentDirectory;
// const externalStorageDir = RNFS.ExternalStorageDirectoryPath;
// const scbPath = `${lndDir}/lndltc/data/chain/litecoin/mainnet/channel.backup`;
// const scbExternalDir = `${externalStorageDir}/Lightning/mainnet-ltc`;
// const scbExternalPath = `${scbExternalDir}/channel.backup`;

// tools
export const fileExists = async path => {
  const {exists} = await FileSystem.getInfoAsync(path);
  return exists;
};

// wallet database
export const deleteWalletDB = async () => {
  const dbPath = `${lndDir}/lndltc/data/chain/litecoin/mainnet/wallet.db`;
  try {
    await FileSystem.deleteAsync(dbPath);
  } catch (error) {
    // if initial install, then no wallet db will exist
    console.log('no wallet db exists');
  }
};

// delete lndltc directory
export const deleteLNDDir = async () => {
  const path = `${lndDir}/lndltc`;
  try {
    await FileSystem.deleteAsync(path);
  } catch (error) {
    console.error(error);
  }
};

// static channel backups
export const readSCB = async () => {
  try {
    const scb = await FileSystem.readAsStringAsync(
      `${lndDir}/lndltc/data/chain/litecoin/mainnet/channel.backup`,
      {encoding: 'base64'},
    );
    return scb;
  } catch (error) {
    console.error(error);
  }
};

// export const copySCBToExternalStorage = async () => {
//   const exists = await fileExists(scbPath);
//   if (!exists) {
//     return;
//   }
//   await RNFS.mkdir(scbExternalDir);
//   await RNFS.copyFile(scbPath, scbExternalPath);
// };

// export const readSCBFromExternalStorage = async () => {
//   const exists = await fileExists(scbExternalPath);
//   if (!exists) {
//     return;
//   }
//   return RNFS.readFile(scbExternalPath, 'base64');
// };
