import React, {useEffect, useRef, useState, useContext} from 'react';
import {StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
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
import CustomSafeAreaView from '../components/CustomSafeAreaView';

const ANIM_DURATION = 200;
const SPRING_BACK_ANIM_DURATION = 100;

interface Props {
  txViewComponent: React.ReactNode;
  buyViewComponent: React.ReactNode;
  sellViewComponent: React.ReactNode;
  convertViewComponent: React.ReactNode;
  sendViewComponent: React.ReactNode;
  receiveViewComponent: React.ReactNode;
  headerComponent: React.ReactNode;
  mainSheetsTranslationY: SharedValue<number>;
  mainSheetsTranslationYStart: SharedValue<number>;
  folded: boolean;
  foldUnfold: (isFolded: boolean) => void;
  activeTab: number;
}

interface CardProps {
  txView: React.ReactNode;
  buyView: React.ReactNode;
  convertView: React.ReactNode;
  sellView: React.ReactNode;
  sendView: React.ReactNode;
  receiveView: React.ReactNode;
  activeTab: number;
  panGesture: PanGesture;
}

const BottomSheet: React.FC<Props> = props => {
  const insets = useSafeAreaInsets();

  const {
    txViewComponent,
    buyViewComponent,
    sellViewComponent,
    convertViewComponent,
    sendViewComponent,
    receiveViewComponent,
    headerComponent,
    mainSheetsTranslationY,
    mainSheetsTranslationYStart,
    folded,
    foldUnfold,
    activeTab,
  } = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  // const OFFSET_HEADER_DIFF = SCREEN_HEIGHT * 0.06 - insets.top;
  const OFFSET_HEADER_DIFF = 0;
  const SWIPE_TRIGGER_Y_RANGE = SCREEN_HEIGHT * 0.15;
  const UNFOLD_SHEET_POINT = SCREEN_HEIGHT * 0.24 + OFFSET_HEADER_DIFF;
  const FOLD_SHEET_POINT = SCREEN_HEIGHT * 0.47 + OFFSET_HEADER_DIFF;
  const UNFOLD_SNAP_POINT = UNFOLD_SHEET_POINT + SWIPE_TRIGGER_Y_RANGE;
  const FOLD_SNAP_POINT = FOLD_SHEET_POINT - SWIPE_TRIGGER_Y_RANGE;

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

  const headerGesture = Gesture.Pan()
    .onUpdate(e => {
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

  const panGesture = Gesture.Pan()
    .onUpdate(e => {
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
  }, [folded, mainSheetsTranslationY, mainSheetsTranslationYStart]);

  const cardOpacity = useSharedValue(0);

  const animatedCardOpacityStyle = useAnimatedStyle(() => {
    return {
      opacity: cardOpacity.value,
    };
  });

  const [dalayedActiveTab, setDalayedActiveTab] = useState(activeTab);

  const animTimeout = useRef<NodeJS.Timeout>();

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
      <GestureDetector gesture={headerGesture}>
        <View collapsable={false}>{headerComponent}</View>
      </GestureDetector>
      <Animated.View style={animatedCardOpacityStyle}>
        <RenderCard
          txView={txViewComponent}
          buyView={buyViewComponent}
          convertView={convertViewComponent}
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
    convertView,
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
        {activeTab === 0 ? <View>{txView}</View> : null}
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
            <View>{convertView}</View>
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
      ...StyleSheet.absoluteFillObject,
      backgroundColor: '#f7f7f7',
      borderTopLeftRadius: screenHeight * 0.03,
      borderTopRightRadius: screenHeight * 0.03,
    },
  });

export default BottomSheet;
