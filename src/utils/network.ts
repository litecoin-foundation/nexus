export type LitecoinNetwork = 'mainnet' | 'regtest';

// Dev branch: debug builds run against regtest. Release builds stay on mainnet
// so a build from this branch can never point a shipping wallet at a test chain.
export const getNetwork = (): LitecoinNetwork =>
  __DEV__ ? 'regtest' : 'mainnet';

export const isRegtest = () => getNetwork() === 'regtest';

// lnd keeps per-network chain data, so every path derived from this changes
// with the network. Mixing them would point a regtest run at mainnet wallet.db.
export const chainDir = (baseDir: string) =>
  `${baseDir}/lndltc/data/chain/litecoin/${getNetwork()}`;

export const logDir = (baseDir: string) =>
  `${baseDir}/lndltc/logs/litecoin/${getNetwork()}`;
