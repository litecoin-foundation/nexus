import React, {useContext} from 'react';
import {View, StyleSheet} from 'react-native';
import CustomSafeAreaView from './CustomSafeAreaView';

import TranslateText from './TranslateText';
import {useScreenHeaderLayout} from './ScreenHeader';
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

  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);
  const {titleLeft} = useScreenHeaderLayout();
  const styles = getStyles(SCREEN_HEIGHT, titleLeft, thin || false);

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

const getStyles = (screenHeight: number, titleLeft: number, thin: boolean) =>
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
      paddingHorizontal: titleLeft,
    },
  });

export default OnboardingHeader;
