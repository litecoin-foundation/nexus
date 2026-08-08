import React, {useEffect, useRef, useState, useContext} from 'react';
import {Platform, StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  Gesture,
  GestureDetector,
  PanGesture,
} from 'react-native-gesture-handler';
import Animated, {
  SharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
} from 'react-native-reanimated';

import {ScreenSizeContext} from '../context/screenSize';
import CustomSafeAreaView from '../components/CustomSafeAreaView';
import {
  getNewMainSheetPoints,
  makeSheetSnapHandlers,
} from '../animations/useNewMainAnims';
import {SHEET_BACKGROUND} from './GlassTxRows';

export const SHEET_FOLD_ANIM_MS = 200;
export const SHEET_TOP_RADIUS_RATIO = 0.03;
export const CARD_SWAP_DELAY = 155;
export const CARD_SWAP_SETTLE_MS = 600;

interface Props {
  txViewComponent: React.ReactNode;
  buyViewComponent: React.ReactNode;
  sellViewComponent: React.ReactNode;
  sendViewComponent: React.ReactNode;
  receiveViewComponent: React.ReactNode;
  headerComponent: React.ReactNode;
  mainSheetsTranslationY: SharedValue<number>;
  mainSheetsTranslationYStart: SharedValue<number>;
  // card swap fade, shared with the glass canvas's underlay copy
  cardOpacity: SharedValue<number>;
  folded: boolean;
  foldUnfold: (isFolded: boolean) => void;
  activeTab: number;
}

interface CardProps {
  txView: React.ReactNode;
  buyView: React.ReactNode;
  sellView: React.ReactNode;
  sendView: React.ReactNode;
  receiveView: React.ReactNode;
  activeTab: number;
  panGesture: PanGesture;
}

const GlassBottomSheet: React.FC<Props> = props => {
  const insets = useSafeAreaInsets();

  const {
    txViewComponent,
    buyViewComponent,
    sellViewComponent,
    sendViewComponent,
    receiveViewComponent,
    headerComponent,
    mainSheetsTranslationY,
    mainSheetsTranslationYStart,
    cardOpacity,
    folded,
    foldUnfold,
    activeTab,
  } = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const {UNFOLD_SHEET_POINT, FOLD_SHEET_POINT} = getNewMainSheetPoints(
    SCREEN_HEIGHT,
    insets.top,
  );

  const {onDragUpdate, onEndTrigger} = makeSheetSnapHandlers({
    mainSheetsTranslationY,
    mainSheetsTranslationYStart,
    folded,
    foldUnfold,
    screenHeight: SCREEN_HEIGHT,
    topInset: insets.top,
  });

  const headerGesture = Gesture.Pan()
    .onUpdate(e => {
      'worklet';
      onDragUpdate(e.translationY);
    })
    .onEnd(onEndTrigger);

  const basePanGesture = Gesture.Pan();
  if (Platform.OS === 'android') {
    basePanGesture.activeOffsetY([-15, 15]);
  }
  const panGesture = basePanGesture
    .onUpdate(e => {
      'worklet';
      onDragUpdate(e.translationY);
    })
    .onEnd(onEndTrigger);

  const bottomSheetAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{translateY: mainSheetsTranslationY.value}],
    };
  });

  useEffect(() => {
    if (folded) {
      mainSheetsTranslationY.value = withTiming(FOLD_SHEET_POINT, {
        duration: SHEET_FOLD_ANIM_MS,
      });
      setTimeout(() => {
        mainSheetsTranslationYStart.value = FOLD_SHEET_POINT;
      }, SHEET_FOLD_ANIM_MS);
    } else {
      mainSheetsTranslationY.value = withTiming(UNFOLD_SHEET_POINT, {
        duration: SHEET_FOLD_ANIM_MS,
      });
      setTimeout(() => {
        mainSheetsTranslationYStart.value = UNFOLD_SHEET_POINT;
      }, SHEET_FOLD_ANIM_MS);
    }
    /* eslint-disable react-hooks/exhaustive-deps */
  }, [folded, mainSheetsTranslationY, mainSheetsTranslationYStart]);

  const animatedCardOpacityStyle = useAnimatedStyle(() => {
    return {
      opacity: cardOpacity.value,
    };
  });

  const [dalayedActiveTab, setDalayedActiveTab] = useState(activeTab);

  const animTimeout = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    animTimeout.current = setTimeout(() => {
      setDalayedActiveTab(activeTab);
    }, CARD_SWAP_DELAY);
    cardOpacity.value = withSequence(
      withTiming(0, {duration: 150}),
      withTiming(1, {duration: 300}),
    );
    return () => {
      clearTimeout(animTimeout.current);
    };
  }, [activeTab, cardOpacity]);

  return (
    <Animated.View style={[styles.bottomSheet, bottomSheetAnimatedStyle]}>
      <View style={styles.sheetContent}>
        <GestureDetector gesture={headerGesture}>
          <View collapsable={false} style={styles.headerComponent}>
            {headerComponent}
          </View>
        </GestureDetector>
        <Animated.View style={animatedCardOpacityStyle}>
          <RenderCard
            txView={txViewComponent}
            buyView={buyViewComponent}
            sellView={sellViewComponent}
            sendView={sendViewComponent}
            receiveView={receiveViewComponent}
            activeTab={dalayedActiveTab}
            panGesture={panGesture}
          />
        </Animated.View>
      </View>
    </Animated.View>
  );
};

const RenderCard: React.FC<CardProps> = props => {
  const {
    txView,
    buyView,
    sellView,
    sendView,
    receiveView,
    activeTab,
    panGesture,
  } = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  return (
    <Animated.View>
      <CustomSafeAreaView styles={{...styles.safeArea}} edges={['bottom']}>
        {activeTab === 0 ? (
          <GestureDetector gesture={panGesture}>
            <View>{txView}</View>
          </GestureDetector>
        ) : null}
        {activeTab === 1 ? (
          <GestureDetector gesture={panGesture}>
            <View>{buyView}</View>
          </GestureDetector>
        ) : null}
        {activeTab === 2 ? (
          <GestureDetector gesture={panGesture}>
            <View>{sellView}</View>
          </GestureDetector>
        ) : null}
        {activeTab === 4 ? (
          <GestureDetector gesture={panGesture}>
            <View>{sendView}</View>
          </GestureDetector>
        ) : null}
        {activeTab === 5 ? (
          <GestureDetector gesture={panGesture}>
            <View>{receiveView}</View>
          </GestureDetector>
        ) : null}
      </CustomSafeAreaView>
    </Animated.View>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    safeArea: {},
    headerComponent: {
      zIndex: 2,
    },
    bottomSheet: {
      ...StyleSheet.absoluteFill,
      backgroundColor: SHEET_BACKGROUND,
      borderTopLeftRadius: screenHeight * SHEET_TOP_RADIUS_RATIO,
      borderTopRightRadius: screenHeight * SHEET_TOP_RADIUS_RATIO,
      zIndex: 1,
    },
    sheetContent: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: SHEET_BACKGROUND,
      borderTopLeftRadius: screenHeight * SHEET_TOP_RADIUS_RATIO,
      borderTopRightRadius: screenHeight * SHEET_TOP_RADIUS_RATIO,
    },
  });

export default GlassBottomSheet;
