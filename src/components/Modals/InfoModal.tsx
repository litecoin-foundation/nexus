import React, {useEffect, useContext} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Animated from 'react-native-reanimated';

import {triggerHeavyFeedback} from '../../lib/utils/haptic';
import PlasmaModal from './PlasmaModal';

import {ScreenSizeContext} from '../../context/screenSize';
import {PopUpContext} from '../../context/popUpContext';

interface Props {
  isVisible: boolean;
  close: () => void;
  textColor: string;
  text: string;
  disableBlur?: boolean;
}

const InfoModal: React.FC<Props> = props => {
  const {isVisible, close, textColor, text, disableBlur} = props;

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

  const modalT = (
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
            <Text
              style={[
                styles.text,
                textColor === 'red'
                  ? styles.redText
                  : textColor === 'green'
                  ? styles.greenText
                  : null,
              ]}>
              {text}
            </Text>
          </View>
        </Animated.View>
      )}
    />
  );

  useEffect(() => {
    showPopUp(modalT);
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
      borderTopLeftRadius: 35,
      borderTopRightRadius: 35,
      shadowColor: '#000000',
      shadowOpacity: 0.1,
      shadowRadius: 5,
      elevation: 2,
      shadowOffset: {
        height: -3,
        width: 0,
      },
    },
    noMargin: {
      margin: 0,
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
