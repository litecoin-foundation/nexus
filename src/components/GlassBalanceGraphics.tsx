import React, {useEffect, useMemo, useState} from 'react';
import {Image} from 'react-native';
import {
  Circle,
  Group,
  Paragraph,
  Path,
  RoundedRect,
  Skia,
} from '@shopify/react-native-skia';
import type {
  SkParagraph,
  SkTypeface,
  SkTypefaceFontProvider,
  TextAlign,
} from '@shopify/react-native-skia';
import {SharedValue} from 'react-native-reanimated';
import {useTranslation} from 'react-i18next';
import {useSelector} from 'react-redux';

export const FONT_FAMILY = 'Satoshi Variable';

const SATOSHI_FONT_MODULES = [
  require('../fonts/Satoshi-Regular.ttf'),
  require('../fonts/Satoshi-Medium.ttf'),
  require('../fonts/Satoshi-Bold.ttf'),
];

// decode the typefaces once and share one provider, skia's useFonts
// re-decodes on every mount
let cachedFontMgr: SkTypefaceFontProvider | null = null;
let cachedFontMgrLoad: Promise<SkTypefaceFontProvider | null> | null = null;

const loadCachedFontMgr = () => {
  cachedFontMgrLoad ??= Promise.all(
    SATOSHI_FONT_MODULES.map(fontModule =>
      Skia.Data.fromURI(Image.resolveAssetSource(fontModule).uri).then(data =>
        Skia.Typeface.MakeFreeTypeFaceFromData(data),
      ),
    ),
  )
    .then(typefaces => {
      const loaded = typefaces.filter(
        (typeface): typeface is SkTypeface => typeface !== null,
      );
      if (loaded.length !== SATOSHI_FONT_MODULES.length) {
        // failed decode, retry on the next mount
        cachedFontMgrLoad = null;
        return null;
      }
      const fontMgr = Skia.TypefaceFontProvider.Make();
      loaded.forEach(typeface => {
        fontMgr.registerFont(typeface, FONT_FAMILY);
      });
      cachedFontMgr = fontMgr;
      return fontMgr;
    })
    .catch(() => {
      cachedFontMgrLoad = null;
      return null;
    });
  return cachedFontMgrLoad;
};

export const useSatoshiFontMgr = (): SkTypefaceFontProvider | null => {
  const [fontMgr, setFontMgr] = useState(cachedFontMgr);
  useEffect(() => {
    if (fontMgr) {
      return;
    }
    let alive = true;
    loadCachedFontMgr().then(loaded => {
      if (alive && loaded) {
        setFontMgr(loaded);
      }
    });
    return () => {
      alive = false;
    };
  }, [fontMgr]);
  return fontMgr;
};

interface ParagraphOpts {
  align?: TextAlign;
  maxLines?: number;
  ellipsis?: string;
}

// single line by default, pass opts to override ({} = unlimited wrap)
export const buildParagraph = (
  fontMgr: SkTypefaceFontProvider,
  text: string,
  fontSize: number,
  weight: number,
  color: string,
  measureWidth: number,
  opts: ParagraphOpts = {maxLines: 1},
): SkParagraph => {
  const paragraph = Skia.ParagraphBuilder.Make(
    {textAlign: opts.align, maxLines: opts.maxLines, ellipsis: opts.ellipsis},
    fontMgr,
  )
    .pushStyle({
      fontFamilies: [FONT_FAMILY],
      fontSize,
      fontStyle: {weight},
      color: Skia.Color(color),
    })
    .addText(text)
    .build();
  paragraph.layout(measureWidth);
  return paragraph;
};

// Builds at `fontSize`, rebuilds shrunk-to-fit if wider than maxWidth.
export const buildFittedParagraph = (
  fontMgr: SkTypefaceFontProvider,
  text: string,
  fontSize: number,
  weight: number,
  color: string,
  measureWidth: number,
  maxWidth: number,
): SkParagraph => {
  let paragraph = buildParagraph(
    fontMgr,
    text,
    fontSize,
    weight,
    color,
    measureWidth,
  );
  const width = paragraph.getLongestLine();
  if (width > maxWidth) {
    paragraph = buildParagraph(
      fontMgr,
      text,
      (fontSize * maxWidth) / width,
      weight,
      color,
      measureWidth,
    );
  }
  return paragraph;
};

