import {useContext, useMemo} from 'react';
import {Platform, StyleSheet} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {ScreenSizeContext} from '../../context/screenSize';

// the gap to the screen's sides and bottom
export const GAP_RATIO = 0.05;

interface ContainerInset {
  // how far the container's bottom edge sits above the screen's
  bottom?: number;
  // how far the container's sides sit in from the screen's
  horizontal?: number;
}

// where a button pinned to the bottom of the screen sits, absolutely inside
// its container: the screen itself by default, or a container inset from the
// screen's edges, which then lands the button in the same spot
export const useFixedBottomStyle = ({
  bottom = 0,
  horizontal = 0,
}: ContainerInset = {}) => {
  const {width} = useContext(ScreenSizeContext);
  const insets = useSafeAreaInsets();
  // android draws edge to edge, under its navigation bar, so the bottom gap
  // runs from the top of the bar there; ios keeps it to the screen's edge
  const navigationBarHeight = Platform.OS === 'android' ? insets.bottom : 0;
  return useMemo(
    () => getStyles(width, navigationBarHeight, bottom, horizontal).bottom,
    [width, navigationBarHeight, bottom, horizontal],
  );
};

const getStyles = (
  screenWidth: number,
  navigationBarHeight: number,
  insetBottom: number,
  insetHorizontal: number,
) => {
  const gap = screenWidth * GAP_RATIO;
  return StyleSheet.create({
    bottom: {
      position: 'absolute',
      left: gap - insetHorizontal,
      right: gap - insetHorizontal,
      bottom: navigationBarHeight + gap - insetBottom,
    },
  });
};
