import React, {useEffect, useContext} from 'react';
import {View, StyleSheet} from 'react-native';
import Animated from 'react-native-reanimated';

import GreyRoundButton from '../Buttons/GreyRoundButton';
import BlueButton from '../Buttons/BlueButton';
import PlasmaModal from './PlasmaModal';

import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';
import {PopUpContext} from '../../context/popUpContext';

interface Props {
  isVisible: boolean;
  close: () => void;
  onPress: () => void;
}

const AlertModal: React.FC<Props> = props => {
  const {isVisible, close, onPress} = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const {showPopUp} = useContext(PopUpContext);

  const modal = (
    <PlasmaModal
      isOpened={isVisible}
      close={() => close()}
      isFromBottomToTop={true}
      animDuration={250}
      gapInPixels={0}
      backSpecifiedStyle={{backgroundColor: 'transparent'}}
      renderBody={(_, __, ___, ____, cardTranslateAnim) => (
        <Animated.View style={[styles.modal, cardTranslateAnim]}>
          <View style={styles.modalHeaderContainer}>
            <TranslateText
              textKey="delete"
              domain="modals"
              maxSizeInPixels={SCREEN_HEIGHT * 0.025}
              textStyle={styles.modalHeaderTitle}
              numberOfLines={3}
            />
            <GreyRoundButton onPress={() => close()} />
          </View>

          <View style={styles.buttonContainer}>
            <BlueButton
              textKey="delete_alert"
              textDomain="modals"
              onPress={() => {
                onPress();
                close();
              }}
            />
          </View>
        </Animated.View>
      )}
    />
  );

  useEffect(() => {
    showPopUp(modal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, close, onPress]);

  return <></>;
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    modal: {
      position: 'absolute',
      bottom: 0,
      backgroundColor: '#fff',
      width: screenWidth,
      height: screenHeight * 0.2,
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 5,
      elevation: 2,
      shadowOffset: {
        height: -3,
        width: 0,
      },
    },
    modalHeaderContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: screenWidth * 0.04,
    },
    modalHeaderTitle: {
      color: '#4E6070',
      fontSize: screenHeight * 0.028,
      fontWeight: '700',
    },
    buttonContainer: {
      width: '100%',
      paddingHorizontal: screenWidth * 0.04,
      paddingBottom: screenHeight * 0.03,
    },
    text: {
      color: '#4A4A4A',
      fontSize: screenHeight * 0.015,
      fontWeight: 'bold',
    },
  });

export default AlertModal;
