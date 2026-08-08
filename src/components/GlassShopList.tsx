import React, {useCallback, useContext, useEffect, useRef} from 'react';
import {Platform, RefreshControl, StyleSheet, View} from 'react-native';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  SharedValue,
  useAnimatedScrollHandler,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import {firstRowAt} from './GlassTxRows';
import {
  ShopPanelHit,
  ShopRowAction,
  ShopRowModels,
  ShopSection,
  shopPanelCtaZone,
  shopPanelHitTarget,
  shopRowHitTarget,
} from './GiftCardShop/GlassShopRows';
import {ScreenSizeContext} from '../context/screenSize';

// Invisible native scroller for the shop rows; GlassTxCanvas draws the
// visible rows so the tab bar glass can refract them. Same rules as the tx
// list: scrollY is written on the UI thread and taps are hit-tested against
// the shared row geometry — here down to the sub-row target.

interface Props {
  rowModels: ShopRowModels;
  section: ShopSection;
  active: boolean;
  // open panel overlay: taps inside it get panel-local hit testing, rows
  // beneath it are hit at their slid-down positions
  panelHit: ShopPanelHit | null;
  ctaPressScale: SharedValue<number>;
  onRowAction: (action: ShopRowAction) => void;
  onScrollActivity?: () => void;
  scrollY: SharedValue<number>;
  height: number;
  refreshing: boolean;
  onRefresh: () => void;
}

const CTA_PRESS_SPRING = {mass: 0.6, damping: 18, stiffness: 260};

const GlassShopList: React.FC<Props> = props => {
  const {
    rowModels,
    section,
    active,
    panelHit,
    ctaPressScale,
    onRowAction,
    onScrollActivity,
    scrollY,
    height,
    refreshing,
    onRefresh,
  } = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);

  const scrollViewRef = useRef<any>(null);
  const {models, rowTops, rowBottoms} = rowModels;

  // the native offset survives section switches and re-entry; fabric never
  // clamps it, so realign the scroller whenever the list starts over. NOT
  // on deactivation — the close animation carries the current offset down
  useEffect(() => {
    if (!active) {
      return;
    }
    scrollY.value = 0;
    scrollViewRef.current?.scrollTo({y: 0, animated: false});
  }, [section, active, scrollY]);

  // the open panel adds its height to the scroll range
  const listContentHeight =
    (rowBottoms.length > 0 ? rowBottoms[rowBottoms.length - 1] : 0) +
    (panelHit ? panelHit.extras : 0);

  // a narrowing search can strand the offset past the shrunken content
  useEffect(() => {
    const maxOffset = Math.max(0, listContentHeight - height);
    if (scrollY.value > maxOffset) {
      scrollY.value = maxOffset;
      scrollViewRef.current?.scrollTo({y: maxOffset, animated: false});
    }
  }, [listContentHeight, height, scrollY]);

  const momentumActive = useSharedValue(false);
  const lastMomentumEnd = useSharedValue(0);
  const caughtFling = useSharedValue(false);
  const lastActivityMark = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler(
    {
      onScroll: e => {
        scrollY.value = e.contentOffset.y;
        if (onScrollActivity) {
          const now = Date.now();
          if (now - lastActivityMark.value > 200) {
            lastActivityMark.value = now;
            runOnJS(onScrollActivity)();
          }
        }
      },
      onMomentumBegin: () => {
        momentumActive.value = true;
      },
      onMomentumEnd: () => {
        momentumActive.value = false;
        lastMomentumEnd.value = Date.now();
      },
    },
    [onScrollActivity],
  );

  const handleRowPress = useCallback(
    (index: number, x: number, yLocal: number) => {
      const model = models[index];
      if (!model) {
        return;
      }
      const action = shopRowHitTarget(
        model,
        x,
        yLocal,
        SCREEN_WIDTH,
        SCREEN_HEIGHT,
      );
      if (action.type !== 'none') {
        onRowAction(action);
      }
    },
    [models, onRowAction, SCREEN_WIDTH, SCREEN_HEIGHT],
  );

  // rows have no native views; taps resolve against the row geometry, with
  // the open panel's zone carved out and rows below it shifted by its height
  const tapGesture = Gesture.Tap()
    .simultaneousWithExternalGesture(scrollViewRef)
    .maxDuration(10000)
    .maxDistance(20)
    .onTouchesDown(e => {
      // a touch that catches a fling only stops it
      caughtFling.value =
        momentumActive.value || Date.now() - lastMomentumEnd.value < 120;
      // press feedback for the panel's glass cta
      if (panelHit && !caughtFling.value) {
        const y = e.changedTouches[0].y + scrollY.value;
        if (
          y >= panelHit.splitY &&
          y < panelHit.splitY + panelHit.extras &&
          shopPanelCtaZone(
            panelHit,
            y - panelHit.splitY,
            SCREEN_WIDTH,
            SCREEN_HEIGHT,
          )
        ) {
          ctaPressScale.value = withSpring(0.96, CTA_PRESS_SPRING);
        }
      }
    })
    .onFinalize(() => {
      'worklet';
      ctaPressScale.value = withSpring(1, CTA_PRESS_SPRING);
    })
    .onEnd(e => {
      'worklet';
      if (caughtFling.value || rowBottoms.length === 0) {
        return;
      }
      let y = e.y + scrollY.value;
      if (panelHit) {
        if (y >= panelHit.splitY && y < panelHit.splitY + panelHit.extras) {
          const action = shopPanelHitTarget(
            panelHit,
            e.x,
            y - panelHit.splitY,
            SCREEN_WIDTH,
            SCREEN_HEIGHT,
          );
          if (action.type !== 'none') {
            runOnJS(onRowAction)(action);
          }
          return;
        }
        if (y >= panelHit.splitY + panelHit.extras) {
          y -= panelHit.extras;
        }
      }
      const index = firstRowAt(rowBottoms, y);
      if (y < rowTops[index] || y >= rowBottoms[index]) {
        return;
      }
      runOnJS(handleRowPress)(index, e.x, y - rowTops[index]);
    });

  return (
    <View style={{height}}>
      <GestureDetector gesture={tapGesture}>
        <Animated.ScrollView
          ref={scrollViewRef}
          style={styles.scroller}
          scrollEventThrottle={1}
          refreshControl={
            // android's overlay spinner would hide behind the canvas rows
            Platform.OS === 'ios' ? (
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            ) : undefined
          }
          onScroll={scrollHandler}>
          <View style={{height: listContentHeight}} />
        </Animated.ScrollView>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  scroller: {
    flex: 1,
  },
});

export default GlassShopList;
