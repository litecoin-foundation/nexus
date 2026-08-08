import {useContext, useMemo} from 'react';
import {useTranslation} from 'react-i18next';

import {
  Brand,
  GiftCard,
  PendingGiftCardPurchase,
  formatCurrency,
  isExpired,
} from '../../services/giftcards';
import {ScreenSizeContext} from '../../context/screenSize';

// Geometry and plain-data models for the shop rows. Nothing here renders:
// GlassTxCanvas draws the models through ShopSkiaRows and GlassShopList
// scrolls an invisible spacer of the same total height, so scroll physics
// stay native and taps hit-test against `rowTops` — the tx list pattern.

// compact gradient header: nav-bar title row, section pills, then search,
// with the card's rounded bottom edge — content-fit, no sheet lip below
export const SHOP_HEADER_SEGMENTS_TOP_RATIO = 0.075;
export const SHOP_HEADER_SEGMENTS_HEIGHT_RATIO = 0.048;
export const SHOP_HEADER_GAP_RATIO = 0.016;
export const SHOP_HEADER_SEARCH_HEIGHT_RATIO = 0.052;
export const SHOP_HEADER_BOTTOM_PAD_RATIO = 0.024;

export const getShopHeaderHeight = (screenHeight: number, topInset: number) =>
  topInset +
  screenHeight *
    (SHOP_HEADER_SEGMENTS_TOP_RATIO +
      SHOP_HEADER_SEGMENTS_HEIGHT_RATIO +
      SHOP_HEADER_GAP_RATIO +
      SHOP_HEADER_SEARCH_HEIGHT_RATIO +
      SHOP_HEADER_BOTTOM_PAD_RATIO);

// rows start at the gradient card's bottom edge
export const getShopListTop = getShopHeaderHeight;

export const SHOP_LABEL_HEIGHT_RATIO = 0.042;
export const SHOP_CELL_HEIGHT_RATIO = 0.09;
export const SHOP_CHIP_ROW_HEIGHT_RATIO = 0.052;
export const SHOP_CTA_HEIGHT_RATIO = 0.055;
export const SHOP_EXPAND_GAP_RATIO = 0.012;
export const SHOP_PANEL_TOP_GAP_RATIO = 0.004;
export const SHOP_PANEL_PAD_RATIO = 0.01;
export const SHOP_EXPAND_BOTTOM_RATIO = 0.014;
export const SHOP_CODE_ROW_HEIGHT_RATIO = 0.05;
export const SHOP_MESSAGE_HEIGHT_RATIO = 0.2;

export const getShopBrandExpandHeight = (screenHeight: number) =>
  screenHeight *
  (SHOP_PANEL_TOP_GAP_RATIO +
    SHOP_PANEL_PAD_RATIO +
    SHOP_CHIP_ROW_HEIGHT_RATIO +
    SHOP_EXPAND_GAP_RATIO +
    SHOP_CTA_HEIGHT_RATIO +
    SHOP_PANEL_PAD_RATIO +
    SHOP_EXPAND_BOTTOM_RATIO);

export const getShopCardExpandHeight = (screenHeight: number) =>
  screenHeight *
  (SHOP_PANEL_TOP_GAP_RATIO +
    SHOP_PANEL_PAD_RATIO +
    SHOP_CODE_ROW_HEIGHT_RATIO +
    SHOP_PANEL_PAD_RATIO +
    SHOP_EXPAND_BOTTOM_RATIO);

export type ShopRowKind =
  | 'label'
  | 'brand'
  | 'giftcard'
  | 'pending'
  | 'skeleton'
  | 'message'
  | 'spacer';

// one flat shape so the worklets touch plain numbers and strings only
export interface ShopRowModel {
  kind: ShopRowKind;
  top: number;
  height: number;
  title: string;
  accessory: string;
  showFilter: boolean;
  filterActive: boolean;
  id: string;
  detail: string;
  amount: string;
  logoKey: string;
  initial: string;
  discount: string;
  // 0 hidden, 1 inactive, 2 active
  heart: number;
  cta: string;
  status: string;
  faded: boolean;
  message: string;
}

