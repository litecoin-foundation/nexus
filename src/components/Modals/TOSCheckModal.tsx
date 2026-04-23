import React, {
  useEffect,
  useContext,
  useMemo,
  useState,
  useCallback,
} from 'react';
import {View, Pressable, StyleSheet} from 'react-native';
import Animated from 'react-native-reanimated';
import {useNavigation, useIsFocused} from '@react-navigation/native';

import PlasmaModal from './PlasmaModal';
import BlueButton from '../Buttons/BlueButton';
import AnimatedCheckbox from '../AnimatedCheckbox';

import TranslateText from '../TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';
import {PopUpContext} from '../../context/popUpContext';

const TOS_URL = 'https://nexuswallet.com/gc/tos';

interface Props {
  isVisible: boolean;
  close: () => void;
  onContinue: () => void;
}

const TOSCheckModal: React.FC<Props> = ({isVisible, close, onContinue}) => {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = useMemo(
    () => getStyles(SCREEN_WIDTH, SCREEN_HEIGHT),
    [SCREEN_WIDTH, SCREEN_HEIGHT],
  );

  const [agreed, setAgreed] = useState(false);

  const {showPopUp} = useContext(PopUpContext);

  const showModal = isVisible && isFocused;

  const handleContinue = useCallback(() => {
    if (!agreed) return;
    setAgreed(false);
    onContinue();
  }, [agreed, onContinue]);

  const handleClose = useCallback(() => {
    setAgreed(false);
    close();
  }, [close]);

  const modal = useMemo(
    () => (
      <PlasmaModal
        isOpened={showModal}
        close={handleClose}
        isFromBottomToTop={true}
        animDuration={250}
        gapInPixels={0}
        backSpecifiedStyle={styles.semiBlackBackground}
        renderBody={(_, __, ___, ____, cardTranslateAnim) => (
          <Animated.View style={[styles.modal, cardTranslateAnim]}>
            <View style={styles.titleContainer}>
              <TranslateText
                textKey="terms_and_conditions"
                domain="nexusShop"
                maxSizeInPixels={SCREEN_HEIGHT * 0.022}
                textStyle={styles.title}
                numberOfLines={1}
              />
            </View>

            <Pressable
              style={styles.checkboxRow}
              onPress={() => setAgreed(prev => !prev)}>
              <AnimatedCheckbox checked={agreed} size={SCREEN_HEIGHT * 0.028} />
              <View style={styles.checkboxTextContainer}>
                <TranslateText
                  textKey="agree_to_tos"
                  domain="nexusShop"
                  maxSizeInPixels={SCREEN_HEIGHT * 0.018}
                  textStyle={styles.checkboxText}
                  numberOfLines={2}
                />
                <Pressable
                  onPress={() =>
                    navigation.navigate('WebPage', {uri: TOS_URL})
                  }>
                  <TranslateText
                    textKey="terms_and_conditions"
                    domain="nexusShop"
                    maxSizeInPixels={SCREEN_HEIGHT * 0.018}
                    textStyle={styles.link}
                    numberOfLines={1}
                  />
                </Pressable>
              </View>
            </Pressable>

            <View style={styles.button}>
              <BlueButton
                textKey="continue"
                textDomain="nexusShop"
                onPress={handleContinue}
                disabled={!agreed}
                rounded
              />
            </View>
          </Animated.View>
        )}
      />
    ),
    [
      showModal,
      handleClose,
      handleContinue,
      agreed,
      SCREEN_HEIGHT,
      styles,
      navigation,
    ],
  );

  useEffect(() => {
    showPopUp(modal, 'tos-check-modal');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal, agreed]);

  return <></>;
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    modal: {
      position: 'absolute',
      bottom: screenWidth * 0.05,
      left: screenWidth * 0.05,
      backgroundColor: '#fff',
      width: screenWidth * 0.9,
      borderRadius: 40,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.07,
      shadowRadius: 3,
      padding: 20,
    },
    titleContainer: {
      marginBottom: screenHeight * 0.02,
      paddingLeft: 5,
    },
    title: {
      color: '#000',
      fontSize: screenHeight * 0.022,
      fontWeight: 'bold',
      letterSpacing: -0.18,
    },
    checkboxRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 5,
      marginBottom: screenHeight * 0.05,
    },
    checkboxTextContainer: {
      flex: 1,
      marginLeft: screenWidth * 0.03,
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 4,
    },
    checkboxText: {
      color: '#000',
      fontSize: screenHeight * 0.018,
      letterSpacing: -0.18,
    },
    link: {
      color: '#0070F0',
      fontSize: screenHeight * 0.018,
      letterSpacing: -0.18,
      textDecorationLine: 'underline',
    },
    button: {
      width: '100%',
    },
    semiBlackBackground: {
      backgroundColor: 'rgba(100, 100, 100, 0.5)',
    },
  });

export default TOSCheckModal;
