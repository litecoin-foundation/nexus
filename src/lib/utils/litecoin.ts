export const LITECOIN = {
  messagePrefix: '\x19Litecoin Signed Message:\n',
  bech32: 'ltc',
  bip32: {
    public: 0x019da462, // Ltub
    private: 0x019d9cfe, // Ltpv
  },
  pubKeyHash: 0x30,
  scriptHash: 0x32,
  wif: 0xb0,
};

export const LITECOIN_WITH_ZPRV = {
  messagePrefix: '\x19Litecoin Signed Message:\n',
  bech32: 'ltc',
  bip32: {
    public: 0x04b24746, // zpub
    private: 0x04b2430c, // zprv
  },
  pubKeyHash: 0x30,
  scriptHash: 0x32,
  wif: 0xb0,
};
