import React, {useEffect, useContext, useState} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {
  interpolate,
  interpolateColor,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAppSelector} from '../store/hooks';

import {ScreenSizeContext} from '../context/screenSize';

interface Props {
  isWalletsModalOpened: boolean;
  isTxDetailModalOpened: boolean;
}

export function useMainAnims(props: Props) {
  const {isWalletsModalOpened, isTxDetailModalOpened} = props;
  const insets = useSafeAreaInsets();
  const isInternetReachable = useAppSelector(
    state => state.info.isInternetReachable,
  );

  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);

  const OFFSET_HEADER_DIFF = insets.top - SCREEN_HEIGHT * 0.07;
  const OPEN_SNAP_POINT = SCREEN_HEIGHT * 0.24 + OFFSET_HEADER_DIFF;
  const CLOSED_SNAP_POINT = SCREEN_HEIGHT * 0.47 + OFFSET_HEADER_DIFF;

  const mainSheetsTranslationY = useSharedValue(CLOSED_SNAP_POINT);
  const mainSheetsTranslationYStart = useSharedValue(CLOSED_SNAP_POINT);
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
        [OPEN_SNAP_POINT, CLOSED_SNAP_POINT],
        [0, 1],
      ),
    };
  });

  const animatedTopContainerBackground = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(
        mainSheetsTranslationY.value,
        [OPEN_SNAP_POINT, CLOSED_SNAP_POINT],
        [isInternetReachable ? '#1162E6' : '#F36F56', '#f7f7f7'],
      ),
    };
  });

  const animatedTopContainerHeight = useAnimatedProps(() => {
    return {
      height: mainSheetsTranslationY.value,
      borderBottomLeftRadius: interpolate(
        mainSheetsTranslationY.value,
        [OPEN_SNAP_POINT, CLOSED_SNAP_POINT],
        [0, SCREEN_HEIGHT * 0.05],
      ),
      borderBottomRightRadius: interpolate(
        mainSheetsTranslationY.value,
        [OPEN_SNAP_POINT, CLOSED_SNAP_POINT],
        [1, SCREEN_HEIGHT * 0.05],
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

      if (isTxDetailModalOpened) {
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
  ]);

  // NOTE: make header buttons invisible on unfocus so when you go back to
  // the main screen they fade in smoothly, timeout should be always synced
  // with the useMainLayout timeout that rerenders these header buttons
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
    animatedTopContainerBackground,
    animatedTopContainerHeight,
    animatedHeaderButtonOpacity,
    animatedWalletButtonOpacity,
    animatedWalletButtonArrowRotation,
  };
}
