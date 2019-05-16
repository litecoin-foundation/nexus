import bip21 from 'bip21';

export const decodeBIP21 = uri => {
  return bip21.decode(uri, 'litecoin');
};

export const encodeBIP21 = (address, options) => {
  return bip21.encode(address, options, 'litecoin');
};
