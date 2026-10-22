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
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
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
  withTiming,
} from 'react-native-reanimated';
import {useTranslation} from 'react-i18next';

import GlassShopList from '../components/GlassShopList';
import CategoryPickerModal from '../components/Modals/CategoryPickerModal';
import SegmentedPills from '../components/ButtonsV2/SegmentedPills';
import {
  useGlassWalletFeed,
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
  getShopSearchBlock,
  getShopSegmentsTop,
  ShopSection,
  SHOP_HEADER_GAP_RATIO,
  SHOP_HEADER_INSET_RATIO,
  SHOP_HEADER_SEARCH_HEIGHT_RATIO,
  SHOP_HEADER_SEGMENTS_HEIGHT_RATIO,
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

// The Nexus Shop screen: a transparent-modal route in the Main stack, so
// the live wallet stays attached and visible beneath while one transition
// value drives the whole hand-off. The glass tab bar and its canvas are
// shared chrome above the navigator; this screen publishes its rows and
// animation state through glassChromeFeeds so the persistent bar refracts
// them. The account drawer wraps just this screen, and the header
// (ShopHeader) renders above that drawer off the same feed. Entry: the bar's
// shop slot or navigate('NexusShop', {screen: 'NexusShopScreen', params?}).
//
// The gradient card crowns the screen — content-fit, rounded bottom corners
// like the folded wallet — over the light list the glass canvas draws. One
// transition drives the whole arrival: the surface fades over the wallet
// (its gradient matches the folded-skin derivation, so the cover is
// seamless), then the card morphs from the wallet top-half's height down to
// the header while the pills and search settle in.

const SEARCH_DEBOUNCE_MS = 180;
// iOS-style back swipe: starts at the left edge, scrubs the transition
const BACK_EDGE_WIDTH = 32;
const BACK_COMMIT_BELOW = 0.65;
const BACK_COMMIT_VELOCITY = 500;

const SECTIONS: {key: ShopSection; textKey: string; textDomain: string}[] = [
  {key: 'browse', textKey: 'shop', textDomain: 'nexusShop'},
  {key: 'my-cards', textKey: 'my_cards', textDomain: 'nexusShop'},
  {key: 'wishlist', textKey: 'wishlist', textDomain: 'nexusShop'},
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
  const wallet = useGlassWalletFeed();
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
  // header ownership follows the transition itself (not presented), so the
  // wallet's header hands over on the morph — and the back-swipe scrub
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
  // everything under the card — the sheet colour here, the drawn rows in the
  // chrome canvas — is cut on the frame the close commits; only the card and
  // its content keep animating out. Scrubbing the back swipe still fades the
  // whole surface with the transition, so a swipe that springs back is intact.
  const beneathCut = useSharedValue(0);

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
    // drop the sheet and the rows drawn on it before the morph starts; the
    // canvas layer unmounts in the same commit that hides the sheet colour,
    // so the wallet is uncovered whole rather than through a fade
    beneathCut.value = 1;
    setCanvasActive(false);
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
  }, [
    drawerOpen,
    navigation,
    seedMorphFrom,
    transition,
    finishClose,
    beneathCut,
  ]);

  // arrive on focus: seed the morph origin from the live wallet and play
  // the hand-off. No blur cleanup — a pushed gift-card screen keeps the shop
  // mounted beneath it, and the close path pops this route itself. Re-focus
  // re-runs this with every write already at its target, so nothing moves.
  useFocusEffect(
    useCallback(() => {
      closingRef.current = false;
      beneathCut.value = 0;
      seedMorphFrom();
      setPresented(true);
      setCanvasActive(true);
      transition.value = withTiming(1, {
        duration: 380,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
      });
    }, [seedMorphFrom, transition, beneathCut]),
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

  const headerHeight = getShopHeaderHeight(
    SCREEN_WIDTH,
    SCREEN_HEIGHT,
    insets.top,
  );
  const listTop = getShopListTop(SCREEN_WIDTH, SCREEN_HEIGHT, insets.top);

  // only browse has a search pill: the other sections shed it, so the card
  // gives back its height and everything under the card's bottom edge — the
  // touch host here, the drawn rows in the canvas — rides up with it
  const searchBlock = getShopSearchBlock(SCREEN_HEIGHT);
  const searchVisible = state.section === 'browse';
  const headerShrink = useSharedValue(searchVisible ? 0 : searchBlock);
  useEffect(() => {
    headerShrink.value = withTiming(searchVisible ? 0 : searchBlock, {
      duration: 240,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    });
  }, [searchVisible, searchBlock, headerShrink]);
  const listShiftStyle = useAnimatedStyle(() => ({
    transform: [{translateY: -headerShrink.value}],
  }));
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
  const sheetStyle = useAnimatedStyle(() => ({
    opacity: beneathCut.value ? 0 : 1,
  }));
  // NOTE: The card's bottom edge is the container boundary. It stays pinned at
  // the wallet sheet's edge while the surface fades over ([0, 0.35]), THEN
  // travels to the shop header — one continuously visible edge, no jump.
  // Its corners stay at the wallet card's radius throughout; only the height
  // morphs.
  const gradientStyle = useAnimatedStyle(() => {
    const travelled = interpolate(
      transition.value,
      [0.35, 1],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return {
      height:
        morphFrom.value +
        (headerHeight - headerShrink.value - morphFrom.value) * travelled,
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

  const toggleDrawer = useCallback(() => {
    if (drawerOpen) {
      navigation.closeDrawer();
    } else {
      navigation.openDrawer();
    }
  }, [drawerOpen, navigation]);

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
      headerShrink,
      onSelectSection,
      drawerOpen,
      onBack: closeShop,
      onToggleDrawer: toggleDrawer,
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
      headerShrink,
      onSelectSection,
      drawerOpen,
      closeShop,
      toggleDrawer,
    ],
  );
  useGlassShopFeedPublisher(feed);

  return (
    <GestureDetector gesture={backPan}>
      <Animated.View
        style={[styles.container, fadeStyle]}
        pointerEvents={visible ? 'auto' : 'none'}>
        <Animated.View style={[styles.sheet, sheetStyle]} />

        <Animated.View style={[styles.gradientCard, gradientStyle]}>
          <LinearGradient
            style={styles.gradient}
            colors={SKIN_GRADIENT_COLORS}
            locations={SKIN_GRADIENT_LOCATIONS}
          />
        </Animated.View>

        <View style={styles.header}>
          <SegmentedPills
            segments={sections}
            activeIndex={activeSection}
            onSelect={index => state.setSection(sections[index].key)}
            width={SCREEN_WIDTH * (1 - SHOP_HEADER_INSET_RATIO * 2)}
            height={SCREEN_HEIGHT * SHOP_HEADER_SEGMENTS_HEIGHT_RATIO}
            style={[styles.segments, segmentsSettleStyle]}
          />

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
                autoComplete="off"
                allowFontScaling={false}
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

        <Animated.View style={[styles.listContainer, listShiftStyle]}>
          <GlassShopList
            rowModels={state.rowModels}
            section={state.section}
            active={visible}
            onRowAction={state.handleRowAction}
            onScrollActivity={onScrollActivity}
            scrollY={scrollY}
            height={SCREEN_HEIGHT - listTop + (searchVisible ? 0 : searchBlock)}
            refreshing={state.refreshing}
            onRefresh={state.refresh}
          />
        </Animated.View>

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
      zIndex: 2,
    },
    sheet: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: SHEET_BACKGROUND,
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
      top: getShopSegmentsTop(screenWidth, screenHeight, topInset),
      left: 0,
      right: 0,
    },
    segments: {
      marginHorizontal: screenWidth * SHOP_HEADER_INSET_RATIO,
    },
    searchPill: {
      flexDirection: 'row',
      alignItems: 'center',
      height: screenHeight * SHOP_HEADER_SEARCH_HEIGHT_RATIO,
      marginTop: screenHeight * SHOP_HEADER_GAP_RATIO,
      marginHorizontal: screenWidth * SHOP_HEADER_INSET_RATIO,
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
      fontStyle: 'normal',
      fontWeight: '500',
      letterSpacing: -0.39,
      fontSize: screenHeight * 0.02,
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
