import React, {useEffect, useContext, useState} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {
  Extrapolation,
  interpolate,
  runOnJS,
  SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {ScreenSizeContext} from '../context/screenSize';

const SPRING_BACK_ANIM_DURATION = 100;

// Bottom-corner radius of the folded top-half card, as a ratio of
// screen height.
export const CARD_FOLD_RADIUS_RATIO = 0.037;

// Sheet snap points: folded top half fills ~65% of the screen, unfolded
// sheet stops at ~37%.
export const getNewMainSheetPoints = (
  screenHeight: number,
  topInset: number,
) => {
  const OFFSET_HEADER_DIFF = topInset - screenHeight * 0.07;
  const UNFOLD_SHEET_POINT = screenHeight * 0.37 + OFFSET_HEADER_DIFF;
  const FOLD_SHEET_POINT = screenHeight * 0.65 + OFFSET_HEADER_DIFF;
  return {
    OFFSET_HEADER_DIFF,
    // Fold/unfold commits at ~35% of the travel.
    SWIPE_TRIGGER_Y_RANGE:
      (FOLD_SHEET_POINT - UNFOLD_SHEET_POINT) * (0.15 / 0.23),
    UNFOLD_SHEET_POINT,
    FOLD_SHEET_POINT,
  };
};

interface SheetSnapConfig {
  mainSheetsTranslationY: SharedValue<number>;
  mainSheetsTranslationYStart: SharedValue<number>;
  folded: boolean;
  foldUnfold: (isFolded: boolean) => void;
  screenHeight: number;
  topInset: number;
}

// Shared drag/snap worklets for every surface that moves the sheet.
// `folded` is captured per render, so consumers rebuild gestures when it
// changes.
export const makeSheetSnapHandlers = (config: SheetSnapConfig) => {
  const {
    mainSheetsTranslationY,
    mainSheetsTranslationYStart,
    folded,
    foldUnfold,
    screenHeight,
    topInset,
  } = config;

  const {SWIPE_TRIGGER_Y_RANGE, UNFOLD_SHEET_POINT, FOLD_SHEET_POINT} =
    getNewMainSheetPoints(screenHeight, topInset);
  const UNFOLD_SNAP_POINT = UNFOLD_SHEET_POINT + SWIPE_TRIGGER_Y_RANGE;
  const FOLD_SNAP_POINT = FOLD_SHEET_POINT - SWIPE_TRIGGER_Y_RANGE;

  const settle = (isFolded: boolean) => {
    foldUnfold(isFolded);
  };

  const onDragUpdate = (translationY: number) => {
    'worklet';
    const y = translationY + mainSheetsTranslationYStart.value;
    if (y > UNFOLD_SHEET_POINT && y < FOLD_SHEET_POINT) {
      mainSheetsTranslationY.value = y;
    }
  };

  const onHandlerEnd = (e: {translationY: number; velocityY: number}) => {
    'worklet';
    const dragToss = 0.03;
    const y = e.translationY + mainSheetsTranslationYStart.value;
    let destSnapPoint = 0;
    if (y > UNFOLD_SHEET_POINT && y < FOLD_SHEET_POINT) {
      // A hard flick's toss can aim well past a snap point. Clamping keeps the
      // sheet inside its travel, which the Skia row canvas relies on to know
      // how far up rows can ever be drawn.
      destSnapPoint = Math.min(
        Math.max(y + e.velocityY * dragToss, UNFOLD_SHEET_POINT),
        FOLD_SHEET_POINT,
      );
    } else {
      destSnapPoint = folded ? UNFOLD_SHEET_POINT : FOLD_SHEET_POINT;
    }

    mainSheetsTranslationY.value = withSpring(destSnapPoint, {mass: 0.1});
    runOnJS(settle)(folded);
  };

  const onEndTrigger = (e: {translationY: number; velocityY: number}) => {
    'worklet';
    const y = e.translationY + mainSheetsTranslationYStart.value;
    if (folded) {
      if (y < UNFOLD_SNAP_POINT) {
        onHandlerEnd(e);
      } else {
        mainSheetsTranslationY.value = withTiming(FOLD_SHEET_POINT, {
          duration: SPRING_BACK_ANIM_DURATION,
        });
      }
    } else {
      if (y > FOLD_SNAP_POINT) {
        onHandlerEnd(e);
      } else {
        mainSheetsTranslationY.value = withTiming(UNFOLD_SHEET_POINT, {
          duration: SPRING_BACK_ANIM_DURATION,
        });
      }
    }
  };

  return {onDragUpdate, onEndTrigger};
};

// Height of the top half: folded it floats above the sheet; unfolded it
// extends underneath so the sheet corners reveal the gradient.
export const getNewMainTopHalfHeight = (
  sheetY: number,
  screenHeight: number,
  unfoldPoint: number,
  foldPoint: number,
) => {
  'worklet';
  return (
    sheetY -
    interpolate(
      sheetY,
      [unfoldPoint, foldPoint],
      [-screenHeight * 0.045, screenHeight * 0.013],
      Extrapolation.CLAMP,
    )
  );
};

// Top-half card height when the sheet rests folded.
export const getFoldedTopHalfHeight = (
  screenHeight: number,
  topInset: number,
) => {
  const {UNFOLD_SHEET_POINT, FOLD_SHEET_POINT} = getNewMainSheetPoints(
    screenHeight,
    topInset,
  );
  return getNewMainTopHalfHeight(
    FOLD_SHEET_POINT,
    screenHeight,
    UNFOLD_SHEET_POINT,
    FOLD_SHEET_POINT,
  );
};

interface Props {
  isWalletsModalOpened: boolean;
  isTxDetailModalOpened: boolean;
  activeTab: number;
}

export function useNewMainAnims(props: Props) {
  const {isWalletsModalOpened, isTxDetailModalOpened, activeTab} = props;
  const insets = useSafeAreaInsets();

  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);

  const {UNFOLD_SHEET_POINT, FOLD_SHEET_POINT} = getNewMainSheetPoints(
    SCREEN_HEIGHT,
    insets.top,
  );

  const mainSheetsTranslationY = useSharedValue(FOLD_SHEET_POINT);
  const mainSheetsTranslationYStart = useSharedValue(FOLD_SHEET_POINT);
  const buttonOpacity = useSharedValue(0);
  const walletButtonOpacity = useSharedValue(0);
  const walletButtonAnimDuration = 200;
  const rotateArrowAnim = useSharedValue(0);

  const rotateArrow = () => {
    rotateArrowAnim.value = withTiming(isWalletsModalOpened ? 0 : 1, {
      duration: walletButtonAnimDuration,
    });
  };

  const animatedChartOpacity = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        mainSheetsTranslationY.value,
        [UNFOLD_SHEET_POINT, FOLD_SHEET_POINT],
        [0, 1],
      ),
    };
  });

  // Bottom corners round when folded, flatten as the sheet unfolds.
  const animatedTopContainerHeight = useAnimatedProps(() => {
    return {
      height: getNewMainTopHalfHeight(
        mainSheetsTranslationY.value,
        SCREEN_HEIGHT,
        UNFOLD_SHEET_POINT,
        FOLD_SHEET_POINT,
      ),
      borderBottomLeftRadius: interpolate(
        mainSheetsTranslationY.value,
        [UNFOLD_SHEET_POINT, FOLD_SHEET_POINT],
        [0, SCREEN_HEIGHT * CARD_FOLD_RADIUS_RATIO],
      ),
      borderBottomRightRadius: interpolate(
        mainSheetsTranslationY.value,
        [UNFOLD_SHEET_POINT, FOLD_SHEET_POINT],
        [0, SCREEN_HEIGHT * CARD_FOLD_RADIUS_RATIO],
      ),
    };
  });

  const animatedHeaderButtonOpacity = useAnimatedStyle(() => {
    return {
      opacity: buttonOpacity.value,
    };
  });

  const animatedWalletButtonOpacity = useAnimatedStyle(() => {
    return {
      opacity: walletButtonOpacity.value,
    };
  });

  const animatedWalletButtonArrowRotation = useAnimatedProps(() => {
    const spinIterpolation = interpolate(
      rotateArrowAnim.value,
      [0, 1],
      [270, 90],
    );
    return {
      transform: [{rotate: `${spinIterpolation}deg`}],
    };
  });

  const [preRendered, setPreRendered] = useState(false);

  useEffect(() => {
    if (preRendered) {
      if (isWalletsModalOpened || isTxDetailModalOpened) {
        buttonOpacity.value = withTiming(0, {duration: 150});
      } else {
        buttonOpacity.value = withDelay(150, withTiming(1, {duration: 250}));
      }

      if (isTxDetailModalOpened || activeTab === 3) {
        walletButtonOpacity.value = withTiming(0, {duration: 150});
      } else {
        walletButtonOpacity.value = withDelay(
          150,
          withTiming(1, {duration: 250}),
        );
      }
    } else {
      buttonOpacity.value = 0;
      walletButtonOpacity.value = 0;
    }
  }, [
    isWalletsModalOpened,
    isTxDetailModalOpened,
    buttonOpacity,
    walletButtonOpacity,
    preRendered,
    activeTab,
  ]);

  // Hide header buttons on unfocus so they can fade in on return.
  // Keep synced with useMainLayout's header button delay.
  useFocusEffect(
    React.useCallback(() => {
      const timeoutId = setTimeout(() => {
        setPreRendered(true);
      }, 60);
      return () => {
        clearTimeout(timeoutId);
        setPreRendered(false);
        buttonOpacity.value = 0;
        walletButtonOpacity.value = 0;
      };
    }, []),
  );

  return {
    mainSheetsTranslationY,
    mainSheetsTranslationYStart,
    walletButtonAnimDuration,
    rotateArrow,
    animatedChartOpacity,
    animatedTopContainerHeight,
    animatedHeaderButtonOpacity,
    animatedWalletButtonOpacity,
    animatedWalletButtonArrowRotation,
  };
}