const DATE_PICKER_OPTIONS = ['1D', '1W', '1M', '3M', '1Y', 'ALL'] as const;
export const DATE_PICKER_HEIGHT_RATIO = 0.03;

// Balance block metrics; GlassAmountView derives its layout from these.
const BALANCE_TOP_MARGIN_RATIO = 0.05;
const BALANCE_AMOUNT_LINE_RATIO = 0.06;
const BALANCE_FIAT_ROW_RATIO = 0.02;
export const BALANCE_BLOCK_HEIGHT_RATIO =
  BALANCE_TOP_MARGIN_RATIO + BALANCE_AMOUNT_LINE_RATIO + BALANCE_FIAT_ROW_RATIO;
export const getBalanceBlockBottom = (screenHeight: number, topInset: number) =>
  topInset + screenHeight * BALANCE_BLOCK_HEIGHT_RATIO;

// Mirrors the DatePicker/DateButton row layout.
export const getDatePickerSlots = (
  screenWidth: number,
  screenHeight: number,
) => {
  const margin = screenHeight * 0.03;
  const itemWidth = Math.min(screenWidth * 0.11, screenHeight * 0.05);
  const contentWidth = screenWidth - margin * 2;
  const count = DATE_PICKER_OPTIONS.length;
  const gap = (contentWidth - itemWidth * count) / (count + 1);
  return DATE_PICKER_OPTIONS.map((value, i) => ({
    value,
    left: margin + gap * (i + 1) + itemWidth * i,
    width: itemWidth,
  }));
};

export interface GlassBalanceModel {
  amountText: string;
  fiatText: string;
  percentText: string | null;
  percentValue: number;
}

interface BalanceGraphicsProps {
  model: GlassBalanceModel;
  screenWidth: number;
  screenHeight: number;
  topInset: number;
}

export const useGlassBalanceGraphics = (props: BalanceGraphicsProps) => {
  const {model, screenWidth, screenHeight, topInset} = props;
  const {amountText, fiatText, percentText, percentValue} = model;

  const fontMgr = useSatoshiFontMgr();

  // Avoid rebuilding both paragraphs while scrubbing.
  const measureWidth = screenWidth * 2;
  const amountTop = topInset + screenHeight * BALANCE_TOP_MARGIN_RATIO;
  const amountLineHeight = screenHeight * BALANCE_AMOUNT_LINE_RATIO;

  const amountElement = useMemo(() => {
    if (!fontMgr) {
      return null;
    }
    const amountParagraph = buildFittedParagraph(
      fontMgr,
      amountText,
      screenHeight * 0.05,
      400,
      '#ffffff',
      measureWidth,
      screenWidth * 0.92,
    );
    const amountWidth = amountParagraph.getLongestLine();
    const amountY =
      amountTop + (amountLineHeight - amountParagraph.getHeight()) / 2;
    return (
      <Paragraph
        paragraph={amountParagraph}
        x={(screenWidth - amountWidth) / 2}
        y={amountY}
        width={amountWidth + 2}
      />
    );
  }, [
    fontMgr,
    amountText,
    screenWidth,
    screenHeight,
    measureWidth,
    amountTop,
    amountLineHeight,
  ]);

  const fiatRowElement = useMemo(() => {
    if (!fontMgr) {
      return null;
    }
    const fiatFontSize = screenHeight * 0.015;
    const fiatRowTop = amountTop + amountLineHeight;
    const fiatRowHeight = screenHeight * BALANCE_FIAT_ROW_RATIO;
    const fiatRowCenterY = fiatRowTop + fiatRowHeight / 2;

    const fiatParagraph = buildParagraph(
      fontMgr,
      fiatText,
      fiatFontSize,
      700,
      '#ffffff',
      measureWidth,
    );
    const percentParagraph = percentText
      ? buildParagraph(
          fontMgr,
          percentText,
          fiatFontSize,
          700,
          '#ffffff',
          measureWidth,
        )
      : null;

    const gap = 7;
    const indicatorSize = screenHeight * 0.02;
    const fiatWidth = fiatParagraph.getLongestLine();
    const percentWidth = percentParagraph
      ? percentParagraph.getLongestLine()
      : 0;
    const rowWidth = percentParagraph
      ? fiatWidth + gap + indicatorSize + gap + percentWidth
      : fiatWidth;
    const rowStart = (screenWidth - rowWidth) / 2;

    const isNegative = Math.sign(percentValue) === -1;
    const indicatorCx = rowStart + fiatWidth + gap + indicatorSize / 2;
    const triangle = Skia.Path.Make();
    const triangleHalfWidth = indicatorSize * 0.29;
    const triangleHalfHeight = indicatorSize * 0.24;
    if (isNegative) {
      triangle.moveTo(indicatorCx, fiatRowCenterY + triangleHalfHeight);
      triangle.lineTo(
        indicatorCx - triangleHalfWidth,
        fiatRowCenterY - triangleHalfHeight,
      );
      triangle.lineTo(
        indicatorCx + triangleHalfWidth,
        fiatRowCenterY - triangleHalfHeight,
      );
    } else {
      triangle.moveTo(indicatorCx, fiatRowCenterY - triangleHalfHeight);
      triangle.lineTo(
        indicatorCx - triangleHalfWidth,
        fiatRowCenterY + triangleHalfHeight,
      );
      triangle.lineTo(
        indicatorCx + triangleHalfWidth,
        fiatRowCenterY + triangleHalfHeight,
      );
    }
    triangle.close();

    return (
      <Group>
        <Paragraph
          paragraph={fiatParagraph}
          x={rowStart}
          y={fiatRowCenterY - fiatParagraph.getHeight() / 2}
          width={fiatWidth + 2}
        />
        {percentParagraph ? (
          <>
            <Circle
              cx={indicatorCx}
              cy={fiatRowCenterY}
              r={indicatorSize / 2}
              color={isNegative ? '#f25246' : '#20BB74'}
            />
            <Path path={triangle} color="#ffffff" />
            <Paragraph
              paragraph={percentParagraph}
              x={rowStart + fiatWidth + gap + indicatorSize + gap}
              y={fiatRowCenterY - percentParagraph.getHeight() / 2}
              width={percentWidth + 2}
            />
          </>
        ) : null}
      </Group>
    );
  }, [
    fontMgr,
    fiatText,
    percentText,
    percentValue,
    screenWidth,
    screenHeight,
    measureWidth,
    amountTop,
    amountLineHeight,
  ]);

  return useMemo(
    () =>
      amountElement || fiatRowElement ? (
        <Group>
          {amountElement}
          {fiatRowElement}
        </Group>
      ) : null,
    [amountElement, fiatRowElement],
  );
};

