import React, {useMemo} from 'react';
import {StyleSheet} from 'react-native';
import {SharedValue, useDerivedValue} from 'react-native-reanimated';
import {
  BackdropFilter,
  Canvas,
  Group,
  ImageFilter,
  LinearGradient,
  Rect,
  RoundedRect,
  Skia,
  TileMode,
  vec,
} from '@shopify/react-native-skia';

import {glassTabShader, makeGlassTabFilter} from './glassTabShader';
import {
  BORDER_GRADIENT_COLORS,
  BORDER_GRADIENT_POSITIONS,
  OFFLINE_CARD_COLOR,
} from './LiquidGlassBackdrop';
import {SKIN_GRADIENT_COLORS, SKIN_GRADIENT_LOCATIONS} from './FoldedSkinView';
import {GlassHeaderRects} from './glassSearchLayout';

// The header's two pills, the back button and the private toggle, on a canvas
// of their own ABOVE the page content, which erases everything outside the
// pills so only they float over the page.
//
// It redraws the page's gradient card because a BackdropFilter refracts what
// precedes it in its OWN canvas and nothing else. Behind the header that is
// exactly what the screen shows anyway.

// Heavier than the filter row's 0.86: the header sits high on the gradient,
// where the backdrop is at its lightest, and a thin pour there reads as a
// pale chip rather than as glass.
const HEADER_GLASS_DARKEN = 1;
const RIM_WIDTH = 0.5;

interface Props {
  screenWidth: number;
  screenHeight: number;
  online: boolean;
  // The page's gradient card runs to here, and moves with the hand-off; the
  // pills sit well inside it.
  cardHeight: SharedValue<number>;
  rects: GlassHeaderRects;
}

const GlassHeaderSurface: React.FC<Props> = props => {
  const {screenWidth, screenHeight, online, cardHeight, rects} = props;

  const radius = rects.back.height / 2;

  const shaderBuilder = useMemo(
    () => Skia.RuntimeShaderBuilder(glassTabShader),
    [],
  );
  const blurChild = useMemo(
    () => Skia.ImageFilter.MakeBlur(4, 4, TileMode.Clamp),
    [],
  );

  const pills = useMemo(() => [rects.back, rects.dropdown], [rects]);

  const glassFilter = useDerivedValue(() =>
    makeGlassTabFilter(
      shaderBuilder,
      blurChild,
      pills.map(pill => [pill.x, pill.y, pill.width, pill.height]),
      radius,
      HEADER_GLASS_DARKEN,
    ),
  );

  const pillsClip = useDerivedValue(() => {
    const path = Skia.Path.Make();
    for (const pill of pills) {
      path.addRRect(
        Skia.RRectXY(
          Skia.XYWHRect(pill.x, pill.y, pill.width, pill.height),
          radius,
          radius,
        ),
      );
    }
    return path;
  });

  const gradientEnd = useDerivedValue(() => vec(0, cardHeight.value));

  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      {online ? (
        <Rect x={0} y={0} width={screenWidth} height={screenHeight}>
          <LinearGradient
            start={vec(0, 0)}
            end={gradientEnd}
            colors={SKIN_GRADIENT_COLORS}
            positions={SKIN_GRADIENT_LOCATIONS}
          />
        </Rect>
      ) : (
        <Rect
          x={0}
          y={0}
          width={screenWidth}
          height={screenHeight}
          color={OFFLINE_CARD_COLOR}
        />
      )}

      <BackdropFilter filter={<ImageFilter filter={glassFilter} />} />

      <Group clip={pillsClip} invertClip>
        <Rect
          x={0}
          y={0}
          width={screenWidth}
          height={screenHeight}
          blendMode="clear"
        />
      </Group>

      {pills.map(pill => (
        <RoundedRect
          key={pill.x}
          x={pill.x + RIM_WIDTH / 2}
          y={pill.y + RIM_WIDTH / 2}
          width={pill.width - RIM_WIDTH}
          height={pill.height - RIM_WIDTH}
          r={radius - RIM_WIDTH / 2}
          style="stroke"
          strokeWidth={RIM_WIDTH}>
          <LinearGradient
            start={vec(0, pill.y)}
            end={vec(0, pill.y + pill.height)}
            colors={BORDER_GRADIENT_COLORS}
            positions={BORDER_GRADIENT_POSITIONS}
          />
        </RoundedRect>
      ))}
    </Canvas>
  );
};

export default React.memo(GlassHeaderSurface);
