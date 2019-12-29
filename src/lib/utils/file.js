import RNFS from 'react-native-fs';

const lndDir = RNFS.DocumentDirectoryPath;
const externalStorageDir = RNFS.ExternalStorageDirectoryPath;
const scbPath = `${lndDir}/data/chain/litecoin/mainnet/channel.backup`;
const scbExternalDir = `${externalStorageDir}/Lightning/mainnet-ltc`;
const scbExternalPath = `${scbExternalDir}/channel.backup`;

// wallet database
export const deleteWalletDB = async () => {
  const dbPath = `${lndDir}/data/chain/litecoin/mainnet/wallet.db`;
  try {
    await RNFS.unlink(dbPath);
  } catch (error) {
    // if initial install, then no wallet db will exist
    console.log('no wallet db exists');
  }
};

// static channel backups
export const readSCB = async () => {
  return RNFS.readFile(
    `${lndDir}/data/chain/litecoin/mainnet/channel.backup`,
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
