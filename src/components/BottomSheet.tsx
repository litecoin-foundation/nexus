import React, {useEffect, useRef, useState, useContext} from 'react';
import {Platform, StyleSheet, View} from 'react-native';
import {
  Gesture,
  GestureDetector,
  PanGesture,
  PanGestureHandlerEventPayload,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  SharedValue,
  runOnJS,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
} from 'react-native-reanimated';

import {ScreenSizeContext} from '../context/screenSize';
import {useSnapPoints} from '../hooks/useSnapPoints';
import CustomSafeAreaView from '../components/CustomSafeAreaView';
import {TopSectionState} from './TopSection';

const ANIM_DURATION = 200;
const SPRING_BACK_ANIM_DURATION = 100;

interface Props {
  txViewComponent: React.ReactNode;
  buyViewComponent: React.ReactNode;
  sellViewComponent: React.ReactNode;
  // convertViewComponent: React.ReactNode;
  shopViewComponent: React.ReactNode;
  sendViewComponent: React.ReactNode;
  receiveViewComponent: React.ReactNode;
  mainSheetsTranslationY: SharedValue<number>;
  mainSheetsTranslationYStart: SharedValue<number>;
  folded: boolean;
  foldUnfold: (isFolded: boolean) => void;
  activeTab: number;
  topSectionState: TopSectionState;
}

interface CardProps {
  txView: React.ReactNode;
  buyView: React.ReactNode;
  // convertView: React.ReactNode;
  shopView: React.ReactNode;
  sellView: React.ReactNode;
  sendView: React.ReactNode;
  receiveView: React.ReactNode;
  activeTab: number;
  panGesture: PanGesture;
}

const BottomSheet: React.FC<Props> = props => {
  const {
    txViewComponent,
    buyViewComponent,
    sellViewComponent,
    // convertViewComponent,
    shopViewComponent,
    sendViewComponent,
    receiveViewComponent,
    mainSheetsTranslationY,
    mainSheetsTranslationYStart,
    folded,
    foldUnfold,
    activeTab,
    topSectionState,
  } = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  // When the chart is open it sits above the menu, making the top section
  // taller, so the folded sheet has to rest lower to keep it fully visible.
  // This is the rendered height of TopSectionChart, summed from its parts
  // (breakpoint mirrors TopSectionChart's screenHeight < 701 branch):
  //   paddingTop     : 0.03 / 0.04  * H
  //   LineChart      : 0.15         * H  (Cursor container fixed height)
  //   gap            : 0.035 / 0.05 * H
  //   DatePicker     : 0.03         * H  (DateButton height)
  const isShortScreen = SCREEN_HEIGHT < 701;
  const CHART_HEIGHT =
    SCREEN_HEIGHT *
    ((isShortScreen ? 0.03 : 0.04) +
      0.15 +
      (isShortScreen ? 0.035 : 0.05) +
      0.03);
  const CHART_EXTRA_HEIGHT = topSectionState === 'chart' ? CHART_HEIGHT : 0;
  const {
    UNFOLD_SHEET_POINT,
    FOLD_SHEET_POINT,
    UNFOLD_SNAP_POINT,
    FOLD_SNAP_POINT,
  } = useSnapPoints(CHART_EXTRA_HEIGHT);

  const openMenuBarTabOnJS = () => {
    foldUnfold(true);
  };

  const closeMenuBarTabOnJS = () => {
    foldUnfold(false);
  };

  const onHandlerEnd = ({
    translationY,
    velocityY,
  }: PanGestureHandlerEventPayload) => {
    'worklet';
    const dragToss = 0.03;
    let destSnapPoint = 0;
    if (
      translationY + mainSheetsTranslationYStart.value > UNFOLD_SHEET_POINT &&
      translationY + mainSheetsTranslationYStart.value < FOLD_SHEET_POINT
    ) {
      destSnapPoint =
        translationY + mainSheetsTranslationYStart.value + velocityY * dragToss;
    } else {
      if (folded) {
        destSnapPoint = UNFOLD_SHEET_POINT;
      } else {
        destSnapPoint = FOLD_SHEET_POINT;
      }
    }

    mainSheetsTranslationY.value = withSpring(destSnapPoint, {
      mass: 0.1,
    });

    if (folded) {
      runOnJS(openMenuBarTabOnJS)();
    } else {
      runOnJS(closeMenuBarTabOnJS)();
    }
  };

  function onEndTrigger(e: any) {
    'worklet';
    if (folded) {
      if (
        e.translationY + mainSheetsTranslationYStart.value <
        UNFOLD_SNAP_POINT
      ) {
        onHandlerEnd(e);
      } else {
        mainSheetsTranslationY.value = withTiming(FOLD_SHEET_POINT, {
          duration: SPRING_BACK_ANIM_DURATION,
        });
      }
    } else {
      if (
        e.translationY + mainSheetsTranslationYStart.value >
        FOLD_SNAP_POINT
      ) {
        onHandlerEnd(e);
      } else {
        mainSheetsTranslationY.value = withTiming(UNFOLD_SHEET_POINT, {
          duration: SPRING_BACK_ANIM_DURATION,
        });
      }
    }
  }

  const basePanGesture = Gesture.Pan();
  if (Platform.OS === 'android') {
    basePanGesture.activeOffsetY([-15, 15]);
  }
  const panGesture = basePanGesture
    .onUpdate(e => {
      'worklet';
      if (
        e.translationY + mainSheetsTranslationYStart.value >
          UNFOLD_SHEET_POINT &&
        e.translationY + mainSheetsTranslationYStart.value < FOLD_SHEET_POINT
      ) {
        mainSheetsTranslationY.value =
          e.translationY + mainSheetsTranslationYStart.value;
      }
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
        duration: ANIM_DURATION,
      });
      // set Y offset
      setTimeout(() => {
        mainSheetsTranslationYStart.value = FOLD_SHEET_POINT;
      }, ANIM_DURATION);
    } else {
      mainSheetsTranslationY.value = withTiming(UNFOLD_SHEET_POINT, {
        duration: ANIM_DURATION,
      });
      // set Y offset
      setTimeout(() => {
        mainSheetsTranslationYStart.value = UNFOLD_SHEET_POINT;
      }, ANIM_DURATION);
    }
    /* eslint-disable react-hooks/exhaustive-deps */
  }, [
    folded,
    topSectionState,
    mainSheetsTranslationY,
    mainSheetsTranslationYStart,
  ]);

  const cardOpacity = useSharedValue(0);

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
    }, 155);
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
      <Animated.View style={animatedCardOpacityStyle}>
        <RenderCard
          txView={txViewComponent}
          buyView={buyViewComponent}
          // convertView={convertViewComponent}
          shopView={shopViewComponent}
          sellView={sellViewComponent}
          sendView={sendViewComponent}
          receiveView={receiveViewComponent}
          activeTab={dalayedActiveTab}
          panGesture={panGesture}
        />
      </Animated.View>
    </Animated.View>
  );
};

const RenderCard: React.FC<CardProps> = props => {
  const {
    txView,
    buyView,
    sellView,
    // convertView,
    shopView,
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
        {activeTab === 3 ? (
          <GestureDetector gesture={panGesture}>
            <View>{shopView}</View>
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
    bottomSheet: {
      ...StyleSheet.absoluteFill,
      backgroundColor: '#f7f7f7',
      borderTopLeftRadius: screenHeight * 0.03,
      borderTopRightRadius: screenHeight * 0.03,
      overflow: 'hidden',
      zIndex: 1,
    },
  });

export default BottomSheet;
