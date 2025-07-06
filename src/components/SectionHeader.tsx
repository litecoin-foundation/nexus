import React, {useContext} from 'react';
import {View, StyleSheet} from 'react-native';
import TranslateText from './TranslateText';
import {ScreenSizeContext} from '../context/screenSize';

interface SectionHeaderProps {
  textKey: string;
  domain?: string;
  marginTopMultiplier?: number;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  textKey,
  domain = 'settingsTab',
  marginTopMultiplier = 0.025,
}) => {
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);

  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  return (
    <View
      style={[
        styles.container,
        {marginTop: SCREEN_HEIGHT * marginTopMultiplier},
      ]}>
      <TranslateText
        textKey={textKey}
        domain={domain}
        textStyle={styles.headerText}
        maxSizeInPixels={SCREEN_HEIGHT * 0.015}
      />
    </View>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 25,
      marginBottom: screenHeight * 0.012,
    },
    headerText: {
      color: 'rgba(116, 126, 135, 1)',
      fontFamily: 'SatoshiVariable-Bold',
      fontSize: screenHeight * 0.015,
      fontWeight: '700',
      fontStyle: 'normal',
      textTransform: 'uppercase',
    },
  });

export default SectionHeader;
