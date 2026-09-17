import React, {useMemo} from 'react';
import {StyleSheet} from 'react-native';
import {
  BackdropFilter,
  Canvas,
  Group,
  Image,
  ImageFilter,
  LinearGradient,
  Rect,
  RoundedRect,
  Skia,
  TileMode,
  vec,
} from '@shopify/react-native-skia';
import {SharedValue, useDerivedValue} from 'react-native-reanimated';

import {glassTabShader, makeGlassTabFilter} from './glassTabShader';
import {getCapsuleShadowImage} from './capsuleShadowImage';
import {
  BORDER_GRADIENT_COLORS,
  BORDER_GRADIENT_POSITIONS,
  OFFLINE_CARD_COLOR,
} from './LiquidGlassBackdrop';
import {SKIN_GRADIENT_COLORS, SKIN_GRADIENT_LOCATIONS} from './FoldedSkinView';
import {GLASS_TAB_CORNER_RADIUS} from './glassTabLayout';
import {GlassRect} from './glassSearchLayout';

// The search screen's filter pills, in one canvas over the page. A Skia
// BackdropFilter can only refract what was drawn before it in its own canvas,
// so the page's gradient card is redrawn here for the lens — and then, as
// GlassHeaderSurface does, everything outside the pills is cleared. The page
// the eye sees is the RN skin underneath: it lands on the first frame where a
// canvas paints late, which is what lets the search open over the wallet with
// no swap showing through.
//
// Same three layers the main screen's tab pills are made of
// (LiquidGlassBackdrop): a pre-blurred capsule shadow, the refracting glass,
// then the hairline rim and the active tint on top.
//
// The header's pills are NOT here: this canvas is the first child, under the
// search bar and the filter row, and an opened dropdown falls across both —
// its lens would end up beneath the views it covers. GlassHeaderSurface draws
// those on a canvas of its own, above the page.

// 1.0 = clear glass, lower = darker
const GLASS_DARKEN = 0.95;
const ACTIVE_TINT = 'rgba(6, 46, 111, 0.5)';
const SHADOW_COLOR = 'rgba(0, 0, 0, 0.07)';
const SHADOW_SIGMA = 4;
const SHADOW_DY = 2;
const RIM_WIDTH = 0.5;

interface Props {
  screenWidth: number;
  screenHeight: number;
  online: boolean;
  cardHeight: SharedValue<number>;
  filterRects: GlassRect[];
  activeFilterIndex: number;
  controlsOpacity: SharedValue<number>;
  lensActive: boolean;
}

const GlassSearchBackdrop: React.FC<Props> = props => {
  const {
    screenWidth,
    screenHeight,
    online,
    cardHeight,
    filterRects,
    activeFilterIndex,
    controlsOpacity,
    lensActive,
  } = props;

  const pillHeight = filterRects[0]?.height ?? 0;
  const cornerRadius = Math.min(GLASS_TAB_CORNER_RADIUS, pillHeight / 2);

  const shaderBuilder = useMemo(
    () => Skia.RuntimeShaderBuilder(glassTabShader),
    [],
  );
  const blurChild = useMemo(
    () => Skia.ImageFilter.MakeBlur(4, 4, TileMode.Clamp),
    [],
  );

  const glassFilter = useMemo(
    () =>
      makeGlassTabFilter(
        shaderBuilder,
        blurChild,
        filterRects.map(rect => [rect.x, rect.y, rect.width, rect.height]),
        cornerRadius,
        GLASS_DARKEN,
      ),
    [shaderBuilder, blurChild, filterRects, cornerRadius],
  );

  const pillsClip = useMemo(() => {
    const path = Skia.Path.Make();
    filterRects.forEach(rect => {
      path.addRRect(
        Skia.RRectXY(
          Skia.XYWHRect(rect.x, rect.y, rect.width, rect.height),
          cornerRadius,
          cornerRadius,
        ),
      );
    });
    return path;
  }, [filterRects, cornerRadius]);

  const shadow = getCapsuleShadowImage(
    Math.round(filterRects[0]?.width ?? 0),
    Math.round(pillHeight),
    Math.round(cornerRadius),
    SHADOW_SIGMA,
    SHADOW_COLOR,
  );
  const shadows = useMemo(
    () =>
      shadow
        ? filterRects.map((rect, i) => (
            <Image
              key={`shadow-${i}`}
              image={shadow.image}
              x={rect.x - shadow.pad}
              y={rect.y + SHADOW_DY - shadow.pad}
              width={rect.width + shadow.pad * 2}
              height={rect.height + shadow.pad * 2}
              fit="fill"
            />
          ))
        : null,
    [shadow, filterRects],
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

      <Group opacity={controlsOpacity}>{shadows}</Group>

      {lensActive ? (
        <BackdropFilter filter={<ImageFilter filter={glassFilter} />} />
      ) : null}

      <Group clip={pillsClip} invertClip>
        <Rect
          x={0}
          y={0}
          width={screenWidth}
          height={screenHeight}
          blendMode="clear"
        />
        <Group opacity={controlsOpacity}>{shadows}</Group>
      </Group>

      <Group opacity={controlsOpacity}>
        {filterRects.map((rect, i) => (
          <Group key={`accent-${i}`}>
            {i === activeFilterIndex ? (
              <RoundedRect
                x={rect.x}
                y={rect.y}
                width={rect.width}
                height={rect.height}
                r={cornerRadius}
                color={ACTIVE_TINT}
              />
            ) : null}
            <RoundedRect
              x={rect.x + RIM_WIDTH / 2}
              y={rect.y + RIM_WIDTH / 2}
              width={rect.width - RIM_WIDTH}
              height={rect.height - RIM_WIDTH}
              r={cornerRadius - RIM_WIDTH / 2}
              style="stroke"
              strokeWidth={RIM_WIDTH}>
              <LinearGradient
                start={vec(0, rect.y)}
                end={vec(0, rect.y + rect.height)}
                colors={BORDER_GRADIENT_COLORS}
                positions={BORDER_GRADIENT_POSITIONS}
              />
            </RoundedRect>
          </Group>
        ))}
      </Group>
    </Canvas>
  );
};

export default React.memo(GlassSearchBackdrop);
