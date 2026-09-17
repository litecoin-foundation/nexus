import React, {useContext} from 'react';
import {StyleSheet, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  interpolateColor,
  SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {
  GRADIENT_COLORS,
  GRADIENT_POSITIONS,
  GRADIENT_RY_RATIO,
  OFFLINE_CARD_COLOR,
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
// reveal overlay, and as the search screen's page — where the card follows
// the list container's edge as the wallet's follows its sheet, so the
// gradient compresses and shifts darker with the rise, as a fold's does.
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
export const SKIN_GRADIENT_COLORS = [
  interpolateColor(T_TOP, GRADIENT_POSITIONS, GRADIENT_COLORS),
  ...stopsBelowTopEdge.map(s => s.color),
];
export const SKIN_GRADIENT_LOCATIONS = [
  0,
  ...stopsBelowTopEdge.map(s => s.location),
];

export interface SkinCard {
  height: number;
  radius: number;
}

interface Props {
  online: boolean;
  // The card following a moving edge (see getTopHalfCard); folded when left
  // out. Its height is laid out per frame, and the gradient with it.
  card?: SharedValue<SkinCard>;
}

const FoldedSkinView: React.FC<Props> = ({online, card}) => {
  const insets = useSafeAreaInsets();
  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);

  const styles = getStyles(
    getFoldedTopHalfHeight(SCREEN_HEIGHT, insets.top),
    SCREEN_HEIGHT * CARD_FOLD_RADIUS_RATIO,
  );

  const cardStyle = useAnimatedStyle(
    () =>
      card
        ? {
            height: card.value.height,
            borderBottomLeftRadius: card.value.radius,
            borderBottomRightRadius: card.value.radius,
          }
        : {},
    [card],
  );

  return (
    <View style={styles.base} pointerEvents="none">
      {online ? (
        <Animated.View style={[styles.card, cardStyle]}>
          <LinearGradient
            style={styles.gradient}
            colors={SKIN_GRADIENT_COLORS}
            locations={SKIN_GRADIENT_LOCATIONS}
          />
        </Animated.View>
      ) : (
        <Animated.View style={[styles.card, styles.offlineCard, cardStyle]} />
      )}
    </View>
  );
};

const getStyles = (cardHeight: number, cardRadius: number) =>
  StyleSheet.create({
    base: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: SHEET_BACKGROUND,
    },
    card: {
      width: '100%',
      height: cardHeight,
      borderBottomLeftRadius: cardRadius,
      borderBottomRightRadius: cardRadius,
      overflow: 'hidden',
    },
    gradient: {
      flex: 1,
    },
    offlineCard: {
      backgroundColor: OFFLINE_CARD_COLOR,
    },
  });

export default React.memo(FoldedSkinView);
