import React, {useContext} from 'react';
import {Text, TouchableOpacity, View} from 'react-native';

import {ScreenSizeContext} from '../../../context/screenSize';
import {getMbsxStyles} from '../theme';

// Replaces the example's react-native-element-dropdown, which nexus does not
// depend on. Two coins do not need a searchable dropdown.
const COINS = ['BTC', 'PART'];

type Props = {
  label: string;
  value: string;
  onChange: (coin: string) => void;
};

const CoinSelector: React.FC<Props> = ({label, value, onChange}) => {
  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);
  const styles = getMbsxStyles(SCREEN_HEIGHT);

  return (
    <View>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.chipRow}>
        {COINS.map(coin => (
          <TouchableOpacity
            key={coin}
            testID={`mbsx-coin-${coin}`}
            accessibilityRole="button"
            // Which chip is selected is otherwise carried by its styling alone,
            // so nothing outside the render can tell whether a tap took.
            accessibilityState={{selected: value === coin}}
            style={[styles.chip, value === coin ? styles.chipSelected : null]}
            onPress={() => onChange(coin)}>
            <Text
              style={[
                styles.chipText,
                value === coin ? styles.chipTextSelected : null,
              ]}>
              {coin}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default CoinSelector;
