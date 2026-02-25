import React, {
  useEffect,
  useLayoutEffect,
  useRef,
  useMemo,
  useContext,
} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {Platform, View} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import {useHeaderHeight} from '@react-navigation/elements';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import ChooseWalletButton from '../components/Buttons/ChooseWalletButton';
import HeaderButton from '../components/Buttons/HeaderButton';

import {ScreenSizeContext} from '../context/screenSize';
import {useAppSelector} from '../store/hooks';

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
  isShopAccountDrawerOpen: boolean;
  toggleShopAccountDrawer: () => void;
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
    isShopAccountDrawerOpen,
    toggleShopAccountDrawer,
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

  // Read country picker state from Redux
  const isCountryPickerOpen = useAppSelector(
    (state: any) => state.nexusshopaccount.isCountryPickerOpen,
  );

  // Animated opacity for drawer toggle button
  const drawerToggleOpacity = useSharedValue(1);

  // Animate drawer toggle button visibility based on country picker state
  useEffect(() => {
    if (isCountryPickerOpen) {
      drawerToggleOpacity.value = withTiming(0, {
        duration: 250,
      });
    } else {
      drawerToggleOpacity.value = withTiming(1, {
        duration: 250,
      });
    }
  }, [isCountryPickerOpen]);

  // Animated style for drawer toggle button
  const animatedDrawerToggleStyle = useAnimatedStyle(() => {
    return {
      opacity: drawerToggleOpacity.value,
    };
  });

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
            leftPadding
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
            leftPadding
          />
          {isFlexaCustomer ? (
            <HeaderButton
              onPress={() => manualPayment()}
              imageSource={require('../assets/icons/shop.png')}
              leftPadding
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
            imageXY={{x: SCREEN_HEIGHT * 0.028, y: SCREEN_HEIGHT * 0.028}}
            rightPadding
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

  const nexusShopAccountButton = useMemo(
    () => (
      <View style={alignHeaderElementsWithMarginTop}>
        <Animated.View
          style={[
            styles.headerBtns,
            animatedHeaderButtonOpacity,
            animatedDrawerToggleStyle,
          ]}>
          <HeaderButton
            onPress={toggleShopAccountDrawer}
            imageSource={require('../assets/icons/user.png')}
            imageXY={{x: SCREEN_HEIGHT * 0.02, y: SCREEN_HEIGHT * 0.02}}
            rightPadding
            backgroundColorSpecified={
              isShopAccountDrawerOpen ? '#0070F0' : undefined
            }
          />
        </Animated.View>
      </View>
    ),
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
    [
      isShopAccountDrawerOpen,
      toggleShopAccountDrawer,
      animatedHeaderButtonOpacity,
      animatedDrawerToggleStyle,
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

  // NOTE: React Navigation applies marginHorizontal: 5 to the header content
  // on iOS screens wider than 414px (IPAD_MINI_MEDIUM_WIDTH). Cancel it out.
  const noHeaderContainerMargin = useMemo(
    () =>
      Platform.OS === 'ios' && SCREEN_WIDTH >= 414
        ? {
            headerLeftContainerStyle: {marginStart: -5},
            headerRightContainerStyle: {marginEnd: -5},
          }
        : {},
    [SCREEN_WIDTH],
  );

  useEffect(() => {
    const parentNavigation = navigation.getParent();
    if (!parentNavigation) return;

    if (isWalletsModalOpened || isTxDetailModalOpened) {
      fadingTimeout.current = setTimeout(() => {
        parentNavigation.setOptions({
          headerLeft: () => emptyFragment,
          headerRight: () => emptyFragment,
        });
      }, 150);
    } else if (activeTab === 3) {
      parentNavigation.setOptions({
        ...noHeaderContainerMargin,
        headerLeft: () =>
          isShopAccountDrawerOpen ? emptyFragment : backHeaderButton,
        headerRight: () => nexusShopAccountButton,
      });
    } else {
      parentNavigation.setOptions({
        ...noHeaderContainerMargin,
        headerLeft: () =>
          activeTab !== 0 ? backHeaderButton : leftHeaderButton,
        headerRight: () => rightHeaderButton,
      });
    }

    if (isTxDetailModalOpened || activeTab === 3) {
      walletButtonFadingTimeout.current = setTimeout(() => {
        parentNavigation.setOptions({
          headerTitle: () => emptyFragment,
        });
      }, 150);
    } else {
      parentNavigation.setOptions({
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
    nexusShopAccountButton,
    walletButton,
    emptyFragment,
    navigation,
    isWalletsModalOpened,
    isTxDetailModalOpened,
    isShopAccountDrawerOpen,
    noHeaderContainerMargin,
  ]);

  // NOTE: fixes header disappearing when navigating back from screens with headerTransparent: true
  // like ConfirmBuy, ConfirmSell, WebPage, etc.
  useFocusEffect(
    React.useCallback(() => {
      const parentNavigation = navigation.getParent();
      if (!parentNavigation) return;

      // Small delay to ensure the screen is fully focused before applying header fix
      const timeoutId = setTimeout(() => {
        parentNavigation.setOptions({
          headerShown: false,
        });

        setTimeout(() => {
          parentNavigation.setOptions({
            headerShown: true,
          });
        }, 10);
      }, 50);

      return () => clearTimeout(timeoutId);
    }, [navigation]),
  );
}
