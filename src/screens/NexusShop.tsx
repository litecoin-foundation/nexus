import React, {
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  BackHandler,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {useHeaderHeight} from '@react-navigation/elements';
import {useDrawerStatus} from '@react-navigation/drawer';
import {useFocusEffect} from '@react-navigation/native';
import {RouteProp} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {useTranslation} from 'react-i18next';

import GlassShopList from '../components/GlassShopList';
import CategoryPickerModal from '../components/Modals/CategoryPickerModal';
import HeaderButton from '../components/Buttons/HeaderButton';
import TranslateText from '../components/TranslateText';
import {
  useGlassChromeFeeds,
  useGlassShopFeedPublisher,
  GlassShopFeed,
} from '../components/glassChromeFeeds';
import {
  SKIN_GRADIENT_COLORS,
  SKIN_GRADIENT_LOCATIONS,
} from '../components/FoldedSkinView';
import {SHEET_BACKGROUND} from '../components/GlassTxRows';
import {
  getShopHeaderHeight,
  getShopListTop,
  ShopSection,
  SHOP_HEADER_GAP_RATIO,
  SHOP_HEADER_SEARCH_HEIGHT_RATIO,
  SHOP_HEADER_SEGMENTS_HEIGHT_RATIO,
  SHOP_HEADER_SEGMENTS_TOP_RATIO,
} from '../components/GiftCardShop/GlassShopRows';
import {useShopScreenState} from '../components/GiftCardShop/useShopScreenState';
import {
  CARD_FOLD_RADIUS_RATIO,
  getFoldedTopHalfHeight,
  getNewMainSheetPoints,
  getNewMainTopHalfHeight,
} from '../animations/useNewMainAnims';
import type {ShopDrawerParamList} from '../navigation/types';
import {ScreenSizeContext} from '../context/screenSize';
import {useAppSelector} from '../store/hooks';

// The Nexus Shop screen: a transparent-modal route in the Main stack, so
// the live wallet stays attached and visible beneath while one transition
// value drives the whole hand-off. The glass tab bar and its canvas are
// shared chrome above the navigator; this screen publishes its rows and
// animation state through glassChromeFeeds so the persistent bar refracts
// them. The account drawer wraps just this screen. Entry: the bar's shop
// slot or navigate('NexusShop', {screen: 'NexusShopScreen', params?}).
//
// The gradient card crowns the screen — content-fit, rounded bottom corners
// like the folded wallet — over the light list the glass canvas draws. One
// transition drives the whole arrival: the surface fades over the wallet
// (its gradient matches the folded-skin derivation, so the cover is
// seamless), then the card morphs from the wallet top-half's height down to
// the header while the pills and search settle in.

const SEGMENT_SPRING = {mass: 0.4, damping: 16, stiffness: 200};
const SEARCH_DEBOUNCE_MS = 180;
// iOS-style back swipe: starts at the left edge, scrubs the transition
const BACK_EDGE_WIDTH = 32;
const BACK_COMMIT_BELOW = 0.65;
const BACK_COMMIT_VELOCITY = 500;

const SECTIONS: {key: ShopSection; textKey: string}[] = [
  {key: 'browse', textKey: 'shop'},
  {key: 'my-cards', textKey: 'my_cards'},
  {key: 'wishlist', textKey: 'wishlist'},
];

interface Props {
  navigation: any;
  route: RouteProp<ShopDrawerParamList, 'NexusShopScreen'>;
}

const NexusShop: React.FC<Props> = props => {
  const {navigation, route} = props;

  const insets = useSafeAreaInsets();
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const {t} = useTranslation('nexusShop');
  const {wallet} = useGlassChromeFeeds();
  const drawerStatus = useDrawerStatus();
  const drawerOpen = drawerStatus === 'open';

  // 0 wallet, 1 shop: one value choreographs the surface, the header morph
  // and the canvas rows; the wallet top-half height is what the card grows
  // out of and folds back into
  const scrollY = useSharedValue(0);
  const transition = useSharedValue(0);
  const morphFrom = useSharedValue(
    getFoldedTopHalfHeight(SCREEN_HEIGHT, insets.top),
  );
  const [presented, setPresented] = useState(false);
  const [canvasActive, setCanvasActive] = useState(false);
  // nav-bar ownership follows the transition itself (not presented), so the
  // header crossfade tracks the morph — and the back-swipe scrub — exactly
  const [ownsHeader, setOwnsHeader] = useState(false);
  useAnimatedReaction(
    () => transition.value >= 0.4,
    (owns, prev) => {
      if (owns !== prev) {
        runOnJS(setOwnsHeader)(owns);
      }
    },
    [transition],
  );
  const closingRef = useRef(false);

  const state = useShopScreenState({
    navigation,
    active: presented,
    requestedSection: route.params?.section,
    shopScrollY: scrollY,
  });

  // read the wallet feed through a ref: republished feeds must not remake
  // this callback, or the focus effect re-runs mid-close and cancels it
  const walletRef = useRef(wallet);
  walletRef.current = wallet;
  const seedMorphFrom = useCallback(() => {
    const {UNFOLD_SHEET_POINT, FOLD_SHEET_POINT} = getNewMainSheetPoints(
      SCREEN_HEIGHT,
      insets.top,
    );
    morphFrom.value = walletRef.current
      ? getNewMainTopHalfHeight(
          walletRef.current.mainSheetsTranslationY.value,
          SCREEN_HEIGHT,
          UNFOLD_SHEET_POINT,
          FOLD_SHEET_POINT,
        )
      : getFoldedTopHalfHeight(SCREEN_HEIGHT, insets.top);
  }, [morphFrom, SCREEN_HEIGHT, insets.top]);

  // close plays the choreography backwards, then pops the drawer route.
  // Two-phase teardown: publish canvasActive=false FIRST so the chrome
  // unmounts the shop canvas layer in a quiet commit (all shared-value
  // identities stable, everything at opacity 0), and pop a frame later —
  // the pop's feed-null commit then has nothing left to tear down.
  const closeRafRef = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (closeRafRef.current != null) {
        cancelAnimationFrame(closeRafRef.current);
      }
    },
    [],
  );
  const finishClose = useCallback(() => {
    setCanvasActive(false);
    scrollY.value = 0;
    closeRafRef.current = requestAnimationFrame(() => {
      closeRafRef.current = null;
      navigation.goBack();
    });
  }, [navigation, scrollY]);
  const closeShop = useCallback(() => {
    if (closingRef.current) {
      return;
    }
    closingRef.current = true;
    if (drawerOpen) {
      navigation.closeDrawer();
    }
    setPresented(false);
    seedMorphFrom();
    transition.value = withTiming(
      0,
      {duration: 300, easing: Easing.bezier(0.4, 0, 0.6, 1)},
      finished => {
        if (finished) {
          runOnJS(finishClose)();
        }
      },
    );
  }, [drawerOpen, navigation, seedMorphFrom, transition, finishClose]);

  // arrive on focus: seed the morph origin from the live wallet and play
  // the hand-off. No blur cleanup — a pushed gift-card screen keeps the shop
  // mounted beneath it, and the close path pops this route itself. Re-focus
  // re-runs this with every write already at its target, so nothing moves.
  useFocusEffect(
    useCallback(() => {
      closingRef.current = false;
      seedMorphFrom();
      setPresented(true);
      setCanvasActive(true);
      transition.value = withTiming(1, {
        duration: 380,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
      });
    }, [seedMorphFrom, transition]),
  );

  // the android back button leaves the shop like the edge swipe does
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          closeShop();
          return true;
        },
      );
      return () => subscription.remove();
    }, [closeShop]),
  );

  const visible = presented;
  const onBack = closeShop;
  const onScrollActivity = wallet?.onContentActivity;

  const headerHeight = getShopHeaderHeight(SCREEN_HEIGHT, insets.top);
  const listTop = getShopListTop(SCREEN_HEIGHT, insets.top);
  const styles = useMemo(
    () =>
      getStyles(SCREEN_WIDTH, SCREEN_HEIGHT, insets.top, headerHeight, listTop),
    [SCREEN_WIDTH, SCREEN_HEIGHT, insets.top, headerHeight, listTop],
  );

  const sections = useMemo(
    () => (state.loggedIn ? SECTIONS : SECTIONS.slice(0, 2)),
    [state.loggedIn],
  );
  const activeSection = Math.max(
    sections.findIndex(section => section.key === state.section),
    0,
  );

  // choreography off the single transition: cover the wallet first, morph
  // the card throughout, settle the header content on top of it
  // fully opaque by the time the container boundary starts travelling
  const fadeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      transition.value,
      [0, 0.35],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));
  // the card's bottom edge is the container boundary. It stays pinned at
  // the wallet sheet's edge while the surface fades over ([0, 0.35]), THEN
  // travels to the shop header — one continuously visible edge, no jump
  const gradientStyle = useAnimatedStyle(() => {
    const travelled = interpolate(
      transition.value,
      [0.35, 1],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return {
      height: morphFrom.value + (headerHeight - morphFrom.value) * travelled,
    };
  });
  const segmentsSettleStyle = useAnimatedStyle(() => {
    const settled = interpolate(
      transition.value,
      [0.45, 0.75],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return {
      opacity: settled,
      transform: [{translateY: (1 - settled) * -12}],
    };
  });
  const searchSettleStyle = useAnimatedStyle(() => {
    const settled = interpolate(
      transition.value,
      [0.52, 0.85],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return {
      opacity: settled,
      transform: [{translateY: (1 - settled) * -12}],
    };
  });

  // the search feeds the row models; debounced so typing costs the skia
  // list one rebuild per pause, not one per keystroke
  const [searchInput, setSearchInput] = useState(state.searchQuery);
  const setSearchQuery = state.setSearchQuery;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    debounceRef.current = setTimeout(
      () => setSearchQuery(searchInput),
      SEARCH_DEBOUNCE_MS,
    );
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchInput, setSearchQuery]);
  // cleared externally when the shop closes
  useEffect(() => {
    if (state.searchQuery === '') {
      setSearchInput('');
    }
  }, [state.searchQuery]);

  // stable identity, or the popup portal re-pushes the picker every render
  const setCategoryPickerVisible = state.setCategoryPickerVisible;
  const closeCategoryPicker = useCallback(
    () => setCategoryPickerVisible(false),
    [setCategoryPickerVisible],
  );

  // swiping in from the left edge scrubs the whole hand-off backwards;
  // releasing past the threshold commits the close, otherwise it springs home
  const backPan = Gesture.Pan()
    .onTouchesDown((e, manager) => {
      if (e.allTouches[0].x > BACK_EDGE_WIDTH) {
        manager.fail();
      }
    })
    .activeOffsetX(12)
    .failOffsetY([-16, 16])
    .onUpdate(e => {
      'worklet';
      transition.value =
        1 -
        Math.min(Math.max(e.translationX / (SCREEN_WIDTH * 0.75), 0), 1) *
          0.999;
    })
    .onEnd(e => {
      'worklet';
      if (
        transition.value < BACK_COMMIT_BELOW ||
        e.velocityX > BACK_COMMIT_VELOCITY
      ) {
        runOnJS(onBack)();
      } else {
        transition.value = withTiming(1, {
          duration: 220,
          easing: Easing.out(Easing.quad),
        });
      }
    });

  // sliding white pill behind the active section
  const segmentCount = sections.length;
  const segmentsInnerWidth = SCREEN_WIDTH * 0.88 - SCREEN_HEIGHT * 0.008;
  const segmentWidth = segmentsInnerWidth / segmentCount;
  const thumbX = useSharedValue(activeSection * segmentWidth);
  useEffect(() => {
    thumbX.value = withSpring(activeSection * segmentWidth, SEGMENT_SPRING);
  }, [activeSection, segmentWidth, thumbX]);
  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{translateX: thumbX.value}],
    width: segmentWidth,
  }));

  // account drawer toggle in the nav bar; hidden while the country picker
  // inside the drawer is open
  const isCountryPickerOpen = useAppSelector(
    (reduxState: any) => reduxState.nexusshopaccount.isCountryPickerOpen,
  );
  const drawerToggleOpacity = useSharedValue(1);
  useEffect(() => {
    drawerToggleOpacity.value = withTiming(isCountryPickerOpen ? 0 : 1, {
      duration: 250,
    });
  }, [isCountryPickerOpen, drawerToggleOpacity]);
  const drawerToggleStyle = useAnimatedStyle(() => ({
    opacity: drawerToggleOpacity.value,
  }));
  const toggleDrawer = useCallback(() => {
    if (drawerOpen) {
      navigation.closeDrawer();
    } else {
      navigation.openDrawer();
    }
  }, [drawerOpen, navigation]);

  // nav-bar elements ride the transition: they fade in after the hand-off
  // point and back out ahead of it, so the two headers crossfade
  const headerFadeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      transition.value,
      [0.45, 0.8],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));
  const headerTitleFadeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      transition.value,
      [0.45, 0.8],
      [0, 1],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        translateY: interpolate(
          transition.value,
          [0.45, 0.8],
          [6, 0],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  // the shop owns the Main route's nav bar while the transition is past the
  // hand-off point; the wallet reclaims it the moment it drops back
  const deviceHeaderHeight = useHeaderHeight();
  const headerButtonsHeight = SCREEN_HEIGHT * 0.035;
  const alignHeaderElements = useMemo(
    () => ({
      marginTop: (deviceHeaderHeight - insets.top - headerButtonsHeight) * -1,
    }),
    [deviceHeaderHeight, insets.top, headerButtonsHeight],
  );
  // title identical to the gift card detail screens
  const headerTitle = useMemo(
    () => (
      // key: pair with the wallet set's keys — the hand-off must mount
      // fresh views, not swap animated styles on reconciled ones
      <Animated.View key="shop-title" style={headerTitleFadeStyle}>
        <TranslateText
          textKey="nexus_shop"
          domain="nexusShop"
          maxSizeInPixels={SCREEN_HEIGHT * 0.02}
          textStyle={[headerStyles.title, {fontSize: SCREEN_HEIGHT * 0.02}]}
          numberOfLines={1}
        />
      </Animated.View>
    ),
    [SCREEN_HEIGHT, headerTitleFadeStyle],
  );
  const backButton = useMemo(
    () => (
      <View key="shop-back" style={alignHeaderElements}>
        <Animated.View style={[headerStyles.headerBtns, headerFadeStyle]}>
          <HeaderButton
            onPress={closeShop}
            imageSource={require('../assets/images/back-icon.png')}
            leftPadding
          />
        </Animated.View>
      </View>
    ),
    [alignHeaderElements, closeShop, headerFadeStyle],
  );
  const accountButton = useMemo(
    () => (
      <View key="shop-account" style={alignHeaderElements}>
        <Animated.View
          style={[headerStyles.headerBtns, drawerToggleStyle, headerFadeStyle]}>
          <HeaderButton
            onPress={toggleDrawer}
            imageSource={require('../assets/icons/user.png')}
            imageXY={{x: SCREEN_HEIGHT * 0.02, y: SCREEN_HEIGHT * 0.02}}
            rightPadding
            backgroundColorSpecified={drawerOpen ? '#0070F0' : undefined}
          />
        </Animated.View>
      </View>
    ),
    [
      alignHeaderElements,
      drawerToggleStyle,
      headerFadeStyle,
      toggleDrawer,
      drawerOpen,
      SCREEN_HEIGHT,
    ],
  );
  const emptyFragment = useMemo(() => <></>, []);
  // NOTE: React Navigation applies marginHorizontal: 5 to the header content
  // on iOS screens wider than 414px. Cancel it out.
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
    if (!ownsHeader) {
      return;
    }
    // two hops up: account drawer -> transparent Main stack -> the stack
    // whose Main route renders the nav bar. `wallet` is a dep so a raced
    // wallet re-apply is stomped right back while the shop owns the bar.
    const headerNav = navigation.getParent()?.getParent();
    if (!headerNav) {
      return;
    }
    headerNav.setOptions({
      ...noHeaderContainerMargin,
      headerTitle: () => headerTitle,
      headerTitleAlign: 'left',
      headerTitleContainerStyle: {left: 7},
      headerLeft: () => (drawerOpen ? emptyFragment : backButton),
      headerRight: () => accountButton,
    });
  }, [
    ownsHeader,
    drawerOpen,
    navigation,
    wallet,
    headerTitle,
    backButton,
    accountButton,
    emptyFragment,
    noHeaderContainerMargin,
  ]);

  // deep links retarget the section while the shop is already open
  const setSection = state.setSection;
  useEffect(() => {
    if (route.params?.section === 'my-cards') {
      setSection('my-cards');
    }
  }, [route.params, setSection]);

  // what the glass chrome draws and reads for this screen
  const onSelectSection = useCallback(
    (index: number) => {
      if (index === 0) {
        closeShop();
      }
    },
    [closeShop],
  );
  const feed = useMemo<GlassShopFeed>(
    () => ({
      presented,
      canvasActive,
      ownsHeader,
      rowModels: state.rowModels,
      scrollY,
      logos: state.logos,
      transition,
      morphFrom,
      expandSplit: state.expandSplit,
      expandExtras: state.expandExtras,
      expandProgress: state.expandProgress,
      expandChevronLift: state.expandChevronLift,
      panelNode: state.panelNode,
      chevronNode: state.chevronNode,
      onSelectSection,
      drawerOpen,
    }),
    [
      presented,
      canvasActive,
      ownsHeader,
      state.rowModels,
      scrollY,
      state.logos,
      transition,
      morphFrom,
      state.expandSplit,
      state.expandExtras,
      state.expandProgress,
      state.expandChevronLift,
      state.panelNode,
      state.chevronNode,
      onSelectSection,
      drawerOpen,
    ],
  );
  useGlassShopFeedPublisher(feed);

  return (
    <GestureDetector gesture={backPan}>
      <Animated.View
        style={[styles.container, fadeStyle]}
        pointerEvents={visible ? 'auto' : 'none'}>
        <Animated.View style={[styles.gradientCard, gradientStyle]}>
          <LinearGradient
            style={styles.gradient}
            colors={SKIN_GRADIENT_COLORS}
            locations={SKIN_GRADIENT_LOCATIONS}
          />
        </Animated.View>

        <View style={styles.header}>
          <Animated.View style={[styles.segments, segmentsSettleStyle]}>
            <Animated.View style={[styles.segmentThumb, thumbStyle]} />
            {sections.map(section => (
              <Pressable
                key={section.key}
                style={styles.segment}
                onPress={() => state.setSection(section.key)}>
                <TranslateText
                  textKey={section.textKey}
                  domain="nexusShop"
                  maxSizeInPixels={SCREEN_HEIGHT * 0.016}
                  textStyle={
                    state.section === section.key
                      ? styles.segmentTextActive
                      : styles.segmentText
                  }
                  numberOfLines={1}
                />
              </Pressable>
            ))}
          </Animated.View>

          {state.section === 'browse' ? (
            <Animated.View style={[styles.searchPill, searchSettleStyle]}>
              <Image
                source={require('../assets/icons/search-icon.png')}
                style={styles.searchIcon}
                resizeMode="contain"
              />
              <TextInput
                style={styles.searchInput}
                value={searchInput}
                onChangeText={setSearchInput}
                placeholder={t('find_brand')}
                placeholderTextColor="rgba(255, 255, 255, 0.55)"
                returnKeyType="search"
                autoCorrect={false}
                selectionColor="#ffffff"
              />
              {searchInput !== '' ? (
                <Pressable
                  style={styles.searchClear}
                  hitSlop={10}
                  onPress={() => setSearchInput('')}>
                  <Text style={styles.searchClearGlyph}>✕</Text>
                </Pressable>
              ) : null}
            </Animated.View>
          ) : null}
        </View>

        <View style={styles.listContainer}>
          <GlassShopList
            rowModels={state.rowModels}
            section={state.section}
            active={visible}
            panelHit={state.panelHit}
            ctaPressScale={state.ctaPressScale}
            onRowAction={state.handleRowAction}
            onScrollActivity={onScrollActivity}
            scrollY={scrollY}
            height={SCREEN_HEIGHT - listTop}
            refreshing={state.refreshing}
            onRefresh={state.refresh}
          />
        </View>

        <CategoryPickerModal
          isVisible={state.categoryPickerVisible}
          close={closeCategoryPicker}
          selectedCategory={state.selectedCategory}
          onSelect={state.setSelectedCategory}
        />
      </Animated.View>
    </GestureDetector>
  );
};