export interface ShopRowModels {
  models: ShopRowModel[];
  rowTops: number[];
  rowBottoms: number[];
}

export type ShopSection = 'browse' | 'my-cards' | 'wishlist';

// Expansion never touches these models: the expanded panel is a declarative
// overlay in the canvas and rows below slide by an animated offset, so the
// skia list never resets (and never hitches) while a row opens or closes.
export interface ShopRowsInput {
  section: ShopSection;
  // browse: filtered brands; wishlist: wishlist brands
  brands: Brand[] | null;
  giftCards: GiftCard[];
  pendingGiftCards: PendingGiftCardPurchase[];
  loading: boolean;
  error: string | null;
  loggedIn: boolean;
  wishlistSlugs: string[];
  categoryLabel: string | null;
  // native bottom clearance appended as a spacer row
  bottomClearance: number;
}

const emptyRow = (
  kind: ShopRowKind,
  top: number,
  height: number,
): ShopRowModel => ({
  kind,
  top,
  height,
  title: '',
  accessory: '',
  showFilter: false,
  filterActive: false,
  id: '',
  detail: '',
  amount: '',
  logoKey: '',
  initial: '',
  discount: '',
  heart: 0,
  cta: '',
  status: '',
  faded: false,
  message: '',
});

const MAX_CHIPS = 5;

// mirrors the old BrandCard button set: real denominations trimmed to five,
// or round values spread across a face-value range
export const buildDenominations = (brand: Brand): number[] => {
  const minAmount = Math.max(
    brand.currencyMinValue ?? 0,
    Number(brand.digital_face_value_limits?.lower || brand.denominations?.[0]),
  );
  const maxAmount = Number(
    brand.digital_face_value_limits?.upper ||
      brand.denominations?.[brand.denominations.length - 1],
  );

  const allDenoms = brand.denominations?.map(Number).sort((a, b) => a - b);
  if (allDenoms && allDenoms.length > 0) {
    if (allDenoms.length <= MAX_CHIPS) {
      return allDenoms;
    }
    const result: number[] = [allDenoms[0]];
    const innerCount = MAX_CHIPS - 2;
    for (let i = 1; i <= innerCount; i++) {
      const idx = Math.round((i * (allDenoms.length - 1)) / (innerCount + 1));
      if (!result.includes(allDenoms[idx])) {
        result.push(allDenoms[idx]);
      }
    }
    if (!result.includes(allDenoms[allDenoms.length - 1])) {
      result.push(allDenoms[allDenoms.length - 1]);
    }
    return result;
  }

  if (isNaN(minAmount) || isNaN(maxAmount) || minAmount >= maxAmount) {
    return [minAmount].filter(v => !isNaN(v));
  }
  const candidates = [
    5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 80, 100, 125, 150, 175, 200, 250,
    300, 400, 500, 750, 1000,
  ].filter(d => d >= minAmount && d <= maxAmount);

  if (candidates.length <= MAX_CHIPS) {
    const result = [...candidates];
    if (!result.includes(minAmount)) {
      result.unshift(minAmount);
    }
    if (!result.includes(maxAmount)) {
      result.push(maxAmount);
    }
    return result.slice(0, MAX_CHIPS);
  }

  const result: number[] = [candidates[0]];
  const innerCount = MAX_CHIPS - 2;
  for (let i = 1; i <= innerCount; i++) {
    const idx = Math.round((i * (candidates.length - 1)) / (innerCount + 1));
    if (!result.includes(candidates[idx])) {
      result.push(candidates[idx]);
    }
  }
  if (!result.includes(candidates[candidates.length - 1])) {
    result.push(candidates[candidates.length - 1]);
  }
  return result;
};

export const formatDenomination = (value: number) =>
  Number.isInteger(value)
    ? value.toString()
    : value.toFixed(2).replace(/\.00$/, '');

const formatDiscount = (value: number) =>
  parseFloat(value.toFixed(2)).toString();

const formatShopDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const priceRange = (brand: Brand): string => {
  const minAmount = Math.max(
    brand.currencyMinValue ?? 0,
    Number(brand.digital_face_value_limits?.lower || brand.denominations?.[0]),
  );
  const maxAmount = Number(
    brand.digital_face_value_limits?.upper ||
      brand.denominations?.[brand.denominations.length - 1],
  );
  if (isNaN(minAmount) || isNaN(maxAmount)) {
    return '';
  }
  const symbol = formatCurrency(brand.currency);
  return minAmount === maxAmount
    ? `${symbol}${formatDenomination(minAmount)}`
    : `${symbol}${formatDenomination(minAmount)} - ${symbol}${formatDenomination(maxAmount)}`;
};

export const useShopRowModels = (input: ShopRowsInput): ShopRowModels => {
  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);
  const {t} = useTranslation('nexusShop');

  const {
    section,
    brands,
    giftCards,
    pendingGiftCards,
    loading,
    error,
    loggedIn,
    wishlistSlugs,
    categoryLabel,
    bottomClearance,
  } = input;

  return useMemo(() => {
    const labelHeight = SCREEN_HEIGHT * SHOP_LABEL_HEIGHT_RATIO;
    const cellHeight = SCREEN_HEIGHT * SHOP_CELL_HEIGHT_RATIO;
    const messageHeight = SCREEN_HEIGHT * SHOP_MESSAGE_HEIGHT_RATIO;

    const models: ShopRowModel[] = [];
    let y = 0;
    const push = (model: ShopRowModel) => {
      models.push(model);
      y += model.height;
    };

    const label = (title: string, withFilter = false) => {
      const row = emptyRow('label', y, labelHeight);
      row.title = title.toUpperCase();
      if (withFilter) {
        row.showFilter = true;
        row.accessory = categoryLabel ?? '';
        row.filterActive = categoryLabel !== null;
      }
      push(row);
    };

    const message = (text: string, cta = '', id = '') => {
      const row = emptyRow('message', y, messageHeight);
      row.message = text;
      row.cta = cta;
      row.id = id;
      push(row);
    };

    const skeletons = (count: number) => {
      for (let i = 0; i < count; i++) {
        push(emptyRow('skeleton', y, cellHeight));
      }
    };

    const brandRow = (brand: Brand, heartVisible: boolean) => {
      const row = emptyRow('brand', y, cellHeight);
      row.id = brand.slug;
      row.title = brand.name;
      row.detail = priceRange(brand);
      row.logoKey = brand.logo_url ?? '';
      row.initial = brand.name.charAt(0).toUpperCase();
      row.discount = brand.saleDiscount
        ? `-${formatDiscount(brand.saleDiscount)}%`
        : '';
      row.heart = heartVisible
        ? wishlistSlugs.includes(brand.slug)
          ? 2
          : 1
        : 0;
      push(row);
    };

    if (section === 'browse' || section === 'wishlist') {
      label(
        section === 'browse' ? t('available_gif_cards') : t('your_wishlist'),
        section === 'browse',
      );
      if (loading) {
        skeletons(6);
      } else if (error) {
        message(error, 'Try Again', 'retry');
      } else if (!brands || brands.length === 0) {
        message(
          section === 'browse'
            ? 'No giftcards available in your country.'
            : t('empty_wishlist'),
        );
      } else {
        for (const brand of brands) {
          brandRow(brand, loggedIn);
        }
      }
    } else {
      // my-cards
      if (error === 'Unauthorized') {
        message(
          'To access your giftcards sign in to Nexus Shop account',
          'Sign In',
          'signin',
        );
      } else if (loading) {
        label(t('my_cards'));
        skeletons(5);
      } else if (error) {
        message(error, 'Try Again', 'retry');
      } else {
        const activePending = pendingGiftCards.filter(
          gc =>
            gc.status === 'pending_payment' || gc.status === 'payment_received',
        );
        const activeCards = giftCards.filter(
          gc => gc.status === 'active' && !isExpired(gc),
        );
        const otherCards = giftCards.filter(
          gc => gc.status !== 'active' || isExpired(gc),
        );

        if (activePending.length > 0) {
          label(t('pending_gif_cards'));
          for (const gc of activePending) {
            const row = emptyRow('pending', y, cellHeight);
            row.id = gc.id;
            row.title = gc.brand;
            row.detail = formatShopDate(gc.createdAt);
            row.amount = `${formatCurrency(gc.currency)}${gc.amount}`;
            row.logoKey = gc.logo_url ?? '';
            row.initial = gc.brand.charAt(0).toUpperCase();
            row.status = t(
              gc.status === 'payment_received'
                ? 'payment_received'
                : 'pending_payment',
            );
            push(row);
          }
        }

        if (activeCards.length === 0 && otherCards.length === 0) {
          if (activePending.length === 0) {
            message("You don't have any gift cards yet.");
          }
        } else {
          label(t('my_cards'));
          const cardRow = (gc: GiftCard, faded: boolean) => {
            const row = emptyRow('giftcard', y, cellHeight);
            row.id = gc.id;
            row.title = gc.brand;
            row.detail = formatShopDate(gc.purchasedAt);
            row.amount = `${formatCurrency(gc.faceValue.currency)}${gc.faceValue.amount}`;
            row.logoKey = gc.logo_url ?? '';
            row.initial = gc.brand.charAt(0).toUpperCase();
            row.faded = faded;
            push(row);
          };
          activeCards.forEach(gc => cardRow(gc, false));
          otherCards.forEach(gc => cardRow(gc, true));
        }
      }
    }

    push(emptyRow('spacer', y, bottomClearance));

    const rowTops = models.map(m => m.top);
    const rowBottoms = models.map(m => m.top + m.height);
    return {models, rowTops, rowBottoms};
  }, [
    SCREEN_HEIGHT,
    t,
    section,
    brands,
    giftCards,
    pendingGiftCards,
    loading,
    error,
    loggedIn,
    wishlistSlugs,
    categoryLabel,
    bottomClearance,
  ]);
};

