import React, {useState, useContext, useLayoutEffect} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';

import {useAppDispatch, useAppSelector} from '../../store/hooks';

import LitecoinIcon from '../LitecoinIcon';
import Switch from '../Buttons/Switch';
import {setAlertAvailability} from '../../reducers/alerts';
import {convertLocalFiatToUSD} from '../../reducers/ticker';
import {formatTxDate} from '../../lib/utils/date';

import {ScreenSizeContext} from '../../context/screenSize';

interface Props {
  data: any;
  onPress: (index: number) => void;
}

const AlertCell: React.FC<Props> = props => {
  const {data, onPress} = props;

  const {width, height} = useContext(ScreenSizeContext);
  const styles = getStyles(width, height);

  const item = data;
  const dispatch = useAppDispatch();
  const currencySymbol = useAppSelector(state => state.settings.currencySymbol);
  const localFiatToUSD = useAppSelector(state => convertLocalFiatToUSD(state));
  const alertValueInLocalFiat = parseFloat(
    String(item.value / localFiatToUSD),
  ).toFixed(2);

  const handleSwitch = (value: boolean) => {
    dispatch(setAlertAvailability(item.index, value));
  };

  const [lastTimePrice, setLastTimePrice] = useState('');

  async function getLastTimePrice() {
    try {
      const price = item.value;
      const res = await fetch(
        'https://mobile.litecoin.com/api/prices/lastprice',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            price,
          }),
        },
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error);
      } else {
        const resData: any = await res.json();

        if (resData.hasOwnProperty('timestamp')) {
          setLastTimePrice(formatTxDate(resData.timestamp));
        }
      }
    } catch {}
  }

  useLayoutEffect(() => {
    getLastTimePrice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(item.index)}>
      <View style={styles.topContainer}>
        <View style={styles.subContainer}>
          <LitecoinIcon size={height * 0.046} />
          <View>
            <Text style={styles.text}>Litecoin (LTC) is above</Text>
            <Text style={styles.valueText}>
              {`${currencySymbol}${alertValueInLocalFiat}`}
            </Text>
          </View>
        </View>
        <View style={styles.switchContainer}>
          <Switch initialValue={!item.isFired} onPress={handleSwitch} />
        </View>
      </View>
      <View style={styles.bottomContainer}>
        <Text style={styles.dateText}>
          Last time LTC reached this value was {lastTimePrice}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      height: screenHeight * 0.12,
      borderColor: '#97979748',
      borderBottomWidth: 1,
      backgroundColor: '#fff',
    },
    topContainer: {
      flexBasis: '75%',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    bottomContainer: {
      flexBasis: '25%',
      justifyContent: 'flex-start',
      paddingHorizontal: screenWidth * 0.04,
    },
    subContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    switchContainer: {
      justifyContent: 'center',
      paddingRight: screenWidth * 0.04,
    },
    text: {
      color: '#484859',
      fontSize: screenHeight * 0.015,
      fontWeight: '700',
      letterSpacing: -0.18,
    },
    valueText: {
      color: '#2C72FF',
      fontSize: screenHeight * 0.03,
      fontWeight: '700',
      letterSpacing: -0.39,
    },
    dateText: {
      color: '#7C96AE',
      fontSize: screenHeight * 0.013,
      fontWeight: '600',
      letterSpacing: -0.28,
    },
  });

export default AlertCell;
