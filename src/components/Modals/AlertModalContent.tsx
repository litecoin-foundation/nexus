import React, {useEffect, useContext} from 'react';
import {View, StyleSheet} from 'react-native';
import Animated from 'react-native-reanimated';
import {useTranslation} from 'react-i18next';

import GreyRoundButton from '../Buttons/GreyRoundButton';
import BlueButtonV2 from '../ButtonsV2/BlueButtonV2';
import PlasmaModal from './PlasmaModal';
import {useAppSelector} from '../../store/hooks';
import {SCREEN_CORNER_RADIUS} from '../../utils/screenCornerRadius';

import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';
import {PopUpContext} from '../../context/popUpContext';
import {GAP_RATIO} from '../ButtonsV2/fixedBottomStyle';

export interface SelectedAlert {
  index: number;
  isPositive: boolean;
  valueInLocal: number;
}

interface Props {
  isVisible: boolean;
  alert: SelectedAlert | null;
  close: () => void;
  onPress: () => void;
}

const toSentenceCase = (text: string) =>
  text.charAt(0).toLocaleUpperCase() + text.slice(1).toLocaleLowerCase();

const AlertModal: React.FC<Props> = props => {
  const {isVisible, alert, close, onPress} = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const {showPopUp} = useContext(PopUpContext);

  const {t} = useTranslation('alertsTab');
  const currencySymbol = useAppSelector(
    state => state.settings!.currencySymbol,
  );
  const title = alert
    ? `${toSentenceCase(t(alert.isPositive ? 'above' : 'below'))} ${currencySymbol}${alert.valueInLocal}`
    : '';

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
              textValue={title}
              maxSizeInPixels={SCREEN_HEIGHT * 0.025}
              textStyle={styles.modalHeaderTitle}
              numberOfLines={3}
            />
            <GreyRoundButton circle onPress={() => close()} />
          </View>

          <View style={styles.buttonContainer}>
            <BlueButtonV2
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
  }, [isVisible, title, close, onPress]);

  return <></>;
};

const getStyles = (screenWidth: number, screenHeight: number) => {
  const inset = screenWidth * 0.03;
  const borderRadius =
    SCREEN_CORNER_RADIUS && SCREEN_CORNER_RADIUS > inset
      ? SCREEN_CORNER_RADIUS - inset
      : screenHeight * 0.04;

  return StyleSheet.create({
    modal: {
      position: 'absolute',
      left: inset,
      right: inset,
      bottom: inset,
      backgroundColor: '#fff',
      height: screenHeight * 0.2,
      justifyContent: 'space-between',
      borderRadius,
      borderCurve: 'continuous',
      boxShadow: [
        {
          offsetX: 0,
          offsetY: 12,
          blurRadius: 32,
          color: 'rgba(0,0,0,0.16)',
        },
        {
          offsetX: 0,
          offsetY: 2,
          blurRadius: 6,
          color: 'rgba(0,0,0,0.06)',
        },
      ],
    },
    modalHeaderContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: screenWidth * GAP_RATIO,
    },
    modalHeaderTitle: {
      color: '#4E6070',
      fontSize: screenHeight * 0.028,
      fontWeight: '700',
    },
    buttonContainer: {
      width: '100%',
      paddingHorizontal: screenWidth * GAP_RATIO,
      paddingBottom: screenWidth * GAP_RATIO,
    },
    text: {
      color: '#4A4A4A',
      fontSize: screenHeight * 0.015,
      fontWeight: 'bold',
    },
  });
};

export default AlertModal;
