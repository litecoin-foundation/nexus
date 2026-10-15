export type LitecoinNetwork = 'mainnet' | 'regtest';

// mbsx_debug rebases a single commit onto this branch to return 'regtest', and
// carries lnd's regtest config with it.  The two must move together: a regtest
// view over a mainnet lnd would fund swaps from the wrong chain.
export const getNetwork = (): LitecoinNetwork => 'mainnet';
