import React from 'react';
import {Image, View} from 'react-native';

import {COIN_ICONS} from '../swapCards';

const CoinPair = ({
  from,
  to,
  size = 36,
}: {
  from: string;
  to: string;
  size?: number;
}) => {
  const coin = Math.round(size * 0.68);
  return (
    <View style={{width: size, height: size}}>
      {COIN_ICONS[to] ? (
        <Image
          source={COIN_ICONS[to]}
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            width: coin,
            height: coin,
            borderRadius: coin / 2,
          }}
        />
      ) : null}
      {COIN_ICONS[from] ? (
        <Image
          source={COIN_ICONS[from]}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: coin,
            height: coin,
            borderRadius: coin / 2,
            borderWidth: 2,
            borderColor: '#fff',
          }}
        />
      ) : null}
    </View>
  );
};

export default CoinPair;
