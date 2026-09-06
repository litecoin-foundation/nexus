import React, {useContext, useMemo} from 'react';
import {Group, Image, Paragraph, Rect, Skia} from '@shopify/react-native-skia';
import {useTranslation} from 'react-i18next';

import {buildParagraph, useSatoshiFontMgr} from './GlassBalanceGraphics';
import {
  DRAG_STRIP_HEIGHT_RATIO,
  makeCachedSkiaIcons,
  SHEET_BACKGROUND,
  TX_TITLE_ROW_HEIGHT_RATIO,
} from './GlassTxRows';
import {SHEET_TOP_RADIUS_RATIO} from './GlassBottomSheet';
import {ScreenSizeContext} from '../context/screenSize';

// The "Transactions" heading and its search button, as Skia elements, so the
// page canvas and the overlays that cover it draw the heading from one source
// — the same split as the rows, with NewMain keeping the view as a hit area.

const TITLE_COLOR = '#2E2E2E';

// square button box at the right edge, glyph inset inside it
const SEARCH_BOX_RATIO = 0.07;
const SEARCH_INSET_RATIO = 0.024;
const SEARCH_GLYPH_RATIO = 0.022;

const useSearchIcon = makeCachedSkiaIcons({
  search: require('../assets/icons/search-icon.png'),
});

// Canvas y of the heading's top edge. Excludes listHeaderOffset, which pushes
// only the rows down when the sync header is up.
export const titleTopInCanvas = (
  sheetY: number,
  screenHeight: number,
  canvasTop: number,
) => {
  'worklet';
  return sheetY + screenHeight * DRAG_STRIP_HEIGHT_RATIO - canvasTop;
};

// The sheet's rounded top, as a clip. The heading paints an opaque band at the
// very top of the sheet, and canvases are not bound by the sheet view's border
// radius, so without this it squares off the sheet's corners. Runs past the
// screen bottom so only the top corners are ever rounded.
export const sheetTopClip = (
  sheetTop: number,
  screenWidth: number,
  screenHeight: number,
) => {
  'worklet';
  const r = screenHeight * SHEET_TOP_RADIUS_RATIO;
  return Skia.RRectXY(
    Skia.XYWHRect(0, sheetTop, screenWidth, screenHeight + r),
    r,
    r,
  );
};

// Elements in heading-local coordinates: y = 0 is the top of the heading row.
export const useGlassTxTitleElements = (): React.ReactNode => {
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const {t} = useTranslation('main');
  const fontMgr = useSatoshiFontMgr();
  const {search} = useSearchIcon();

  const rowHeight = SCREEN_HEIGHT * TX_TITLE_ROW_HEIGHT_RATIO;
  const title = t('txs');

  const paragraph = useMemo(() => {
    if (!fontMgr) {
      return null;
    }
    return buildParagraph(
      fontMgr,
      title,
      SCREEN_HEIGHT * 0.025,
      500,
      TITLE_COLOR,
      SCREEN_WIDTH,
    );
  }, [fontMgr, title, SCREEN_WIDTH, SCREEN_HEIGHT]);

  return useMemo(() => {
    if (!paragraph) {
      return null;
    }
    const searchBox = SCREEN_HEIGHT * SEARCH_BOX_RATIO;
    const glyph = SCREEN_HEIGHT * SEARCH_GLYPH_RATIO;
    const inset = SCREEN_HEIGHT * SEARCH_INSET_RATIO;
    return (
      <Group>
        {/* Opaque, like the rows below it: the heading owns its own band
            rather than showing through to whatever is behind the canvas. */}
        <Rect
          x={0}
          y={0}
          width={SCREEN_WIDTH}
          height={rowHeight}
          color={SHEET_BACKGROUND}
        />
        <Paragraph
          paragraph={paragraph}
          x={SCREEN_WIDTH * 0.04}
          y={(rowHeight - paragraph.getHeight()) / 2}
          width={SCREEN_WIDTH}
        />
        {search ? (
          <Image
            image={search}
            x={SCREEN_WIDTH - searchBox + inset}
            y={(rowHeight - searchBox) / 2 + inset}
            width={glyph}
            height={glyph}
            fit="scaleDown"
          />
        ) : null}
      </Group>
    );
  }, [paragraph, search, rowHeight, SCREEN_WIDTH, SCREEN_HEIGHT]);
};
