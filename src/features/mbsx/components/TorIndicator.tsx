import React, {useContext} from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {ScreenSizeContext} from '../../../context/screenSize';
import {useAppSelector} from '../../../store/hooks';

// The running core's setting, not Nexus's switch: a flip applies only on re-entry
const TorIndicator: React.FC = () => {
  const tor = useAppSelector(state => state.mbsx.torApplied);
  const {width, height} = useContext(ScreenSizeContext);
  if (tor !== true) {
    return null;
  }
  const styles = getStyles(width, height);
  return (
    <View testID="mbsx-tor-indicator" style={styles.pill}>
      <Text style={styles.text}>Tor On</Text>
    </View>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    pill: {
      borderRadius: screenHeight * 0.01,
      backgroundColor: 'rgba(216,216,216,0.2)',
      height: screenHeight * 0.035,
      minHeight: 25,
      justifyContent: 'center',
      paddingHorizontal: screenWidth * 0.02,
      marginRight: screenWidth * 0.04,
    },
    text: {
      color: 'white',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.013,
      fontWeight: '700',
    },
  });

export default TorIndicator;
