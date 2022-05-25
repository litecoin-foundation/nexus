// BIP21 library from: https://github.com/bitcoinjs/bip21
// Copyright (c) 2018 bitcoinjs

import qs from 'qs';

const decode = (uri, urnScheme) => {
  urnScheme = urnScheme || 'litecoin';
  var urnSchemeActual = uri.slice(0, urnScheme.length).toLowerCase();
  if (urnSchemeActual !== urnScheme || uri.charAt(urnScheme.length) !== ':') {
    throw new Error('Invalid BIP21 URI: ' + uri);
  }

  var split = uri.indexOf('?');
  var address = uri.slice(
    urnScheme.length + 1,
    split === -1 ? undefined : split,
  );
  var query = split === -1 ? '' : uri.slice(split + 1);
  var options = qs.parse(query);

  if (options.amount) {
    options.amount = Number(options.amount);
    if (!isFinite(options.amount)) {
      throw new Error('Invalid amount');
    }
    if (options.amount < 0) {
      throw new Error('Invalid amount');
    }
  }

  return {address: address, options: options};
};

const encode = (address, options, urnScheme) => {
  options = options || {};
  var scheme = urnScheme || 'litecoin';
  var query = qs.stringify(options);

  if (options.amount) {
    if (!isFinite(options.amount)) {
      throw new TypeError('Invalid amount');
    }
    if (options.amount < 0) {
      throw new TypeError('Invalid amount');
    }
  }

  return scheme + ':' + address + (query ? '?' : '') + query;
};

export const decodeBIP21 = uri => {
  return decode(uri, 'litecoin');
};

export const encodeBIP21 = (address, options) => {
  return encode(address, options, 'litecoin');
};
