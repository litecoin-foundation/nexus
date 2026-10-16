import React, {useMemo} from 'react';
import {Group, Paragraph, RoundedRect} from '@shopify/react-native-skia';
import type {SkTypefaceFontProvider} from '@shopify/react-native-skia';

import {GLASS_BUTTON_TINT} from '../Buttons/GlassButtonSurface';
import {buildFittedParagraph} from '../GlassBalanceGraphics';

// NOTE: BlueButtonV2's flat tint and bold white label without the glow, drawn in
// skia so it can sit inside the shop's expanded brand panel. Its corners
// follow the brand logo tile rather than a capsule. Being canvas content it
// takes no touches: hit-testing and the press scale belong to the caller.

interface Props {
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
  label: string;
  fontMgr: SkTypefaceFontProvider;
  screenHeight: number;
}

const GCBrandCardButtonV2: React.FC<Props> = props => {
  const {x, y, width, height, radius, label, fontMgr, screenHeight} = props;

  const paragraph = useMemo(
    () =>
      buildFittedParagraph(
        fontMgr,
        label,
        screenHeight * 0.018,
        700,
        '#FFFFFF',
        width,
        width - screenHeight * 0.025 * 2,
      ),
    [fontMgr, label, screenHeight, width],
  );

  return (
    <Group>
      <RoundedRect
        x={x}
        y={y}
        width={width}
        height={height}
        r={radius}
        color={GLASS_BUTTON_TINT}
      />
      <Paragraph
        paragraph={paragraph}
        x={x + (width - paragraph.getLongestLine()) / 2}
        y={y + (height - paragraph.getHeight()) / 2}
        width={width}
      />
    </Group>
  );
};

export default GCBrandCardButtonV2;
