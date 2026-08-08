import React, {
  useEffect,
  useLayoutEffect,
  useRef,
  useMemo,
  useContext,
} from 'react';
import {Platform, View} from 'react-native';
import Animated from 'react-native-reanimated';
import {useHeaderHeight} from '@react-navigation/elements';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import LiquidGlassWalletButton from '../components/Buttons/LiquidGlassWalletButton';
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
  // the shop screen owns the shared nav bar past its hand-off point; the
  // fade style rides the shop transition so the two headers crossfade
  shopOwnsHeader: boolean;
  shopHeaderFadeStyle: any;
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
    shopOwnsHeader,
    shopHeaderFadeStyle,
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
      // key: never reconcile in place with the shop's header elements — a
      // swapped-in animated style can hold the old set's opacity for a frame
      <View key="wallet-title" style={alignHeaderElementsWithMarginTop}>
        <Animated.View
          ref={walletButtonRef}
          style={[styles.walletButton, animatedWalletButtonOpacity]}>
          {/* nested, not stacked: two styles writing one opacity fight */}
          <Animated.View style={shopHeaderFadeStyle}>
            <LiquidGlassWalletButton
              title={currentWallet}
              onPress={() => {
                setWalletsModalOpened(!isWalletsModalOpened);
              }}
              disabled={false}
              rotateArrow={rotateArrow}
              arrowSpinAnim={animatedWalletButtonArrowRotation}
            />
          </Animated.View>
        </Animated.View>
      </View>
    ),
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
    [
      animatedWalletButtonOpacity,
      shopHeaderFadeStyle,
      currentWallet,
      isWalletsModalOpened,
      animatedWalletButtonArrowRotation,
      alignHeaderElementsWithMarginTop,
    ],
  );

  const backHeaderButton = useMemo(
    () => (
      <View key="wallet-back" style={alignHeaderElementsWithMarginTop}>
        <Animated.View style={[styles.headerBtns, animatedHeaderButtonOpacity]}>
          <Animated.View style={[styles.headerBtns, shopHeaderFadeStyle]}>
            <HeaderButton
              onPress={() => {
                setBottomSheetFolded(true);
                setActiveTab(0);
              }}
              imageSource={require('../assets/images/back-icon.png')}
              leftPadding
            />
          </Animated.View>
        </Animated.View>
      </View>
    ),
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
    [
      animatedHeaderButtonOpacity,
      shopHeaderFadeStyle,
      alignHeaderElementsWithMarginTop,
      styles.headerBtns,
    ],
  );

  const leftHeaderButton = useMemo(
    () => (
      <View key="wallet-left" style={alignHeaderElementsWithMarginTop}>
        <Animated.View style={[styles.headerBtns, animatedHeaderButtonOpacity]}>
          <Animated.View style={[styles.headerBtns, shopHeaderFadeStyle]}>
            <HeaderButton
              onPress={() => navigation.navigate('SettingsStack')}
              imageSource={require('../assets/icons/settings-cog.png')}
              imageXY={{x: SCREEN_HEIGHT * 0.02, y: SCREEN_HEIGHT * 0.02}}
              leftPadding
            />
            {isFlexaCustomer ? (
              <HeaderButton
                onPress={() => manualPayment()}
                imageSource={require('../assets/images/flexa-logo.png')}
                imageXY={{x: SCREEN_HEIGHT * 0.02, y: SCREEN_HEIGHT * 0.02}}
                leftPadding
                marginLeft={SCREEN_WIDTH * 0.02 * -1}
              />
            ) : null}
          </Animated.View>
        </Animated.View>
      </View>
    ),
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
    [
      animatedHeaderButtonOpacity,
      shopHeaderFadeStyle,
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
      <View key="wallet-right" style={alignHeaderElementsWithMarginTop}>
        <Animated.View style={[styles.headerBtns, animatedHeaderButtonOpacity]}>
          <Animated.View style={[styles.headerBtns, shopHeaderFadeStyle]}>
            <HeaderButton
              onPress={() => navigation.navigate('AlertsStack')}
              imageSource={require('../assets/icons/alerts-icon.png')}
              imageXY={{x: SCREEN_HEIGHT * 0.028, y: SCREEN_HEIGHT * 0.028}}
              rightPadding
            />
          </Animated.View>
        </Animated.View>
      </View>
    ),
    [
      animatedHeaderButtonOpacity,
      shopHeaderFadeStyle,
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
    // while the shop is presented it applies its own header to this route;
    // the moment its close starts this re-runs and reclaims the bar
    if (shopOwnsHeader) return;

    if (isWalletsModalOpened || isTxDetailModalOpened) {
      fadingTimeout.current = setTimeout(() => {
        parentNavigation.setOptions({
          headerLeft: () => emptyFragment,
          headerRight: () => emptyFragment,
        });
      }, 150);
    } else {
      parentNavigation.setOptions({
        ...noHeaderContainerMargin,
        headerLeft: () =>
          activeTab !== 0 ? backHeaderButton : leftHeaderButton,
        headerRight: () => rightHeaderButton,
      });
    }

    if (isTxDetailModalOpened) {
      walletButtonFadingTimeout.current = setTimeout(() => {
        parentNavigation.setOptions({
          headerTitle: () => emptyFragment,
        });
      }, 150);
    } else {
      parentNavigation.setOptions({
        headerTitle: () => walletButton,
        headerTitleAlign: 'center',
        headerTitleContainerStyle: {left: 0},
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
    shopOwnsHeader,
    noHeaderContainerMargin,
  ]);

  // NOTE: fixes header disappearing when navigating back from screens with headerTransparent: true
  // like ConfirmBuy, ConfirmSell, WebPage, etc. Listens on the Main ROUTE's
  // focus, not this screen's: the shop presenting/closing inside the Main
  // stack must not blink the header.
  useEffect(() => {
    const parentNavigation = navigation.getParent();
    if (!parentNavigation) return;

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = parentNavigation.addListener('focus', () => {
      // Small delay to ensure the screen is fully focused before applying header fix
      timeoutId = setTimeout(() => {
        parentNavigation.setOptions({
          headerShown: false,
        });

        setTimeout(() => {
          parentNavigation.setOptions({
            headerShown: true,
          });
        }, 10);
      }, 50);
    });

    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
    };
  }, [navigation]);
}
