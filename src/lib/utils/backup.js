import {Platform} from 'react-native';
import iCloudStorage from 'react-native-icloudstore';
import DeviceInfo from 'react-native-device-info';
import {Buffer} from 'buffer';
import {PermissionsAndroid} from 'react-native';

import {readSCB} from './file';

const ICLOUD_KEY = 'channel.backup';

export const handleChannelBackup = async () => {
  if (Platform.OS === 'ios') {
    await pushToCloud();
  } else if (Platform.OS === 'android') {
    await pushToStorage();
  }
};

const pushToCloud = async () => {
  try {
    const scbBase64 = await readSCB();
    if (!scbBase64) {
      return;
    }

    const Id = await DeviceInfo.getUniqueId();
    const key = await getKey();
    const json = stringify(scbBase64, Id);

    iCloudStorage.setItem(key, json);
  } catch (error) {
    console.log(error);
  }
};

const pushToStorage = async () => {
  const permission = await requestPermissionForExternalStorage();
  if (!permission) {
    console.log('cannot backup due to missing permissions');
    return;
  }

  try {
    //handle
  } catch (error) {
    console.log(error);
  }
};

export const fetchChannelBackup = async () => {
  let scbBase64;
  if (Platform.OS === 'ios') {
    scbBase64 = await fetchCloud();
  } else if (Platform.OS === 'android') {
    scbBase64 = await fetchExternalStorage();
  }
  console.log(scbBase64);
  return scbBase64 ? Buffer.from(scbBase64, 'base64') : null;
};

const fetchCloud = async () => {
  try {
    const key = await getKey();
    console.log(key);
    const json = await iCloudStorage.getItem(key);
    return json ? JSON.parse(json).data : null;
  } catch (error) {
    console.log(error);
  }
};

const fetchExternalStorage = async () => {
  const permission = await requestPermissionForExternalStorage();
  if (!permission) {
    console.log('cannot access backup due to missing permissions');
    return;
  }

  try {
    //handle
  } catch (error) {
    console.log(error);
  }
};

// helper functions
const stringify = (scbBase64, Id) => {
  return JSON.stringify({
    device: Id,
    data: scbBase64,
    time: new Date().toISOString(),
  });
};

const getKey = async () => {
  const shortId = await (await DeviceInfo.getUniqueId())
    .toString()
    .replace(/-/g, '')
    .slice(0, 7)
    .toLowerCase();
  const key = `${shortId}_${ICLOUD_KEY}`;
  return key;
};

const requestPermissionForExternalStorage = async () => {
  const granted = await await this._Permissions.request(
    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
  );
  return granted === PermissionsAndroid.RESULTS.GRANTED;
};
