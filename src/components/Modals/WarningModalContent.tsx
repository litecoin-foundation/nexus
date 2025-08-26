import React, {useEffect, useContext, useMemo} from 'react';
import {View, StyleSheet} from 'react-native';
import Animated from 'react-native-reanimated';

import PlasmaModal from './PlasmaModal';
import BlueButton from '../Buttons/BlueButton';

import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';
import {PopUpContext} from '../../context/popUpContext';

interface Props {
  isVisible: boolean;
  close: () => void;
  text?: string;
  textKey?: string;
  textDomain?: string;
  disableBlur?: boolean;
}

const WarningModalContent: React.FC<Props> = props => {
  const {isVisible, close, text, textKey, textDomain, disableBlur} = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = useMemo(
    () => getStyles(SCREEN_WIDTH, SCREEN_HEIGHT),
    [SCREEN_WIDTH, SCREEN_HEIGHT],
  );

  const {showPopUp} = useContext(PopUpContext);

  const modal = useMemo(
    () => (
      <PlasmaModal
        isOpened={isVisible}
        close={close}
        isFromBottomToTop={true}
        animDuration={250}
        gapInPixels={0}
        backSpecifiedStyle={styles.transparentBackground}
        disableBlur={disableBlur}
        renderBody={(_, __, ___, ____, cardTranslateAnim) => (
          <Animated.View style={[styles.modal, cardTranslateAnim]}>
            <View style={styles.textContainer}>
              {text ? (
                <TranslateText
                  textValue={text}
                  maxSizeInPixels={SCREEN_HEIGHT * 0.024}
                  textStyle={styles.text}
                  numberOfLines={5}
                />
              ) : textKey && textDomain ? (
                <TranslateText
                  textKey={textKey}
                  domain={textDomain}
                  maxSizeInPixels={SCREEN_HEIGHT * 0.024}
                  textStyle={styles.text}
                  numberOfLines={5}
                />
              ) : (
                <></>
              )}
            </View>
            <View style={styles.button}>
              <BlueButton textKey="got_it" textDomain="main" onPress={close} />
            </View>
          </Animated.View>
        )}
      />
    ),
    [
      isVisible,
      close,
      text,
      textKey,
      textDomain,
      disableBlur,
      SCREEN_HEIGHT,
      styles,
    ],
  );

  useEffect(() => {
    showPopUp(modal, 'warning-modal');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]);

  return <></>;
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    modal: {
      position: 'absolute',
      bottom: screenHeight * 0.35,
      left: screenWidth * 0.1,
      backgroundColor: '#fff',
      width: screenWidth * 0.8,
      height: screenHeight * 0.3,
      alignItems: 'center',
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      borderBottomLeftRadius: 30,
      borderBottomRightRadius: 30,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.07,
      shadowRadius: 3,
    },
    textContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: screenHeight * 0.025,
    },
    text: {
      color: '#000',
      fontSize: screenHeight * 0.02,
      fontWeight: 'bold',
      textAlign: 'center',
      letterSpacing: -0.18,
    },
    button: {
      width: screenWidth * 0.8 - screenHeight * 0.04,
      marginBottom: screenHeight * 0.02,
    },
    transparentBackground: {
      backgroundColor: 'transparent',
    },
  });

export default WarningModalContent;
