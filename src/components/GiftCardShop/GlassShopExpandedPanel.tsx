import React, {useContext, useMemo} from 'react';
import {
  Circle,
  Group,
  Line,
  Paragraph,
  Rect,
  RoundedRect,
  vec,
} from '@shopify/react-native-skia';
import type {SharedValue} from 'react-native-reanimated';
import {useDerivedValue} from 'react-native-reanimated';

import GlassButtonSurface, {
  GLASS_BUTTON_TINT,
} from '../Buttons/GlassButtonSurface';
import {buildFittedParagraph, useSatoshiFontMgr} from '../GlassBalanceGraphics';
import {MUTED_TEXT, ROW_BORDER, SHEET_BACKGROUND} from '../GlassTxRows';
import {getShopRowLayout, SHOP_EXPAND_BOTTOM_RATIO} from './GlassShopRows';
import {ScreenSizeContext} from '../../context/screenSize';

// The expanded row panel is a declarative overlay the canvas reveals with an
// animated clip while the rows below slide — the skia list itself never
// changes, so opening and closing costs no re-record at all. Drawn in
// panel-local coordinates: the origin is the tapped row's bottom edge.

export interface ShopExpandedPanelData {
  id: string;
  kind: 'brand' | 'giftcard';
  // content y of the panel top and its full height
  splitY: number;
  extras: number;
  // chevron center, as a lift above splitY
  chevronLift: number;
  symbol: string;
  chipValues: number[];
  chipLabels: string[];
  selected: number;
  ctaLabel: string;
  code: string;
}

