import React, {useContext} from 'react';
import {View, StyleSheet} from 'react-native';
import CodeInput from '../CodeInput';

import BuyButton from './BuyButton';
import PadGrid from './PadGrid';

import TranslateText from '../../components/TranslateText';
import CustomSafeAreaView from '../../components/CustomSafeAreaView';
import {ScreenSizeContext} from '../../context/screenSize';

interface Props {
  currentCode: string;
  submitButton: React.ReactNode;
  onChange: (value: string) => void;
  titleKey: string;
  titleDomain: string;
  dotDisabled?: boolean;
  small?: boolean;
}

const NumpadInput: React.FC<Props> = props => {
  const {
    currentCode,
    submitButton,
    onChange,
    titleKey,
    titleDomain,
    dotDisabled,
    small,
  } = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT, small || false);

  const handlePress = (input: string) => {
    switch (input) {
      case '⌫':
        if (currentCode.length > 0) {
          onChange(currentCode.substring(0, currentCode.length - 1));
        }
        break;
      default:
        onChange(currentCode + input);
        break;
    }
  };

  const values = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'];
  const buttons = values.map(value => {
    if (value === '.') {
      return (
        <BuyButton
          key="dot-button-key"
          value={value}
          disabled={dotDisabled}
          onPress={() => handlePress(value)}
          small={small}
        />
      );
    }
    if (value === '⌫') {
      return (
        <BuyButton
          key="back-arrow-button-key"
          value={value}
          onPress={() => handlePress(value)}
          imageSource={require('../../assets/icons/back-arrow.png')}
          small={small}
        />
      );
    }
    return (
      <BuyButton
        key={value}
        value={value}
        onPress={() => handlePress(value)}
        small={small}
      />
    );
  });

  return (
    <CustomSafeAreaView
      styles={[styles.bottomSheet, styles.safeArea]}
      edges={['bottom']}>
      <TranslateText
        textKey={titleKey}
        domain={titleDomain}
        maxSizeInPixels={SCREEN_HEIGHT * 0.03}
        maxLengthInPixels={SCREEN_WIDTH}
        textStyle={styles.bottomSheetTitle}
        numberOfLines={1}
      />

      <View style={styles.pinContainer}>
        <CodeInput codeInactive={false} codeLength={6} value={currentCode} />
      </View>

      <PadGrid small={small} />
      <View style={styles.pinButtonContainer}>{buttons}</View>

      <View style={styles.confirmButtonContainer}>{submitButton}</View>
    </CustomSafeAreaView>
  );
};

const getStyles = (screenWidth: number, screenHeight: number, small: boolean) =>
  StyleSheet.create({
    bottomSheet: {
      position: 'absolute',
      bottom: 0,
      width: screenWidth,
      height: screenHeight * 0.65,
      backgroundColor: '#ffffff',
      borderTopLeftRadius: screenHeight * 0.03,
      borderTopRightRadius: screenHeight * 0.03,
    },
    safeArea: {
      flex: 1,
      paddingBottom: screenHeight * 0.01,
    },
    bottomSheetTitle: {
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: 'bold',
      color: '#2e2e2e',
      fontSize: screenHeight * 0.026,
      textAlign: 'center',
      paddingTop: screenHeight * 0.02,
    },
    pinContainer: {
      marginBottom: screenHeight * 0.01 * -1,
    },
    pinButtonContainer: {
      height: small ? screenHeight * 0.36 : screenHeight * 0.4,
      flexDirection: 'row',
      justifyContent: 'space-evenly',
      flexWrap: 'wrap',
    },
    confirmButtonContainer: {
      width: '100%',
      paddingTop: screenHeight * 0.02,
      paddingHorizontal: screenWidth * 0.06,
    },
  });

export default NumpadInput;
