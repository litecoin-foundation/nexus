import React, {useContext} from 'react';
import {View, Text, StyleSheet, SafeAreaView} from 'react-native';

import TranslateText from './TranslateText';

import {ScreenSizeContext} from '../context/screenSize';

interface Props {
  description?: string;
  children?: React.ReactNode;
  textKey?: string;
  textDomain?: string;
  textInterpolation?: {
    [key: string]: any;
  };
}

const OnboardingHeader: React.FC<Props> = props => {
  const {description, children, textKey, textDomain, textInterpolation} = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  return (
    <SafeAreaView>
      <View style={styles.headerContainer}>
        {description ? (
          <Text style={styles.headerDescriptionText}>{description}</Text>
        ) : textKey && textDomain ? (
          <TranslateText
            textKey={textKey}
            domain={textDomain}
            interpolationObj={textInterpolation}
            textStyle={styles.headerDescriptionText}
          />
        ) : (
          <></>
        )}

        {children}
      </View>
    </SafeAreaView>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    headerContainer: {
      paddingTop: screenHeight * 0.055,
    },
    headerDescriptionText: {
      color: 'white',
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '600',
      fontSize: screenHeight * 0.015,
      // screenHeight * 0.0022 is approx font diff offset
      paddingLeft: screenWidth * 0.15 + screenHeight * 0.002,
    },
  });

export default OnboardingHeader;
