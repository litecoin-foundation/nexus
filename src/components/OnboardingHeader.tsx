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
      marginTop: screenHeight * 0.07,
    },
    headerDescriptionText: {
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '600',
      color: 'white',
      fontSize: screenHeight * 0.02,
      paddingHorizontal: 30,
    },
  });

export default OnboardingHeader;
