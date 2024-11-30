import React, {useEffect} from 'react';
import {Dimensions, StyleSheet, View} from 'react-native';
import {
  Gesture,
  GestureDetector,
  PanGestureHandlerEventPayload,
} from 'react-native-gesture-handler';
import Animated, {
  SharedValue,
  runOnJS,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const ANIM_DURATION = 200;
const SPRING_BACK_ANIM_DURATION = 100;

const SWIPE_TRIGGER_Y_RANGE = Dimensions.get('screen').height * 0.15;
const UNFOLD_SHEET_POINT = Dimensions.get('screen').height * 0.24;
const FOLD_SHEET_POINT = Dimensions.get('screen').height * 0.47;
const UNFOLD_SNAP_POINT = UNFOLD_SHEET_POINT + SWIPE_TRIGGER_Y_RANGE;
const FOLD_SNAP_POINT = FOLD_SHEET_POINT - SWIPE_TRIGGER_Y_RANGE;

interface Props {
  txViewComponent: React.ReactNode;
  buyViewComponent: React.ReactNode;
  sellViewComponent: React.ReactNode;
  sendViewComponent: React.ReactNode;
  receiveViewComponent: React.ReactNode;
  headerComponent: React.ReactNode;
  mainSheetsTranslationY: SharedValue<number>;
  mainSheetsTranslationYStart: SharedValue<number>;
  folded: boolean;
  foldUnfold: (isFolded: boolean) => void;
  activeTab: number;
}

const BottomSheet: React.FC<Props> = props => {
  const {
    txViewComponent,
    buyViewComponent,
    sellViewComponent,
    sendViewComponent,
    receiveViewComponent,
    headerComponent,
    mainSheetsTranslationY,
    mainSheetsTranslationYStart,
    folded,
    foldUnfold,
    activeTab,
  } = props;

  const openMenuBarTabOnJS = () => {
    foldUnfold(true);
  };

  const closeMenuBarTabOnJS = () => {
    foldUnfold(false);
  };

  const onHandlerEnd = ({translationY, velocityY}: PanGestureHandlerEventPayload) => {
    'worklet';
    const dragToss = 0.05;
    const destSnapPoint = translationY + mainSheetsTranslationYStart.value + velocityY * dragToss;

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
      if (e.translationY + mainSheetsTranslationYStart.value < UNFOLD_SNAP_POINT) {
        onHandlerEnd(e);
      } else {
        mainSheetsTranslationY.value = withTiming(FOLD_SHEET_POINT, {duration: SPRING_BACK_ANIM_DURATION});
      }
    } else {
      if (e.translationY + mainSheetsTranslationYStart.value > FOLD_SNAP_POINT) {
        onHandlerEnd(e);
      } else {
        mainSheetsTranslationY.value = withTiming(UNFOLD_SHEET_POINT, {duration: SPRING_BACK_ANIM_DURATION});
      }
    }
  }

  const headerGesture = Gesture.Pan()
    .onUpdate(e => {
      mainSheetsTranslationY.value = e.translationY + mainSheetsTranslationYStart.value;
    })
    .onEnd(onEndTrigger);

  const panGesture = Gesture.Pan()
    .onUpdate(e => {
      mainSheetsTranslationY.value = e.translationY + mainSheetsTranslationYStart.value;
    })
    .onEnd(onEndTrigger);

  const bottomSheetAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{translateY: mainSheetsTranslationY.value}],
    };
  });

  useEffect(() => {
    if (folded) {
      mainSheetsTranslationY.value = withTiming(FOLD_SHEET_POINT, {duration: ANIM_DURATION});
      // set Y offset
      setTimeout(() => {
        mainSheetsTranslationYStart.value = FOLD_SHEET_POINT;
      }, ANIM_DURATION);
    } else {
      mainSheetsTranslationY.value = withTiming(UNFOLD_SHEET_POINT, {duration: ANIM_DURATION});
      // set Y offset
      setTimeout(() => {
        mainSheetsTranslationYStart.value = UNFOLD_SHEET_POINT;
      }, ANIM_DURATION);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folded, mainSheetsTranslationY]);

  return (
      <Animated.View style={[styles.bottomSheet, bottomSheetAnimatedStyle]}>
        <GestureDetector gesture={headerGesture}>
          <View collapsable={false}>
            {headerComponent}
          </View>
        </GestureDetector>
        {activeTab === 0 ? (
          <GestureDetector gesture={panGesture}>
            <View collapsable={false}>
              {txViewComponent}
            </View>
          </GestureDetector>
        ) : null}
        {activeTab === 1 ? (
          <GestureDetector gesture={panGesture}>
            <View collapsable={false}>
              {buyViewComponent}
            </View>
          </GestureDetector>
        ) : null}
        {activeTab === 2 ? (
          <GestureDetector gesture={panGesture}>
            <View collapsable={false}>
              {sellViewComponent}
            </View>
          </GestureDetector>
        ) : null}
        {activeTab === 4 ? (
          <GestureDetector gesture={panGesture}>
            <View collapsable={false}>
              {sendViewComponent}
            </View>
          </GestureDetector>
        ) : null}
        {activeTab === 5 ? (
          <GestureDetector gesture={panGesture}>
            <View collapsable={false}>
              {receiveViewComponent}
            </View>
          </GestureDetector>
        ) : null}
      </Animated.View>
  );
};

const styles = StyleSheet.create({
  bottomSheet: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#f7f7f7',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
});

export default BottomSheet;
