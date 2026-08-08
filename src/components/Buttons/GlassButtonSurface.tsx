import React from 'react';
import {
  Group,
  Image,
  LinearGradient,
  RoundedRect,
  vec,
} from '@shopify/react-native-skia';

import {getCapsuleShadowImage} from '../capsuleShadowImage';

// liquid glass blue capsule, measured off the SendBtn artboard in Nexus V2:
// an opaque tint sitting half a point proud of the box, a bright rim that
// pinches out where the cap normals turn horizontal, a soft sheen bleeding in
// off the flat edges, and a darker contour on the caps

export const GLASS_BUTTON_TINT = '#1162E6';

// hairlines, so they stay crisp at any button size; the rim pair is shared
// with the imperative capsule in ShopSkiaRows
const TINT_OUTSET = 0.5;
export const RIM_BAND = 1;
export const RIM_EDGE = 0.5;
const SIDE_EDGE = 0.5;

export const RIM_BAND_ALPHA = 0.165;
export const RIM_EDGE_ALPHA = 0.16;
const SHEEN_ALPHA = 0.024;
const SHEEN_DEPTH_RATIO = 0.17;
const SIDE_EDGE_ALPHA = 0.1;
const SIDE_ALPHA = 0.022;
const SIDE_MID_ALPHA = 0.008;
const SIDE_MID_RATIO = 0.07;
const SIDE_DEPTH_RATIO = 0.15;

const SHADOW_SIGMA = 6;
const SHADOW_DY = 6;
const SHADOW_COLOR = 'rgba(0, 0, 0, 0.04)';

const white = (a: number) => `rgba(255, 255, 255, ${a})`;
const black = (a: number) => `rgba(0, 0, 0, ${a})`;

interface Props {
  x: number;
  y: number;
  width: number;
  height: number;
}

const GlassButtonSurface: React.FC<Props> = ({x, y, width, height}) => {
  const r = height / 2;
  const tintX = x - TINT_OUTSET;
  const tintY = y - TINT_OUTSET;
  const tintWidth = width + TINT_OUTSET * 2;
  const tintHeight = height + TINT_OUTSET * 2;

  // gradient stops are fractions of the run they are drawn across
  const acrossTint = (pt: number) => pt / tintWidth;
  const downBox = (pt: number) => pt / height;
  const sideDepth = height * SIDE_DEPTH_RATIO;
  const sideMid = height * SIDE_MID_RATIO;
  const sheenDepth = height * SHEEN_DEPTH_RATIO;

  // one cached image per button size instead of a per-frame mask blur
  const shadow = getCapsuleShadowImage(
    Math.round(width),
    Math.round(height),
    Math.round(height) / 2,
    SHADOW_SIGMA,
    SHADOW_COLOR,
  );

  return (
    <Group>
      {shadow ? (
        <Image
          image={shadow.image}
          x={x - shadow.pad}
          y={y + SHADOW_DY - shadow.pad}
          width={width + shadow.pad * 2}
          height={height + shadow.pad * 2}
          fit="fill"
        />
      ) : null}

      <RoundedRect
        x={tintX}
        y={tintY}
        width={tintWidth}
        height={tintHeight}
        r={r + TINT_OUTSET}
        color={GLASS_BUTTON_TINT}
      />

      {/* caps fall off toward the ends, with a contour on the edge itself */}
      <RoundedRect
        x={tintX}
        y={tintY}
        width={tintWidth}
        height={tintHeight}
        r={r + TINT_OUTSET}>
        <LinearGradient
          start={vec(tintX, 0)}
          end={vec(tintX + tintWidth, 0)}
          positions={[
            0,
            acrossTint(SIDE_EDGE),
            acrossTint(sideMid),
            acrossTint(sideDepth),
            1 - acrossTint(sideDepth),
            1 - acrossTint(sideMid),
            1 - acrossTint(SIDE_EDGE),
            1,
          ]}
          colors={[
            black(SIDE_EDGE_ALPHA),
            black(SIDE_ALPHA),
            black(SIDE_MID_ALPHA),
            black(0),
            black(0),
            black(SIDE_MID_ALPHA),
            black(SIDE_ALPHA),
            black(SIDE_EDGE_ALPHA),
          ]}
        />
      </RoundedRect>

      {/* sheen bleeding in off the flat top and bottom */}
      <RoundedRect
        x={x}
        y={y}
        width={width}
        height={height}
        r={r}
        blendMode="plus">
        <LinearGradient
          start={vec(0, y)}
          end={vec(0, y + height)}
          positions={[0, downBox(sheenDepth), 1 - downBox(sheenDepth), 1]}
          colors={[white(SHEEN_ALPHA), white(0), white(0), white(SHEEN_ALPHA)]}
        />
      </RoundedRect>

      {/* rim, brightest along the flat edges and gone at the cap equator */}
      <RoundedRect
        x={x + RIM_BAND / 2}
        y={y + RIM_BAND / 2}
        width={width - RIM_BAND}
        height={height - RIM_BAND}
        r={r - RIM_BAND / 2}
        style="stroke"
        strokeWidth={RIM_BAND}
        blendMode="plus">
        <LinearGradient
          start={vec(0, y)}
          end={vec(0, y + height)}
          colors={[white(RIM_BAND_ALPHA), white(0), white(RIM_BAND_ALPHA)]}
        />
      </RoundedRect>
      <RoundedRect
        x={x + RIM_EDGE / 2}
        y={y + RIM_EDGE / 2}
        width={width - RIM_EDGE}
        height={height - RIM_EDGE}
        r={r - RIM_EDGE / 2}
        style="stroke"
        strokeWidth={RIM_EDGE}
        blendMode="plus">
        <LinearGradient
          start={vec(0, y)}
          end={vec(0, y + height)}
          colors={[white(RIM_EDGE_ALPHA), white(0), white(RIM_EDGE_ALPHA)]}
        />
      </RoundedRect>
    </Group>
  );
};

export default GlassButtonSurface;
