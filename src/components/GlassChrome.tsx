import React, {useCallback, useEffect, useRef} from 'react';
import {StyleSheet} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import LiquidGlassTabBar from './LiquidGlassTabBar';
import {useGlassChromeFeeds} from './glassChromeFeeds';
import type {ShopRowModels} from './GiftCardShop/GlassShopRows';
import type {ShopLogoImages} from './GiftCardShop/shopLogoImages';
import {useAppSelector} from '../store/hooks';

// The persistent glass layer above the Main-screen navigator: one tab bar,
// one canvas, fed by whichever screens are publishing. Mounted once for the
// drawer's life, so the skia list caches survive screen changes; pushed
// stack screens cover it, App-level popups render above it.

// stable fallbacks for before the shop screen first mounts
const EMPTY_SHOP_MODELS: ShopRowModels = {
  models: [],
  rowTops: [],
  rowBottoms: [],
};
const EMPTY_LOGOS: ShopLogoImages = {};

const GlassChrome: React.FC = () => {
  const {wallet, shop} = useGlassChromeFeeds();
  const isInternetReachable = useAppSelector(
    state => state.info!.isInternetReachable,
  );

  // the shop feed's shared values don't exist until its screen mounts; and
  // once seen, they must KEEP their identity through the feed-null teardown
  // commit — swapping them all rebuilds every canvas mapper at once, and a
  // rebuilt tree can draw one frame before its bindings attach. A dead
  // shop's values rest at the same readings as these fallbacks.
  const fallbackScrollY = useSharedValue(0);
  const fallbackTransition = useSharedValue(0);
  const fallbackMorphFrom = useSharedValue(0);
  const fallbackSplit = useSharedValue(1e9);
  const fallbackExtras = useSharedValue(0);
  const fallbackProgress = useSharedValue(1);
  const fallbackChevronLift = useSharedValue(0);
  const shopValuesRef = useRef({
    scrollY: fallbackScrollY,
    transition: fallbackTransition,
    morphFrom: fallbackMorphFrom,
    expandSplit: fallbackSplit,
    expandExtras: fallbackExtras,
    expandProgress: fallbackProgress,
    expandChevronLift: fallbackChevronLift,
  });
  if (shop) {
    shopValuesRef.current = {
      scrollY: shop.scrollY,
      transition: shop.transition,
      morphFrom: shop.morphFrom,
      expandSplit: shop.expandSplit,
      expandExtras: shop.expandExtras,
      expandProgress: shop.expandProgress,
      expandChevronLift: shop.expandChevronLift,
    };
  }
  const shopValues = shopValuesRef.current;

  // wallet overlays and the shop's account drawer render above the old
  // in-screen bar's spot; the hoisted chrome steps aside for them
  const suppressed =
    !wallet || wallet.barSuppressed || (shop?.drawerOpen ?? false);
  const chromeOpacity = useSharedValue(suppressed ? 0 : 1);
  useEffect(() => {
    chromeOpacity.value = withTiming(suppressed ? 0 : 1, {duration: 150});
  }, [suppressed, chromeOpacity]);
  const chromeStyle = useAnimatedStyle(() => ({
    opacity: chromeOpacity.value,
  }));

  const shopPresented = shop?.presented ?? false;
  const onSelectSection = useCallback(
    (index: number) => {
      if (shopPresented) {
        shop?.onSelectSection(index);
      } else {
        wallet?.onSelectSection(index);
      }
    },
    [shopPresented, shop, wallet],
  );

  if (!wallet) {
    return null;
  }

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, chromeStyle]}
      pointerEvents={suppressed ? 'none' : 'box-none'}>
      <LiquidGlassTabBar
        activeIndex={shopPresented ? 1 : 0}
        onSelectSection={onSelectSection}
        contentActivity={wallet.contentActivity}
        rowModels={wallet.rowModels}
        mainSheetsTranslationY={wallet.mainSheetsTranslationY}
        txListScrollY={wallet.txListScrollY}
        listHeaderOffset={wallet.listHeaderOffset}
        showTxList={wallet.showTxList}
        showShop={shop?.canvasActive ?? false}
        shopRowModels={shop?.rowModels ?? EMPTY_SHOP_MODELS}
        shopScrollY={shopValues.scrollY}
        shopLogos={shop?.logos ?? EMPTY_LOGOS}
        shopTransition={shopValues.transition}
        shopMorphFrom={shopValues.morphFrom}
        shopExpandSplit={shopValues.expandSplit}
        shopExpandExtras={shopValues.expandExtras}
        shopExpandProgress={shopValues.expandProgress}
        shopExpandChevronLift={shopValues.expandChevronLift}
        shopPanel={shop?.panelNode}
        shopChevron={shop?.chevronNode}
        activeSheet={shopPresented ? 0 : wallet.activeSheet}
        cardSwapOpacity={wallet.cardSwapOpacity}
        shopDisabled={!isInternetReachable}
      />
    </Animated.View>
  );
};

export default GlassChrome;
