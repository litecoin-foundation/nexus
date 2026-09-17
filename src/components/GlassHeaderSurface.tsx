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

// The header's two pills, on a canvas of their own ABOVE the page content.
//
// They cannot ride the screen's backdrop canvas: that one has to be the first
// child, under the search bar and the filter row, and an opened dropdown
// falls across both — its lens would be painted beneath the very views it
// covers. So this canvas is drawn last instead, and erases everything outside
// the pills so only they float over the page.
//
// It redraws the page's gradient card because a BackdropFilter refracts what
// precedes it in its OWN canvas and nothing else. Behind the header that is
// exactly what the screen shows anyway; where an opened dropdown overhangs
// the content, the lens refracts gradient rather than the search bar beneath
// it. Sampling live RN views is not something Skia can do at all, so that is
// the floor.

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
  dropdownHeight: SharedValue<number>;
}

const GlassHeaderSurface: React.FC<Props> = props => {
  const {screenWidth, screenHeight, online, cardHeight, rects, dropdownHeight} =
    props;

  const radius = rects.back.height / 2;

  const shaderBuilder = useMemo(
    () => Skia.RuntimeShaderBuilder(glassTabShader),
    [],
  );
  const blurChild = useMemo(
    () => Skia.ImageFilter.MakeBlur(4, 4, TileMode.Clamp),
    [],
  );

  const glassFilter = useDerivedValue(() => {
    const {back, dropdown} = rects;
    return makeGlassTabFilter(
      shaderBuilder,
      blurChild,
      [
        [back.x, back.y, back.width, back.height],
        [dropdown.x, dropdown.y, dropdown.width, dropdownHeight.value],
      ],
      radius,
      HEADER_GLASS_DARKEN,
    );
  });

  const pillsClip = useDerivedValue(() => {
    const {back, dropdown} = rects;
    const path = Skia.Path.Make();
    path.addRRect(
      Skia.RRectXY(
        Skia.XYWHRect(back.x, back.y, back.width, back.height),
        radius,
        radius,
      ),
    );
    path.addRRect(
      Skia.RRectXY(
        Skia.XYWHRect(
          dropdown.x,
          dropdown.y,
          dropdown.width,
          dropdownHeight.value,
        ),
        radius,
        radius,
      ),
    );
    return path;
  });

  const dropdownRimHeight = useDerivedValue(
    () => dropdownHeight.value - RIM_WIDTH,
  );
  const dropdownRimEnd = useDerivedValue(() =>
    vec(0, rects.dropdown.y + dropdownHeight.value),
  );

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

      <RoundedRect
        x={rects.back.x + RIM_WIDTH / 2}
        y={rects.back.y + RIM_WIDTH / 2}
        width={rects.back.width - RIM_WIDTH}
        height={rects.back.height - RIM_WIDTH}
        r={radius - RIM_WIDTH / 2}
        style="stroke"
        strokeWidth={RIM_WIDTH}>
        <LinearGradient
          start={vec(0, rects.back.y)}
          end={vec(0, rects.back.y + rects.back.height)}
          colors={BORDER_GRADIENT_COLORS}
          positions={BORDER_GRADIENT_POSITIONS}
        />
      </RoundedRect>
      <RoundedRect
        x={rects.dropdown.x + RIM_WIDTH / 2}
        y={rects.dropdown.y + RIM_WIDTH / 2}
        width={rects.dropdown.width - RIM_WIDTH}
        height={dropdownRimHeight}
        r={radius - RIM_WIDTH / 2}
        style="stroke"
        strokeWidth={RIM_WIDTH}>
        <LinearGradient
          start={vec(0, rects.dropdown.y)}
          end={dropdownRimEnd}
          colors={BORDER_GRADIENT_COLORS}
          positions={BORDER_GRADIENT_POSITIONS}
        />
      </RoundedRect>
    </Canvas>
  );
};

export default React.memo(GlassHeaderSurface);
