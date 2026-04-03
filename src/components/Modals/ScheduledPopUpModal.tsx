import React, {
  useEffect,
  useContext,
  useMemo,
  useState,
  useCallback,
} from 'react';
import {View, StyleSheet} from 'react-native';
import Animated from 'react-native-reanimated';

import PlasmaModal from './PlasmaModal';
import BlueButton from '../Buttons/BlueButton';
import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';
import {PopUpContext} from '../../context/popUpContext';
import {useAppDispatch} from '../../store/hooks';
import {firePopup, IPopup, PopupActionType} from '../../reducers/popupschedule';
import {updateAmount} from '../../reducers/input';
import {navigate} from '../../navigation/NavigationService';

interface Props {
  blocked: boolean;
  onGoToScreen?: (
    routeParams: {[key: string]: any},
    meta: {stack: string; screen: string},
  ) => boolean;
}

const ScheduledPopUpModal: React.FC<Props> = ({blocked, onGoToScreen}) => {
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = useMemo(
    () => getStyles(SCREEN_WIDTH, SCREEN_HEIGHT),
    [SCREEN_WIDTH, SCREEN_HEIGHT],
  );

  const {showPopUp} = useContext(PopUpContext);
  const dispatch = useAppDispatch();

  const [isVisible, setIsVisible] = useState(false);
  const [activePopup, setActivePopup] = useState<IPopup | null>(null);

  useEffect(() => {
    if (blocked) {
      return;
    }
    const popup = dispatch(firePopup());
    if (popup) {
      setActivePopup(popup);
      const timeout = setTimeout(() => setIsVisible(true), 3000);
      return () => clearTimeout(timeout);
    }
  }, [dispatch, blocked]);

  const close = useCallback(() => {
    setIsVisible(false);
    setActivePopup(null);
  }, []);

  const handleAction = useCallback(() => {
    if (!activePopup) {
      close();
      return;
    }

    switch (activePopup.actionType) {
      case PopupActionType.CloseModal:
        close();
        break;
      case PopupActionType.GoToScreen:
        close();
        if (activePopup.actionMeta.routeParams?.buyAmountLtc) {
          dispatch(
            updateAmount(
              activePopup.actionMeta.routeParams.buyAmountLtc,
              'buy',
            ),
          );
        }
        {
          const handled = onGoToScreen?.(
            activePopup.actionMeta.routeParams || {},
            {
              stack: activePopup.actionMeta.stack,
              screen: activePopup.actionMeta.screen,
            },
          );
          if (!handled) {
            navigate(activePopup.actionMeta.stack as any, {
              screen: activePopup.actionMeta.screen,
              params: activePopup.actionMeta.routeParams,
            });
          }
        }
        break;
      case PopupActionType.OpenWebview:
        close();
        navigate('WebPage' as any, {
          uri: activePopup.actionMeta.webUrl,
        });
        break;
    }
  }, [activePopup, close, dispatch, onGoToScreen]);

  const modal = useMemo(
    () => (
      <PlasmaModal
        isOpened={isVisible}
        close={close}
        isFromBottomToTop={true}
        animDuration={250}
        gapInPixels={0}
        backSpecifiedStyle={styles.semiBlackBackground}
        renderBody={(_, __, ___, ____, cardTranslateAnim) => (
          <Animated.View style={[styles.modal, cardTranslateAnim]}>
            <View style={styles.titleContainer}>
              {activePopup?.title ? (
                <TranslateText
                  textValue={activePopup.title}
                  maxSizeInPixels={SCREEN_HEIGHT * 0.022}
                  textStyle={styles.title}
                  numberOfLines={1}
                />
              ) : (
                <></>
              )}
            </View>
            <View style={styles.textContainer}>
              {activePopup?.text ? (
                <TranslateText
                  textValue={activePopup.text}
                  maxSizeInPixels={SCREEN_HEIGHT * 0.022}
                  textStyle={styles.text}
                  numberOfLines={3}
                />
              ) : (
                <></>
              )}
            </View>
            <View style={styles.button}>
              <BlueButton
                value={activePopup?.onAction || 'OK'}
                onPress={handleAction}
                rounded
              />
            </View>
          </Animated.View>
        )}
      />
    ),
    [isVisible, close, activePopup, handleAction, SCREEN_HEIGHT, styles],
  );

  useEffect(() => {
    showPopUp(modal, 'scheduled-pop-up-modal');
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
      height: screenHeight * 0.35,
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
      flex: 1,
      paddingLeft: 5,
    },
    textContainer: {
      flex: 2,
      paddingLeft: 5,
    },
    title: {
      color: '#000',
      fontSize: screenHeight * 0.022,
      fontWeight: 'bold',
      letterSpacing: -0.18,
    },
    text: {
      color: '#000',
      fontSize: screenHeight * 0.022,
      letterSpacing: -0.18,
    },
    button: {
      width: '100%',
    },
    semiBlackBackground: {
      backgroundColor: 'rgba(100, 100, 100, 0.5)',
    },
  });

export default ScheduledPopUpModal;
