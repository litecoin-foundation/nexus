import React, {useContext} from 'react';
import {StyleSheet, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {interpolateColor} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {
  GRADIENT_COLORS,
  GRADIENT_POSITIONS,
  GRADIENT_RY_RATIO,
} from './LiquidGlassBackdrop';
import {SHEET_BACKGROUND} from './GlassTxRows';
import {
  CARD_FOLD_RADIUS_RATIO,
  getFoldedTopHalfHeight,
} from '../animations/useNewMainAnims';
import {ScreenSizeContext} from '../context/screenSize';

// The Main screen's folded backdrop (gray page + gradient card) built
// from plain RN views — Skia canvases paint a few frames late and would
// flicker on first render. Used by the lock screen and the unlock
// reveal overlay.
//
// The vertical gradient is the radial backdrop's centre-line profile:
// each radial stop t maps to location 1 − t·RY_RATIO, and the top edge
// takes the colour at t = 1/RY_RATIO. Horizontal curvature is < 2%.
const T_TOP = 1 / GRADIENT_RY_RATIO;
// Stops mapped above the top edge collapse into the single t = T_TOP
// colour at location 0. Reversed for LinearGradient's ascending order.
const stopsBelowTopEdge = GRADIENT_POSITIONS.map((pos, i) => ({
  location: 1 - pos * GRADIENT_RY_RATIO,
  color: GRADIENT_COLORS[i],
}))
  .filter(s => s.location > 0)
  .reverse();
const SKIN_GRADIENT_COLORS = [
  interpolateColor(T_TOP, GRADIENT_POSITIONS, GRADIENT_COLORS),
  ...stopsBelowTopEdge.map(s => s.color),
];
const SKIN_GRADIENT_LOCATIONS = [0, ...stopsBelowTopEdge.map(s => s.location)];

interface Props {
  online: boolean;
}

const FoldedSkinView: React.FC<Props> = ({online}) => {
  const insets = useSafeAreaInsets();
  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);

  const topHalfHeight = getFoldedTopHalfHeight(SCREEN_HEIGHT, insets.top);
  const styles = getStyles(SCREEN_HEIGHT, topHalfHeight);

  return (
    <View style={styles.base} pointerEvents="none">
      {online ? (
        <View style={styles.card}>
          <LinearGradient
            style={styles.gradient}
            colors={SKIN_GRADIENT_COLORS}
            locations={SKIN_GRADIENT_LOCATIONS}
          />
        </View>
      ) : (
        <View style={[styles.card, styles.offlineCard]} />
      )}
    </View>
  );
};

const getStyles = (screenHeight: number, topHalfHeight: number) =>
  StyleSheet.create({
    base: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: SHEET_BACKGROUND,
    },
    card: {
      width: '100%',
      height: topHalfHeight,
      borderBottomLeftRadius: screenHeight * CARD_FOLD_RADIUS_RATIO,
      borderBottomRightRadius: screenHeight * CARD_FOLD_RADIUS_RATIO,
      overflow: 'hidden',
    },
    gradient: {
      flex: 1,
    },
    offlineCard: {
      backgroundColor: '#F36F56',
    },
  });

export default React.memo(FoldedSkinView);
