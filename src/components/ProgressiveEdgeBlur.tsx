import React, {useMemo} from 'react';
import type {ReactNode} from 'react';
import {
  Blur,
  ColorMatrix,
  Group,
  LinearGradient,
  Paint,
  Rect,
  Skia,
  vec,
} from '@shopify/react-native-skia';

// Adapted from react-native-edge-fade's native blur pipeline (MIT): render
// independent Gaussian levels, then mask each result after it has been blurred.
// https://github.com/AmatoGiulio/react-native-edge-fade
const LEVEL_FRACTIONS = [0.35, 0.65, 1] as const;
const LEVEL_BOUNDS = [0.35, 0.65, 1] as const;
const MASK_STOP_COUNT = 32;

const FROST_SATURATION = 0.9;
const FROST_LIFT = 1.03;
const LUMA_RED = 0.2126;
const LUMA_GREEN = 0.7152;
const LUMA_BLUE = 0.0722;

const FROST_COLOR_MATRIX = (() => {
  const inverseSaturation = 1 - FROST_SATURATION;
  const red = LUMA_RED * inverseSaturation;
  const green = LUMA_GREEN * inverseSaturation;
  const blue = LUMA_BLUE * inverseSaturation;

  return [
    (red + FROST_SATURATION) * FROST_LIFT,
    green * FROST_LIFT,
    blue * FROST_LIFT,
    0,
    0,
    red * FROST_LIFT,
    (green + FROST_SATURATION) * FROST_LIFT,
    blue * FROST_LIFT,
    0,
    0,
    red * FROST_LIFT,
    green * FROST_LIFT,
    (blue + FROST_SATURATION) * FROST_LIFT,
    0,
    0,
    0,
    0,
    0,
    1,
    0,
  ];
})();

const MASK_POSITIONS = Array.from(
  {length: MASK_STOP_COUNT},
  (_, index) => index / (MASK_STOP_COUNT - 1),
);

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

const smootherstep = (value: number) =>
  value * value * value * (value * (value * 6 - 15) + 10);

const buildLevelMask = (level: number) => {
  const lowerBound = level === 0 ? 0 : LEVEL_BOUNDS[level - 1];
  const upperBound = LEVEL_BOUNDS[level];
  const range = upperBound - lowerBound;

  return MASK_POSITIONS.map(position => {
    // Zero slope at both ends keeps the first blur level from appearing
    // abruptly and lets the strength build continuously toward the edge.
    const presence = smootherstep(position);
    const progress = clamp01((presence - lowerBound) / range);
    const weight =
      level === 0 ? progress : progress * progress * (3 - 2 * progress);

    return `rgba(255, 255, 255, ${weight})`;
  });
};

const LEVEL_MASKS = LEVEL_FRACTIONS.map((_, level) => buildLevelMask(level));

interface Props {
  children?: ReactNode;
  width: number;
  canvasHeight: number;
  blurHeight: number;
  maxBlur: number;
  backgroundColor: string;
}

const ProgressiveEdgeBlur: React.FC<Props> = props => {
  const {children, width, canvasHeight, blurHeight, maxBlur, backgroundColor} =
    props;
  const maskStart = useMemo(
    () => vec(0, canvasHeight - blurHeight),
    [blurHeight, canvasHeight],
  );
  const maskEnd = useMemo(() => vec(0, canvasHeight), [canvasHeight]);

  const source = (
    <>
      {/* An opaque source prevents dark premultiplied-alpha blur fringes. */}
      <Rect
        x={0}
        y={0}
        width={width}
        height={canvasHeight}
        color={backgroundColor}
      />
      {children}
    </>
  );

  return (
    <>
      {source}
      {LEVEL_FRACTIONS.map((fraction, level) => {
        // The mask weight is zero above the gradient start, so clipping the
        // level there (plus 3σ of blur sampling margin) renders identically
        // while the layers and blurs process ~35% less area per frame.
        const clipTop = Math.max(
          0,
          canvasHeight - blurHeight - maxBlur * fraction * 3,
        );
        return (
          <Group
            key={fraction}
            clip={Skia.XYWHRect(0, clipTop, width, canvasHeight - clipTop)}>
            <Group layer>
              <Group
                layer={
                  <Paint>
                    <Blur blur={maxBlur * fraction} mode="mirror" />
                    <ColorMatrix matrix={FROST_COLOR_MATRIX} />
                  </Paint>
                }>
                {source}
              </Group>
              <Rect
                x={0}
                y={0}
                width={width}
                height={canvasHeight}
                blendMode="dstIn"
                dither>
                <LinearGradient
                  start={maskStart}
                  end={maskEnd}
                  colors={LEVEL_MASKS[level]}
                  positions={MASK_POSITIONS}
                  mode="clamp"
                />
              </Rect>
            </Group>
          </Group>
        );
      })}
    </>
  );
};

export default ProgressiveEdgeBlur;
