import React, {useEffect, useContext, useMemo} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Animated from 'react-native-reanimated';

import {triggerHeavyFeedback} from '../../utils/haptic';
import PlasmaModal from './PlasmaModal';

import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';
import {PopUpContext} from '../../context/popUpContext';

interface Props {
  isVisible: boolean;
  close: () => void;
  textColor: string;
  text?: string;
  textKey?: string;
  textDomain?: string;
  disableBlur?: boolean;
}

const InfoModal: React.FC<Props> = props => {
  const {isVisible, close, textColor, text, textKey, textDomain, disableBlur} =
    props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = useMemo(
    () => getStyles(SCREEN_WIDTH, SCREEN_HEIGHT),
    [SCREEN_WIDTH, SCREEN_HEIGHT],
  );

  useEffect(() => {
    if (isVisible) {
      triggerHeavyFeedback();
    }
  }, [isVisible]);

  useEffect(() => {
    if (isVisible) {
      setTimeout(() => close(), 2500);
    }
  }, [isVisible, close]);

  const {showPopUp} = useContext(PopUpContext);

  const textColorStyle =
    textColor === 'red'
      ? styles.redText
      : textColor === 'green'
        ? styles.greenText
        : null;

  const modal = useMemo(
    () => (
      <PlasmaModal
        isOpened={isVisible}
        close={() => close()}
        isFromBottomToTop={true}
        animDuration={250}
        gapInPixels={0}
        backSpecifiedStyle={styles.transparentBackground}
        disableBlur={disableBlur}
        renderBody={(_, __, ___, ____, cardTranslateAnim) => (
          <Animated.View style={[styles.modal, cardTranslateAnim]}>
            <View style={styles.textContainer}>
              {text ? (
                <Text style={[styles.text, textColorStyle]}>{text}</Text>
              ) : textKey && textDomain ? (
                <TranslateText
                  textKey={textKey}
                  domain={textDomain}
                  maxSizeInPixels={SCREEN_HEIGHT * 0.02}
                  textStyle={{...styles.text, ...textColorStyle}}
                  numberOfLines={1}
                />
              ) : (
                <></>
              )}
            </View>
          </Animated.View>
        )}
      />
    ),
    [
      isVisible,
      close,
      disableBlur,
      text,
      textKey,
      textDomain,
      textColorStyle,
      SCREEN_HEIGHT,
      styles,
    ],
  );

  useEffect(() => {
    showPopUp(modal);
  }, [showPopUp, modal]);

  return <></>;
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    modal: {
      position: 'absolute',
      bottom: 0,
      backgroundColor: '#fff',
      width: screenWidth,
      height: screenHeight * 0.1,
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      shadowColor: '#000000',
      shadowOpacity: 0.1,
      shadowRadius: 5,
      elevation: 2,
      shadowOffset: {
        height: -3,
        width: 0,
      },
    },
    textContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: screenHeight * 0.025,
    },
    text: {
      fontSize: screenHeight * 0.018,
      fontWeight: 'bold',
      letterSpacing: -0.18,
    },
    redText: {
      color: '#cc3939',
    },
    greenText: {
      color: '#20BB74',
    },
    transparentBackground: {
      backgroundColor: 'transparent',
    },
  });

export default InfoModal;
