import * as RNFS from '@dr.pogodin/react-native-fs';
import {fileExists} from './file';

const getMainnetConfig = (torEnabled: boolean = false) => {
  const baseConfig = `
  [Application Options]
  debuglevel=info
  maxbackoff=2s
  norest=1
  nolisten=1
  sync-freelist=1
  accept-keysend=1
  tlsdisableautofill=1

  [Routing]
  routing.assumechanvalid=1

  [Litecoin]
  litecoin.active=1
  litecoin.mainnet=1
  litecoin.node=neutrino

  [Neutrino]
  neutrino.addpeer=88.198.50.4:9333
  neutrino.addpeer=95.164.53.38:9333
  neutrino.addpeer=51.178.97.131:9333
  neutrino.addpeer=61.19.252.171:9333
  neutrino.addpeer=70.16.140.32:9333
  neutrino.addpeer=51.222.109.157:9333
  neutrino.addpeer=12.34.98.148:9333
  neutrino.addpeer=115.179.102.163:9333
  neutrino.addpeer=104.172.235.227:9333
  neutrino.addpeer=174.60.78.162:9333
  neutrino.feeurl=https://litecoinspace.org/api/v1/fees/recommended-lnd`;

  if (torEnabled) {
    return (
      baseConfig +
      `

  [tor]
  tor.active=1
  tor.socks=127.0.0.1:9150
  tor.streamisolation=1`
    );
  }

  return baseConfig;
};

export const createConfig = (torEnabled: boolean = false) => {
  return new Promise(async (resolve, reject) => {
    const lndConfPath = `${RNFS.DocumentDirectoryPath}/lndltc/lnd.conf`;
    try {
      const lndDir = `${RNFS.DocumentDirectoryPath}/lndltc`;
      const lndDirExists = await fileExists(lndDir);
      if (!lndDirExists) {
        await RNFS.mkdir(lndDir);
      }

      const config = getMainnetConfig(torEnabled);
      RNFS.writeFile(lndConfPath, config).then(() => {
        resolve(true);
      });
    } catch (error) {
      reject(error);
    }
  });
};
