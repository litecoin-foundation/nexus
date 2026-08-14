import React, {useContext} from 'react';
import {ScrollView, Text, TouchableOpacity, View} from 'react-native';
import {DrawerScreenProps} from '@react-navigation/drawer';

import {ScreenSizeContext} from '../../../context/screenSize';
import {useAppSelector} from '../../../store/hooks';
import {COINS} from '../components/CoinSelector';
import {getMbsxStyles} from '../theme';
import type {MbsxDrawerParamList} from '../types';

type Props = DrawerScreenProps<MbsxDrawerParamList, 'AddressList'>;

const AddressList: React.FC<Props> = ({navigation}) => {
  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);
  const styles = getMbsxStyles(SCREEN_HEIGHT);

  const byCoin = useAppSelector(state => state.mbsxAddresses.byCoin);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {COINS.map(coin => {
          const saved = byCoin[coin] ?? [];
          return (
            <TouchableOpacity
              key={coin}
              testID={`mbsx-addresses-${coin}`}
              style={styles.stackedRow}
              onPress={() => navigation.navigate('CoinAddresses', {coin})}>
              <Text style={styles.rowPrimary}>{coin}</Text>
              <Text style={styles.rowSecondary}>
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
