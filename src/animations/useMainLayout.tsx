import React, {
  useEffect,
  useLayoutEffect,
  useRef,
  useMemo,
  useContext,
} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {View} from 'react-native';
import Animated from 'react-native-reanimated';
import {useHeaderHeight} from '@react-navigation/elements';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import ChooseWalletButton from '../components/Buttons/ChooseWalletButton';
import HeaderButton from '../components/Buttons/HeaderButton';

import {ScreenSizeContext} from '../context/screenSize';

interface Props {
  walletButtonAnimDuration: any;
  rotateArrow: any;
  animatedHeaderButtonOpacity: any;
  animatedWalletButtonOpacity: any;
  animatedWalletButtonArrowRotation: any;
  currentWallet: string;
  activeTab: number;
  navigation: any;
  isWalletsModalOpened: boolean;
  setWalletsModalOpened: (isOpened: boolean) => void;
  isTxDetailModalOpened: boolean;
  setPlasmaModalGapInPixels: (gapInPixels: number) => void;
  setBottomSheetFolded: (isFolded: boolean) => void;
  setActiveTab: (tabNum: number) => void;
  manualPayment: () => void;
  isFlexaCustomer: boolean;
  styles: {
    [key: string]: any;
  };
}

export function useMainLayout(props: Props) {
  const {
    walletButtonAnimDuration,
    rotateArrow,
    animatedHeaderButtonOpacity,
    animatedWalletButtonOpacity,
    animatedWalletButtonArrowRotation,
    currentWallet,
    activeTab,
    navigation,
    isWalletsModalOpened,
    setWalletsModalOpened,
    isTxDetailModalOpened,
    setPlasmaModalGapInPixels,
    setBottomSheetFolded,
    setActiveTab,
    manualPayment,
    isFlexaCustomer,
    styles,
  } = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);

  // header align
  const headerButtonsHeight = SCREEN_HEIGHT * 0.035;
  const deviceHeaderHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const stackHeaderHeight = deviceHeaderHeight - insets.top;
  const alignHeaderElementsWithMarginTop = useMemo(() => {
    return {marginTop: (stackHeaderHeight - headerButtonsHeight) * -1};
  }, [stackHeaderHeight, headerButtonsHeight]);

  const walletButtonRef = useRef<View>(null);
  useLayoutEffect(() => {
    walletButtonRef.current?.measure(
      (_: any, __: any, ___: any, height: any, ____: any, pageY: any) => {
        setPlasmaModalGapInPixels(height + pageY);
      },
    );
  });

  const walletButton = useMemo(
    () => (
      <View style={alignHeaderElementsWithMarginTop}>
        <Animated.View
          ref={walletButtonRef}
          style={[styles.walletButton, animatedWalletButtonOpacity]}>
          <ChooseWalletButton
            title={currentWallet}
            onPress={() => {
              setWalletsModalOpened(!isWalletsModalOpened);
            }}
            disabled={false}
            isModalOpened={isWalletsModalOpened}
            isFromBottomToTop={false}
            animDuration={walletButtonAnimDuration}
            rotateArrow={rotateArrow}
            arrowSpinAnim={animatedWalletButtonArrowRotation}
          />
        </Animated.View>
      </View>
    ),
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
    [
      animatedWalletButtonOpacity,
      currentWallet,
      isWalletsModalOpened,
      animatedWalletButtonArrowRotation,
      alignHeaderElementsWithMarginTop,
    ],
  );

  const backHeaderButton = useMemo(
    () => (
      <View style={alignHeaderElementsWithMarginTop}>
        <Animated.View style={[styles.headerBtns, animatedHeaderButtonOpacity]}>
          <HeaderButton
            onPress={() => {
              setBottomSheetFolded(true);
              setActiveTab(0);
            }}
            imageSource={require('../assets/images/back-icon.png')}
          />
        </Animated.View>
      </View>
    ),
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
    [
      animatedHeaderButtonOpacity,
      alignHeaderElementsWithMarginTop,
      styles.headerBtns,
    ],
  );

  const leftHeaderButton = useMemo(
    () => (
      <View style={alignHeaderElementsWithMarginTop}>
        <Animated.View style={[styles.headerBtns, animatedHeaderButtonOpacity]}>
          <HeaderButton
            onPress={() => navigation.navigate('SettingsStack')}
            imageSource={require('../assets/icons/settings-cog.png')}
            imageXY={{x: SCREEN_HEIGHT * 0.02, y: SCREEN_HEIGHT * 0.02}}
          />
          {isFlexaCustomer ? (
            <HeaderButton
              onPress={() => manualPayment()}
              imageSource={require('../assets/icons/shop.png')}
              marginLeft={SCREEN_WIDTH * 0.02 * -1}
            />
          ) : null}
        </Animated.View>
      </View>
    ),
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
    [
      animatedHeaderButtonOpacity,
      navigation,
      isFlexaCustomer,
      SCREEN_HEIGHT,
      SCREEN_WIDTH,
      alignHeaderElementsWithMarginTop,
      styles.headerBtns,
    ],
  );

  const rightHeaderButton = useMemo(
    () => (
      <View style={alignHeaderElementsWithMarginTop}>
        <Animated.View style={[styles.headerBtns, animatedHeaderButtonOpacity]}>
          <HeaderButton
            onPress={() => navigation.navigate('AlertsStack')}
            imageSource={require('../assets/icons/alerts-icon.png')}
            rightPadding={true}
            imageXY={{x: SCREEN_HEIGHT * 0.028, y: SCREEN_HEIGHT * 0.028}}
          />
        </Animated.View>
      </View>
    ),
    [
      animatedHeaderButtonOpacity,
      navigation,
      alignHeaderElementsWithMarginTop,
      SCREEN_HEIGHT,
      styles.headerBtns,
    ],
  );

  const emptyFragment = useMemo(() => <></>, []);

  const fadingTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
  const walletButtonFadingTimeout = useRef<NodeJS.Timeout | undefined>(
    undefined,
  );

  useEffect(() => {
    if (isWalletsModalOpened || isTxDetailModalOpened) {
      fadingTimeout.current = setTimeout(() => {
        navigation.setOptions({
          headerLeft: () => emptyFragment,
          headerRight: () => emptyFragment,
        });
      }, 150);
    } else {
      navigation.setOptions({
        headerLeft: () =>
          activeTab !== 0 ? backHeaderButton : leftHeaderButton,
        headerRight: () => rightHeaderButton,
      });
    }

    if (isTxDetailModalOpened) {
      walletButtonFadingTimeout.current = setTimeout(() => {
        navigation.setOptions({
          headerTitle: () => emptyFragment,
        });
      }, 150);
    } else {
      navigation.setOptions({
        headerTitle: () => walletButton,
      });
    }

    return () => {
      clearTimeout(fadingTimeout.current);
      clearTimeout(walletButtonFadingTimeout.current);
    };
  }, [
    activeTab,
    backHeaderButton,
    leftHeaderButton,
    rightHeaderButton,
    walletButton,
    emptyFragment,
    navigation,
    isWalletsModalOpened,
    isTxDetailModalOpened,
  ]);

  // fixes header disappearing when navigating back from screens with headerTransparent: true
  // like ConfirmBuy, ConfirmSell, WebPage, etc.
  useFocusEffect(
    React.useCallback(() => {
      // Small delay to ensure the screen is fully focused before applying header fix
      const timeoutId = setTimeout(() => {
        navigation.setOptions({
          headerShown: false,
        });

        setTimeout(() => {
          navigation.setOptions({
            headerShown: true,
          });
        }, 10);
      }, 50);

      return () => clearTimeout(timeoutId);
    }, [navigation]),
  );
}
