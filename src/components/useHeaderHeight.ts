import {useContext} from 'react';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {GLASS_HEADER_PILL_HEIGHT_RATIO} from './glassSearchLayout';
import {ScreenSizeContext} from '../context/screenSize';

// Width fraction
export const HEADER_CONTROLS_PADDING_RATIO = 0.03;

export const getHeaderRowHeight = (screenWidth: number, screenHeight: number) =>
  screenHeight * GLASS_HEADER_PILL_HEIGHT_RATIO +
  screenWidth * HEADER_CONTROLS_PADDING_RATIO * 2;

export const useHeaderHeight = () => {
  const {width, height} = useContext(ScreenSizeContext);
  const insets = useSafeAreaInsets();
  return insets.top + getHeaderRowHeight(width, height);
};
