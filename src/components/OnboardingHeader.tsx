import React, {useContext} from 'react';
import {View, StyleSheet} from 'react-native';
import CustomSafeAreaView from './CustomSafeAreaView';

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
    <CustomSafeAreaView edges={['top']}>
      <View style={styles.headerContainer}>
        {description ? (
          <TranslateText
            textValue={description}
            textStyle={styles.headerDescriptionText}
            maxSizeInPixels={SCREEN_HEIGHT * 0.02}
          />
        ) : textKey && textDomain ? (
          <TranslateText
            textKey={textKey}
            domain={textDomain}
            interpolationObj={textInterpolation}
            textStyle={styles.headerDescriptionText}
            maxSizeInPixels={SCREEN_HEIGHT * 0.02}
          />
        ) : (
          <></>
        )}

        {children}
      </View>
    </CustomSafeAreaView>
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
      fontSize: screenHeight * 0.017,
      // screenWidth * 0.04 = header button left padding
      // screenHeight * 0.035 = header back button width
      // 7 = header title padding
      // screenHeight * 0.005 = approx difference between desc and title
      paddingHorizontal:
        screenWidth * 0.04 + screenHeight * 0.035 + 7 + screenHeight * 0.005,
    },
  });

export default OnboardingHeader;
