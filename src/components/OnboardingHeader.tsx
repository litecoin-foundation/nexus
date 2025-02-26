import React, {useContext} from 'react';
import {View, StyleSheet, SafeAreaView} from 'react-native';

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
  thin?: boolean;
}

const OnboardingHeader: React.FC<Props> = props => {
  const {description, children, textKey, textDomain, textInterpolation, thin} =
    props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT, thin || false);

  return (
    <SafeAreaView>
      <View style={styles.headerContainer}>
        {description ? (
          <TranslateText
            textValue={description}
            textStyle={styles.headerDescriptionText}
            maxSizeInPixels={SCREEN_HEIGHT * 0.017}
          />
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

const getStyles = (screenWidth: number, screenHeight: number, thin: boolean) =>
  StyleSheet.create({
    headerContainer: {
      paddingTop: screenHeight * 0.055,
    },
    headerDescriptionText: {
      color: 'white',
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: thin ? '500' : '600',
      fontSize: screenHeight * 0.015,
      // screenHeight * 0.002 is approx font diff offset
      paddingHorizontal: screenWidth * 0.15 + screenHeight * 0.002,
    },
  });

export default OnboardingHeader;