// shared row layout, used by the draw worklets and the JS hit-testing
export const getShopRowLayout = (screenWidth: number, screenHeight: number) => {
  'worklet';
  const pad = screenWidth * 0.05;
  const tileWidth = screenWidth * 0.17;
  const tileHeight = screenHeight * 0.06;
  const cellHeight = screenHeight * SHOP_CELL_HEIGHT_RATIO;
  return {
    pad,
    tileWidth,
    tileHeight,
    cellHeight,
    textLeft: pad + tileWidth + screenWidth * 0.035,
    // right-side columns cap the title/detail paragraphs
    titleMaxWidth: screenWidth * 0.42,
    cellPadV: screenHeight * 0.018,
    heartSize: screenHeight * 0.02,
    heartZoneWidth: screenWidth * 0.12,
    chevronSize: screenHeight * 0.013,
    chevronZoneWidth: screenWidth * 0.08,
    chevronCx: screenWidth - screenWidth * 0.05 - (screenWidth * 0.08) / 2,
    panelTopGap: screenHeight * SHOP_PANEL_TOP_GAP_RATIO,
    panelPad: screenHeight * SHOP_PANEL_PAD_RATIO,
    panelPadH: screenWidth * 0.025,
    chipGap: screenWidth * 0.02,
    chipHeight: screenHeight * SHOP_CHIP_ROW_HEIGHT_RATIO,
    ctaHeight: screenHeight * SHOP_CTA_HEIGHT_RATIO,
    expandGap: screenHeight * SHOP_EXPAND_GAP_RATIO,
    codeRowHeight: screenHeight * SHOP_CODE_ROW_HEIGHT_RATIO,
    messageCtaWidth: screenWidth * 0.4,
    messageCtaHeight: screenHeight * 0.05,
  };
};

export type ShopRowAction =
  | {type: 'toggle'; id: string}
  | {type: 'heart'; id: string}
  | {type: 'chip'; id: string; value: number}
  | {type: 'purchase'; id: string}
  | {type: 'copy-code'; id: string; code: string}
  | {type: 'open-card'; id: string}
  | {type: 'open-pending'; id: string}
  | {type: 'filter'}
  | {type: 'retry'}
  | {type: 'signin'}
  | {type: 'none'};

