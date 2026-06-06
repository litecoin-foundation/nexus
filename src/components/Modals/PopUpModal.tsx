import React, {useEffect, useContext, useMemo} from 'react';
import {View, StyleSheet} from 'react-native';
import Animated from 'react-native-reanimated';
import {useNavigation} from '@react-navigation/native';

import PlasmaModal from './PlasmaModal';
import BlueButton from '../Buttons/BlueButton';
import BlueRoundButton from '../Buttons/BlueRoundButton';
import SecondaryRoundButton from '../Buttons/SecondaryRoundButton';

import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';
import {PopUpContext} from '../../context/popUpContext';

interface Props {
  isVisible: boolean;
  close: () => void;
  title?: string;
  titleKey?: string;
  titleDomain?: string;
  text?: string;
  textKey?: string;
  textDomain?: string;
  subText?: string;
  subTextKey?: string;
  subTextDomain?: string;
  disableBlur?: boolean;
  buttonUrl?: string;
}

const PopUpModal: React.FC<Props> = props => {
  const {
    isVisible,
    close,
    title,
    titleKey,
    titleDomain,
    text,
    textKey,
    textDomain,
    subText,
    subTextKey,
    subTextDomain,
    disableBlur,
    buttonUrl,
  } = props;

  const navigation = useNavigation<any>();

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
        backSpecifiedStyle={styles.semiBlackBackground}
        disableBlur={disableBlur}
        renderBody={(_, __, ___, ____, cardTranslateAnim) => (
          <Animated.View style={[styles.modal, cardTranslateAnim]}>
            <View style={styles.titleContainer}>
              {title ? (
                <TranslateText
                  textValue={title}
                  maxSizeInPixels={SCREEN_HEIGHT * 0.022}
                  textStyle={styles.title}
                  numberOfLines={2}
                />
              ) : titleKey && titleDomain ? (
                <TranslateText
                  textKey={titleKey}
                  domain={titleDomain}
                  maxSizeInPixels={SCREEN_HEIGHT * 0.022}
                  textStyle={styles.title}
                  numberOfLines={2}
                />
              ) : (
                <></>
              )}
            </View>
            <View style={styles.textContainer}>
              {text ? (
                <TranslateText
                  textValue={text}
                  maxSizeInPixels={SCREEN_HEIGHT * 0.022}
                  textStyle={styles.text}
                  numberOfLines={4}
                />
              ) : textKey && textDomain ? (
                <TranslateText
                  textKey={textKey}
                  domain={textDomain}
                  maxSizeInPixels={SCREEN_HEIGHT * 0.022}
                  textStyle={styles.text}
                  numberOfLines={4}
                />
              ) : (
                <></>
              )}
            </View>
            {subText || (subTextKey && subTextDomain) ? (
              <View style={styles.subTextContainer}>
                {subText ? (
                  <TranslateText
                    textValue={subText}
                    maxSizeInPixels={SCREEN_HEIGHT * 0.018}
                    textStyle={styles.subText}
                    numberOfLines={8}
                  />
                ) : subTextKey && subTextDomain ? (
                  <TranslateText
                    textKey={subTextKey}
                    domain={subTextDomain}
                    maxSizeInPixels={SCREEN_HEIGHT * 0.018}
                    textStyle={styles.subText}
                    numberOfLines={8}
                  />
                ) : (
                  <></>
                )}
              </View>
            ) : (
              <></>
            )}
            {buttonUrl ? (
              <View style={styles.buttonGroup}>
                <View style={styles.secondaryButtonWrapper}>
                  <SecondaryRoundButton
                    textKey="got_it"
                    textDomain="main"
                    onPress={close}
                  />
                </View>
                <View style={styles.blueButtonWrapper}>
                  <BlueRoundButton
                    textKey="open"
                    textDomain="main"
                    onPress={() => {
                      close();
                      navigation.navigate('WebPage', {uri: buttonUrl});
                    }}
                  />
                </View>
              </View>
            ) : (
              <View style={styles.button}>
                <BlueButton
                  textKey="got_it"
                  textDomain="main"
                  onPress={close}
                  rounded
                />
              </View>
            )}
          </Animated.View>
        )}
      />
    ),
    [
      isVisible,
      close,
      title,
      titleKey,
      titleDomain,
      text,
      textKey,
      textDomain,
      subText,
      subTextKey,
      subTextDomain,
      disableBlur,
      buttonUrl,
      navigation,
      SCREEN_HEIGHT,
      styles,
    ],
  );

  useEffect(() => {
    showPopUp(modal, 'pop-up-modal');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]);

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
      height: 'auto',
      borderTopLeftRadius: 40,
      borderTopRightRadius: 40,
      borderBottomLeftRadius: 40,
      borderBottomRightRadius: 40,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.07,
      shadowRadius: 3,
      padding: 20,
    },
    titleContainer: {
      flex: 1.25,
      paddingLeft: 5,
    },
    textContainer: {
      flex: 2,
      paddingLeft: 5,
    },
    subTextContainer: {
      flex: 3,
      paddingLeft: 5,
    },
    title: {
      color: '#000',
      fontSize: screenHeight * 0.022,
      fontWeight: 'bold',
      letterSpacing: -0.18,
      paddingBottom: 20,
    },
    text: {
      color: '#000',
      fontSize: screenHeight * 0.022,
      letterSpacing: -0.18,
      paddingBottom: 20,
    },
    subText: {
      color: '#000',
      fontSize: screenHeight * 0.018,
      letterSpacing: -0.18,
      paddingBottom: 20,
    },
    button: {
      width: screenWidth * 0.4,
      alignSelf: 'flex-end',
    },
    buttonGroup: {
      width: '100%',
      flexDirection: 'row',
      gap: screenWidth * 0.03,
    },
    secondaryButtonWrapper: {
      flex: 2,
    },
    blueButtonWrapper: {
      flex: 3,
    },
    transparentBackground: {
      backgroundColor: 'transparent',
    },
    semiBlackBackground: {
      backgroundColor: 'rgba(100, 100, 100, 0.5)',
    },
  });

export default PopUpModal;
