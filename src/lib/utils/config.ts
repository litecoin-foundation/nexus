import * as FileSystem from 'expo-file-system';
import {fileExists} from './file';

const mainnetConfig = `
  [Application Options]
  debuglevel=info
  maxbackoff=2s
  norest=1
  sync-freelist=1
  accept-keysend=1

  [Routing]
  routing.assumechanvalid=1

  [Litecoin]
  litecoin.active=1
  litecoin.mainnet=1
  litecoin.node=neutrino

  [Neutrino]
  neutrino.addpeer=88.198.50.4:9333
  neutrino.addpeer=51.222.109.157:9333
  neutrino.addpeer=12.34.98.148:9333
  neutrino.addpeer=115.179.102.163:9333
  neutrino.addpeer=104.172.235.227:9333
  neutrino.feeurl=https://litecoinspace.org/api/v1/fees/recommended-lnd
`;

export const createConfig = () => {
  return new Promise(async (resolve, reject) => {
    const lndConfPath = `${FileSystem.documentDirectory}/lndltc/lnd.conf`;
    try {
      // check if config exists
      if (await fileExists(lndConfPath)) {
        resolve(true);
      }
      // otherwise continues...
      const lndDir = `${FileSystem.documentDirectory}/lndltc`;
      if (!fileExists(lndDir)) {
        await FileSystem.makeDirectoryAsync(lndDir);
      }
      FileSystem.writeAsStringAsync(lndConfPath, mainnetConfig).then(() => {
        resolve(true);
      });
    } catch (error) {
      reject(error);
    }
  });
};