export const useShopExpandedPanel = (
  panel: ShopExpandedPanelData | null,
  ctaPressScale: SharedValue<number>,
): {panelNode: React.ReactNode; chevronNode: React.ReactNode} => {
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const fontMgr = useSatoshiFontMgr();

  const ctaTransform = useDerivedValue(() => [{scale: ctaPressScale.value}]);

  const panelNode = useMemo(() => {
    if (!panel || !fontMgr) {
      return null;
    }
    const layout = getShopRowLayout(SCREEN_WIDTH, SCREEN_HEIGHT);
    const inset = layout.pad + layout.panelPadH;
    const panelTop = layout.panelTopGap;
    const panelHeight =
      panel.extras - panelTop - SCREEN_HEIGHT * SHOP_EXPAND_BOTTOM_RATIO;
    const rowTop = panelTop + layout.panelPad;

    // the glass capsule cta, shared by the brand and redeem variants
    const glassCta = (label: string, y: number, height: number) => {
      const ctaWidth = SCREEN_WIDTH - inset * 2;
      const cta = buildFittedParagraph(
        fontMgr,
        label,
        SCREEN_HEIGHT * 0.015,
        700,
        '#FFFFFF',
        ctaWidth,
        ctaWidth - layout.pad,
      );
      return (
        <Group
          key="cta"
          origin={vec(inset + ctaWidth / 2, y + height / 2)}
          transform={ctaTransform}>
          <GlassButtonSurface
            x={inset}
            y={y}
            width={ctaWidth}
            height={height}
          />
          <Paragraph
            paragraph={cta}
            x={inset + (ctaWidth - cta.getLongestLine()) / 2}
            y={y + (height - cta.getHeight()) / 2}
            width={ctaWidth}
          />
        </Group>
      );
    };

    const children: React.ReactNode[] = [
      // the panel region continues the row's white card, with the thin
      // inset grey panel floating inside it
      <Rect
        key="rowBg"
        x={0}
        y={0}
        width={SCREEN_WIDTH}
        height={panel.extras}
        color="#ffffff"
      />,
      <Rect
        key="rowBorder"
        x={0}
        y={panel.extras - 1}
        width={SCREEN_WIDTH}
        height={1}
        color={ROW_BORDER}
      />,
      <RoundedRect
        key="panel"
        x={layout.pad}
        y={panelTop}
        width={SCREEN_WIDTH - layout.pad * 2}
        height={panelHeight}
        r={SCREEN_HEIGHT * 0.016}
        color={SHEET_BACKGROUND}
      />,
    ];

    if (panel.kind === 'brand') {
      const count = panel.chipLabels.length;
      const chipHeight = layout.chipHeight - SCREEN_HEIGHT * 0.008;
      const chipWidth =
        (SCREEN_WIDTH - inset * 2 - layout.chipGap * (count - 1)) / count;
      panel.chipLabels.forEach((label, i) => {
        const chipX = inset + i * (chipWidth + layout.chipGap);
        const selected = i === panel.selected;
        const paragraph = buildFittedParagraph(
          fontMgr,
          label,
          SCREEN_HEIGHT * 0.015,
          700,
          selected ? '#FFFFFF' : '#484859',
          chipWidth,
          chipWidth - 8,
        );
        children.push(
          <Group key={`chip-${i}`}>
            <RoundedRect
              x={chipX}
              y={rowTop}
              width={chipWidth}
              height={chipHeight}
              r={chipHeight / 2}
              color={selected ? GLASS_BUTTON_TINT : '#ffffff'}
            />
            {!selected ? (
              <RoundedRect
                x={chipX + 0.5}
                y={rowTop + 0.5}
                width={chipWidth - 1}
                height={chipHeight - 1}
                r={(chipHeight - 1) / 2}
                style="stroke"
                strokeWidth={1}
                color="rgba(214, 216, 218, 0.8)"
              />
            ) : null}
            <Paragraph
              paragraph={paragraph}
              x={chipX + (chipWidth - paragraph.getLongestLine()) / 2}
              y={rowTop + (chipHeight - paragraph.getHeight()) / 2}
              width={chipWidth}
            />
          </Group>,
        );
      });

      children.push(
        glassCta(
          panel.ctaLabel,
          rowTop + layout.chipHeight + layout.expandGap,
          layout.ctaHeight,
        ),
      );
    } else if (panel.code) {
      const code = buildFittedParagraph(
        fontMgr,
        panel.code,
        SCREEN_HEIGHT * 0.015,
        500,
        '#FFFFFF',
        SCREEN_WIDTH - inset * 2,
        SCREEN_WIDTH - inset * 2 - SCREEN_WIDTH * 0.08,
      );
      const pillWidth = Math.min(
        code.getLongestLine() + SCREEN_WIDTH * 0.08,
        SCREEN_WIDTH - inset * 2,
      );
      children.push(
        <Group key="code">
          <RoundedRect
            x={inset}
            y={rowTop}
            width={pillWidth}
            height={layout.codeRowHeight}
            r={SCREEN_HEIGHT * 0.012}
            color="#212124"
          />
          <Paragraph
            paragraph={code}
            x={inset + (pillWidth - code.getLongestLine()) / 2}
            y={rowTop + (layout.codeRowHeight - code.getHeight()) / 2}
            width={pillWidth}
          />
        </Group>,
      );
      const hint = buildFittedParagraph(
        fontMgr,
        'Tap to copy',
        SCREEN_HEIGHT * 0.012,
        700,
        MUTED_TEXT,
        SCREEN_WIDTH,
        SCREEN_WIDTH * 0.3,
      );
      children.push(
        <Paragraph
          key="hint"
          paragraph={hint}
          x={inset + pillWidth + SCREEN_WIDTH * 0.03}
          y={rowTop + (layout.codeRowHeight - hint.getHeight()) / 2}
          width={SCREEN_WIDTH * 0.3}
        />,
      );
    } else if (panel.ctaLabel) {
      children.push(glassCta(panel.ctaLabel, rowTop, layout.codeRowHeight));
    }

    return <Group>{children}</Group>;
  }, [panel, fontMgr, SCREEN_WIDTH, SCREEN_HEIGHT, ctaTransform]);

  // covers the static chevron of the tapped row; the canvas spins it with
  // the unfold progress. Drawn centered at the origin, pointing down.
  const chevronNode = useMemo(() => {
    if (!panel) {
      return null;
    }
    const layout = getShopRowLayout(SCREEN_WIDTH, SCREEN_HEIGHT);
    const s = layout.chevronSize;
    return (
      <Group>
        <Circle cx={0} cy={0} r={s * 1.4} color="#ffffff" />
        <Line
          p1={vec(-s / 2, -s / 4)}
          p2={vec(0, s / 4)}
          color="#A6ACB5"
          strokeWidth={SCREEN_HEIGHT * 0.0022}
          strokeCap="round"
        />
        <Line
          p1={vec(0, s / 4)}
          p2={vec(s / 2, -s / 4)}
          color="#A6ACB5"
          strokeWidth={SCREEN_HEIGHT * 0.0022}
          strokeCap="round"
        />
      </Group>
    );
  }, [panel, SCREEN_WIDTH, SCREEN_HEIGHT]);

  return {panelNode, chevronNode};
};
