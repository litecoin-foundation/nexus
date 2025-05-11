import React, {useEffect, useContext} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Animated from 'react-native-reanimated';

import {triggerHeavyFeedback} from '../../lib/utils/haptic';
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
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  useEffect(() => {
    if (isVisible) {
      triggerHeavyFeedback();
    }
  });

  useEffect(() => {
    if (isVisible) {
      setTimeout(() => close(), 2500);
    }
  });

  const {showPopUp} = useContext(PopUpContext);

  const textColorStyle =
    textColor === 'red'
      ? styles.redText
      : textColor === 'green'
        ? styles.greenText
        : null;

  const modal = (
    <PlasmaModal
      isOpened={isVisible}
      close={() => close()}
      isFromBottomToTop={true}
      animDuration={250}
      gapInPixels={0}
      backSpecifiedStyle={{backgroundColor: 'transparent'}}
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
  );

  useEffect(() => {
    showPopUp(modal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, close, textColor, text, disableBlur]);

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
      color: '#F04E37',
    },
    greenText: {
      color: '#78C223',
    },
  });

export default InfoModal;
