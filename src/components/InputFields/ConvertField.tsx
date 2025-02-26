import React, {useState, useEffect, useContext} from 'react';
import {Platform, Pressable, StyleSheet, Text, View} from 'react-native';
import {useSharedValue, withSpring, withTiming} from 'react-native-reanimated';

import {useAppSelector} from '../../store/hooks';
import {subunitSymbolSelector} from '../../reducers/settings';
import {defaultButtonSpring} from '../../theme/spring';

import {ScreenSizeContext} from '../../context/screenSize';

interface Props {
  amount: string;
  active: boolean;
  handlePress: () => void;
}

const ConvertField: React.FC<Props> = props => {
  const {amount, active, handlePress} = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const amountSymbol = useAppSelector(state => subunitSymbolSelector(state));
  const currencySymbol = useAppSelector(state => state.settings.currencySymbol);

  return (
    <Pressable style={styles.container} onPress={handlePress}>
      <View style={styles.amountsContainer}>
        <Text
          style={[
            styles.amountText,
            active ? {color: '#2C72FF'} : {color: '#747E87'},
          ]}>
          {amount}
        </Text>
      </View>
    </Pressable>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      backgroundColor: 'white',
      borderRadius: 11,
      borderWidth: 1,
      borderColor: '#e5e5e5',
      flexDirection: 'row',
      paddingLeft: 10,
      justifyContent: 'space-between',
      height: screenHeight * 0.055,
      marginVertical: 4,
    },
    amountText: {
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.028,
      fontStyle: 'normal',
      fontWeight: '700',
    },
    amountsContainer: {
      flex: 1,
      justifyContent: 'center',
    },
  });

export default ConvertField;
