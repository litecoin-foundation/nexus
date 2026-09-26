import React, {useContext, useEffect} from 'react';
import {Image, ScrollView, Text, TouchableOpacity, View} from 'react-native';
import {DrawerScreenProps} from '@react-navigation/drawer';

import {ScreenSizeContext} from '../../../context/screenSize';
import {useAppSelector} from '../../../store/hooks';
import {COINS} from '../components/CoinSelector';
import {getMbsxStyles} from '../theme';
import MbsxBackButton from '../components/MbsxBackButton';
import {COIN_ICONS, swapCards} from '../swapCards';
import type {MbsxDrawerParamList} from '../types';

type Props = DrawerScreenProps<MbsxDrawerParamList, 'AddressList'>;

const AddressList: React.FC<Props> = ({navigation}) => {
  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);
  const styles = getMbsxStyles(SCREEN_HEIGHT);

  const byCoin = useAppSelector(state => state.mbsxAddresses.byCoin);

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => <MbsxBackButton onPress={() => navigation.goBack()} />,
      headerTitleContainerStyle: {left: 7},
    });
  }, [navigation]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {COINS.map(coin => {
          const saved = byCoin[coin] ?? [];
          return (
            <TouchableOpacity
              key={coin}
              testID={`mbsx-addresses-${coin}`}
              style={swapCards.card}
              onPress={() => navigation.navigate('CoinAddresses', {coin})}>
              <View style={swapCards.pair}>
                {COIN_ICONS[coin] ? (
                  <Image source={COIN_ICONS[coin]} style={swapCards.coinLogo} />
                ) : null}
                <Text style={swapCards.pairText}>{coin}</Text>
              </View>
              <Text style={swapCards.meta}>
                {saved.length === 0
                  ? 'No addresses'
                  : `${saved.length} address${saved.length === 1 ? '' : 'es'}`}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default AddressList;
