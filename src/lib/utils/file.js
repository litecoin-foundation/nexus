import RNFS from '@dr.pogodin/react-native-fs';

const lndDir = RNFS.DocumentDirectoryPath;
const externalStorageDir = RNFS.ExternalStorageDirectoryPath;
const scbPath = `${lndDir}/lndltc/data/chain/litecoin/mainnet/channel.backup`;
const scbExternalDir = `${externalStorageDir}/Lightning/mainnet-ltc`;
const scbExternalPath = `${scbExternalDir}/channel.backup`;

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

// static channel backups
export const readSCB = async () => {
  return RNFS.readFile(
    `${lndDir}/lndltc/data/chain/litecoin/mainnet/channel.backup`,
    'base64',
  );
};

export const copySCBToExternalStorage = async () => {
  const exists = await RNFS.exists(scbPath);
  if (!exists) {
    return;
  }
  await RNFS.mkdir(scbExternalDir);
  await RNFS.copyFile(scbPath, scbExternalPath);
};

export const readSCBFromExternalStorage = async () => {
  const exists = await RNFS.exists(scbExternalPath);
  if (!exists) {
    return;
  }
  return RNFS.readFile(scbExternalPath, 'base64');
};