const headerStyles = StyleSheet.create({
  title: {
    color: '#fff',
    fontFamily: 'Satoshi Variable',
    fontStyle: 'normal',
    fontWeight: '700',
  },
  headerBtns: {
    width: 'auto',
    height: 'auto',
    flexDirection: 'row',
  },
});

const getStyles = (
  screenWidth: number,
  screenHeight: number,
  topInset: number,
  headerHeight: number,
  listTop: number,
) =>
  StyleSheet.create({
    container: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: SHEET_BACKGROUND,
      zIndex: 2,
    },
    gradientCard: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: headerHeight,
      borderBottomLeftRadius: screenHeight * CARD_FOLD_RADIUS_RATIO,
      borderBottomRightRadius: screenHeight * CARD_FOLD_RADIUS_RATIO,
      borderCurve: 'continuous',
      overflow: 'hidden',
    },
    gradient: {
      ...StyleSheet.absoluteFillObject,
    },
    header: {
      position: 'absolute',
      top: topInset + screenHeight * SHOP_HEADER_SEGMENTS_TOP_RATIO,
      left: 0,
      right: 0,
    },
    segments: {
      flexDirection: 'row',
      alignItems: 'center',
      height: screenHeight * SHOP_HEADER_SEGMENTS_HEIGHT_RATIO,
      marginHorizontal: screenWidth * 0.06,
      padding: screenHeight * 0.004,
      borderRadius: (screenHeight * SHOP_HEADER_SEGMENTS_HEIGHT_RATIO) / 2,
      borderCurve: 'continuous',
      backgroundColor: 'rgba(255, 255, 255, 0.12)',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(238, 235, 235, 0.45)',
    },
    segmentThumb: {
      position: 'absolute',
      left: screenHeight * 0.004,
      top: screenHeight * 0.004,
      bottom: screenHeight * 0.004,
      borderRadius: (screenHeight * SHOP_HEADER_SEGMENTS_HEIGHT_RATIO) / 2,
      borderCurve: 'continuous',
      backgroundColor: '#ffffff',
    },
    segment: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    segmentText: {
      color: 'rgba(255, 255, 255, 0.85)',
      fontFamily: 'Satoshi Variable',
      fontWeight: '700',
      fontSize: screenHeight * 0.015,
    },
    segmentTextActive: {
      color: '#2E2E2E',
      fontFamily: 'Satoshi Variable',
      fontWeight: '700',
      fontSize: screenHeight * 0.015,
    },
    searchPill: {
      flexDirection: 'row',
      alignItems: 'center',
      height: screenHeight * SHOP_HEADER_SEARCH_HEIGHT_RATIO,
      marginTop: screenHeight * SHOP_HEADER_GAP_RATIO,
      marginHorizontal: screenWidth * 0.06,
      paddingHorizontal: screenWidth * 0.04,
      borderRadius: (screenHeight * SHOP_HEADER_SEARCH_HEIGHT_RATIO) / 2,
      borderCurve: 'continuous',
      backgroundColor: 'rgba(255, 255, 255, 0.12)',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(238, 235, 235, 0.45)',
    },
    searchIcon: {
      width: screenHeight * 0.02,
      height: screenHeight * 0.02,
      tintColor: '#ffffff',
      opacity: 0.7,
      marginRight: screenWidth * 0.025,
    },
    searchInput: {
      flex: 1,
      color: '#ffffff',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.017,
      fontWeight: '500',
      paddingVertical: 0,
    },
    searchClear: {
      width: screenHeight * 0.024,
      height: screenHeight * 0.024,
      borderRadius: screenHeight * 0.012,
      backgroundColor: 'rgba(255, 255, 255, 0.25)',
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: screenWidth * 0.02,
    },
    searchClearGlyph: {
      color: '#ffffff',
      fontSize: screenHeight * 0.012,
      fontWeight: '700',
      lineHeight: screenHeight * 0.014,
    },
    listContainer: {
      position: 'absolute',
      top: listTop,
      left: 0,
      right: 0,
      bottom: 0,
    },
  });

// drawer-status renders from the wrapping account drawer stop here
export default memo(NexusShop);
