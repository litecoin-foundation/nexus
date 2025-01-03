import React, {useContext} from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';

import {ScreenSizeContext} from '../../context/screenSize';

interface Props {
  active: boolean;
}

const Dot: React.FC<Props> = props => {
  const {active} = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  return (
    <TouchableOpacity
      accessible={false}
      style={styles.dotContainerStyle}
      activeOpacity={1}>
      <View style={[styles.dotStyle, !active ? styles.inactive : null]} />
    </TouchableOpacity>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    dotContainerStyle: {
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: 8,
    },
    dotStyle: {
      width: screenHeight * 0.016,
      height: screenHeight * 0.016,
      borderRadius: (screenHeight * 0.016) / 2,
      backgroundColor: '#f7f7f7',
    },
    inactive: {
      opacity: 0.5,
    },
  });

export default Dot;