// plain data the scroller's tap worklet needs to hit-test the open panel
export interface ShopPanelHit {
  id: string;
  kind: 'brand' | 'giftcard';
  splitY: number;
  extras: number;
  chipValues: number[];
  code: string;
  hasCta: boolean;
}

// resolves a tap inside the expanded panel overlay; panel-local coordinates
export const shopPanelHitTarget = (
  panel: ShopPanelHit,
  x: number,
  yLocal: number,
  screenWidth: number,
  screenHeight: number,
): ShopRowAction => {
  'worklet';
  const layout = getShopRowLayout(screenWidth, screenHeight);
  const inset = layout.pad + layout.panelPadH;
  const rowTop = layout.panelTopGap + layout.panelPad;

  if (panel.kind === 'giftcard') {
    if (yLocal >= rowTop && yLocal < rowTop + layout.codeRowHeight) {
      if (panel.code) {
        return {type: 'copy-code', id: panel.id, code: panel.code};
      }
      if (panel.hasCta) {
        return {type: 'open-card', id: panel.id};
      }
    }
    return {type: 'none'};
  }

  const chipBottom = rowTop + layout.chipHeight;
  if (yLocal >= rowTop && yLocal < chipBottom && panel.chipValues.length > 0) {
    const count = panel.chipValues.length;
    const chipWidth =
      (screenWidth - inset * 2 - layout.chipGap * (count - 1)) / count;
    const local = x - inset;
    const index = Math.floor(local / (chipWidth + layout.chipGap));
    if (
      index >= 0 &&
      index < count &&
      local - index * (chipWidth + layout.chipGap) <= chipWidth
    ) {
      return {type: 'chip', id: panel.id, value: panel.chipValues[index]};
    }
    return {type: 'none'};
  }
  const ctaTop = chipBottom + layout.expandGap;
  if (yLocal >= ctaTop && yLocal < ctaTop + layout.ctaHeight) {
    return {type: 'purchase', id: panel.id};
  }
  return {type: 'none'};
};

// the cta zone, for press feedback while the finger is down
export const shopPanelCtaZone = (
  panel: ShopPanelHit,
  yLocal: number,
  screenWidth: number,
  screenHeight: number,
): boolean => {
  'worklet';
  const layout = getShopRowLayout(screenWidth, screenHeight);
  const rowTop = layout.panelTopGap + layout.panelPad;
  if (panel.kind === 'giftcard') {
    return (
      panel.hasCta && yLocal >= rowTop && yLocal < rowTop + layout.codeRowHeight
    );
  }
  const ctaTop = rowTop + layout.chipHeight + layout.expandGap;
  return yLocal >= ctaTop && yLocal < ctaTop + layout.ctaHeight;
};

// resolves a tap inside a row to its target; row-local coordinates
export const shopRowHitTarget = (
  model: ShopRowModel,
  x: number,
  yLocal: number,
  screenWidth: number,
  screenHeight: number,
): ShopRowAction => {
  const layout = getShopRowLayout(screenWidth, screenHeight);

  switch (model.kind) {
    case 'label':
      if (model.showFilter && x > screenWidth * 0.55) {
        return {type: 'filter'};
      }
      return {type: 'none'};

    case 'brand': {
      if (
        model.heart !== 0 &&
        x >
          screenWidth -
            layout.pad -
            layout.chevronZoneWidth -
            layout.heartZoneWidth &&
        x <= screenWidth - layout.pad - layout.chevronZoneWidth
      ) {
        return {type: 'heart', id: model.id};
      }
      return {type: 'toggle', id: model.id};
    }

    case 'giftcard':
      return {type: 'toggle', id: model.id};

    case 'pending':
      return {type: 'open-pending', id: model.id};

    case 'message': {
      if (model.cta) {
        const ctaTop = model.height / 2;
        if (
          yLocal > ctaTop &&
          yLocal < ctaTop + layout.messageCtaHeight * 1.6
        ) {
          return model.id === 'signin' ? {type: 'signin'} : {type: 'retry'};
        }
      }
      return {type: 'none'};
    }

    default:
      return {type: 'none'};
  }
};
