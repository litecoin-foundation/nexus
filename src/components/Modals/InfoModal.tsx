import React, {useEffect} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Animated from 'react-native-reanimated';

import {triggerHeavyFeedback} from '../../lib/utils/haptic';
import PlasmaModal from './PlasmaModal';

interface Props {
  isVisible: boolean;
  close: () => void;
  textColor: string;
  text: string;
  disableBlur?: boolean;
}

const InfoModal: React.FC<Props> = props => {
  const {isVisible, close, textColor, text, disableBlur} = props;

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

  return (
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
};

const styles = StyleSheet.create({
  modal: {
    flex: 1,
    backgroundColor: 'white',
    width: '100%',
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    position: 'absolute',
    bottom: 0,
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
    alignItems: 'center',
    paddingLeft: 25,
    paddingRight: 25,
    paddingTop: 25,
    paddingBottom: 25,
    height: 95,
  },
  text: {
    fontSize: 13,
    fontWeight: 'bold',
    lineHeight: 15,
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
