import React, {useContext, useEffect, useState} from 'react';
import {Pressable, StyleSheet} from 'react-native';
import {SvgXml} from 'react-native-svg';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {ScreenSizeContext} from '../../../context/screenSize';
import {getNewMainSheetPoints} from '../../../animations/useNewMainAnims';
import {
  FOLDED_SWAP_SLOT,
  getGlassTabLayouts,
  glassTabExpansionProgressAt,
  GLASS_TAB_BUTTON_HEIGHT_RATIO,
  GLASS_TAB_CORNER_RADIUS,
} from '../../../components/glassTabLayout';
import {swapInProgress} from '../adapter';

interface Props {
  onPress: () => void;
  mainSheetsTranslationY: SharedValue<number>;
  visible: boolean;
  folded: boolean;
}

const SWAP_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>`;

const SwapEntryRow: React.FC<Props> = ({
  onPress,
  mainSheetsTranslationY,
  visible,
  folded,
}) => {
  const insets = useSafeAreaInsets();
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const [active, setActive] = useState(false);
  const spin = useSharedValue(0);
  useEffect(() => {
    let live = true;
    const read = () => {
      const next = swapInProgress();
      if (live) {
        setActive(next);
      }
    };
    read();
    const id = setInterval(read, 2000);
    return () => {
      live = false;
      clearInterval(id);
    };
  }, []);
  useEffect(() => {
    spin.value = active
      ? withRepeat(
          withTiming(1, {duration: 1400, easing: Easing.linear}),
          -1,
          false,
        )
      : 0;
  }, [active, spin]);
  const iconSpin = useAnimatedStyle(() => ({
    transform: [{rotate: `${spin.value * 360}deg`}],
  }));
  const buttonHeight = SCREEN_HEIGHT * GLASS_TAB_BUTTON_HEIGHT_RATIO;
  const iconSize = SCREEN_HEIGHT * 0.022;
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT, buttonHeight);

  const {UNFOLD_SHEET_POINT, FOLD_SHEET_POINT} = getNewMainSheetPoints(
    SCREEN_HEIGHT,
    insets.top,
  );
  const layout = getGlassTabLayouts(SCREEN_WIDTH, SCREEN_HEIGHT, insets.top)[0];

  const animatedStyle = useAnimatedStyle(() => {
    const expansion = glassTabExpansionProgressAt(
      mainSheetsTranslationY.value,
      UNFOLD_SHEET_POINT,
      FOLD_SHEET_POINT,
    );
    const buttonTop =
      mainSheetsTranslationY.value +
      interpolate(
        expansion,
        [0, 1],
        [layout.folded.topOffset, layout.unfolded.topOffset],
      );
    return {
      top: buttonTop,
      opacity: visible
        ? interpolate(expansion, [0, 0.35], [1, 0], Extrapolation.CLAMP)
        : 0,
    };
  });

  return (
    <Animated.View
      pointerEvents={visible && folded ? 'box-none' : 'none'}
      style={[styles.host, animatedStyle]}>
      <Pressable
        testID="mbsx-sheet-entry"
        accessibilityRole="button"
        accessibilityLabel={active ? 'Swap, in progress' : 'Swap'}
        accessibilityState={{busy: active}}
        onPress={onPress}
        style={({pressed}) => [styles.pill, pressed ? styles.pressed : null]}>
        <Animated.View style={iconSpin}>
          <SvgXml xml={SWAP_ICON} width={iconSize} height={iconSize} />
        </Animated.View>
        <Animated.Text style={styles.label} numberOfLines={1}>
          Swap
        </Animated.Text>
      </Pressable>
    </Animated.View>
  );
};

const getStyles = (
  screenWidth: number,
  screenHeight: number,
  buttonHeight: number,
) =>
  StyleSheet.create({
    host: {
      position: 'absolute',
      left: screenWidth * FOLDED_SWAP_SLOT.left,
      width: screenWidth * FOLDED_SWAP_SLOT.width,
      height: buttonHeight,
      zIndex: 3,
    },
    pill: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: screenWidth * 0.03,
      gap: screenWidth * 0.012,
      borderRadius: Math.min(GLASS_TAB_CORNER_RADIUS, buttonHeight / 2),
      backgroundColor: 'transparent',
    },
    pressed: {
      opacity: 0.7,
    },
    label: {
      flexShrink: 1,
      fontFamily: 'Satoshi Variable',
      fontWeight: '500',
      color: '#ffffff',
      fontSize: screenHeight * 0.013,
    },
  });

export default SwapEntryRow;