interface DatePickerGraphicsProps {
  screenWidth: number;
  screenHeight: number;
  top: number;
  opacity: SharedValue<number>;
}

export const useGlassDatePickerGraphics = (props: DatePickerGraphicsProps) => {
  const {screenWidth, screenHeight, top, opacity} = props;

  const {t} = useTranslation('main');
  const currentGraphPeriod = useSelector(
    (state: any) => state.chart.graphPeriod,
  );
  const fontMgr = useSatoshiFontMgr();

  return useMemo(() => {
    if (!fontMgr) {
      return null;
    }

    const measureWidth = screenWidth * 2;
    const rowHeight = screenHeight * DATE_PICKER_HEIGHT_RATIO;
    const baseFontSize = screenHeight * 0.011;
    const centerY = top + rowHeight / 2;
    const slots = getDatePickerSlots(screenWidth, screenHeight);

    return (
      <Group opacity={opacity}>
        {slots.map(slot => {
          const active = currentGraphPeriod === slot.value;
          const label = t(slot.value.toLowerCase()).toUpperCase();
          const color = active ? '#2E2E2E' : '#ffffff';
          // Shrink long translations to fit inside the pill.
          const paragraph = buildFittedParagraph(
            fontMgr,
            label,
            baseFontSize,
            700,
            color,
            measureWidth,
            slot.width - screenWidth * 0.04,
          );
          const labelWidth = paragraph.getLongestLine();
          return (
            <Group key={slot.value}>
              {active ? (
                <RoundedRect
                  x={slot.left}
                  y={top}
                  width={slot.width}
                  height={rowHeight}
                  r={rowHeight / 2}
                  color="#ffffff"
                />
              ) : null}
              <Paragraph
                paragraph={paragraph}
                x={slot.left + (slot.width - labelWidth) / 2}
                y={centerY - paragraph.getHeight() / 2}
                width={labelWidth + 2}
              />
            </Group>
          );
        })}
      </Group>
    );
  }, [fontMgr, screenWidth, screenHeight, top, opacity, currentGraphPeriod, t]);
};
