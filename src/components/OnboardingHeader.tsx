import React, {useContext} from 'react';
import {View, Text, StyleSheet, SafeAreaView} from 'react-native';

import {ScreenSizeContext} from '../context/screenSize';

interface Props {
  description: string;
  children?: React.ReactNode;
}

const OnboardingHeader: React.FC<Props> = props => {
  const {description, children} = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  return (
    <SafeAreaView>
      <View style={styles.headerContainer}>
        <Text style={styles.headerDescriptionText}>{description}</Text>
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
