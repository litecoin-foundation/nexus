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
import {shopLogoKey} from './brandIcons';
import {SEGMENTED_PILLS_HEIGHT_RATIO} from '../ButtonsV2/SegmentedPills';
import {GLASS_HEADER_PILL_HEIGHT_RATIO} from '../glassSearchLayout';
import {getHeaderRowHeight} from '../useHeaderHeight';

// Geometry and plain-data models for the shop rows. Nothing here renders:
// GlassTxCanvas draws the models through ShopSkiaRows and GlassShopList
// scrolls an invisible spacer of the same total height, so scroll physics
// stay native and taps hit-test against `rowTops` — the tx list pattern.

// compact gradient header: ShopHeader's title row, section pills, then search,
// with the card's rounded bottom edge — content-fit, no sheet lip below
export const SHOP_HEADER_SEGMENTS_HEIGHT_RATIO = SEGMENTED_PILLS_HEIGHT_RATIO;
export const SHOP_HEADER_GAP_RATIO = 0.016;
export const SHOP_HEADER_SEARCH_HEIGHT_RATIO =
  SHOP_HEADER_SEGMENTS_HEIGHT_RATIO;
export const SHOP_HEADER_INSET_RATIO = 0.04;
const SHOP_HEADER_CONTROLS_GAP_RATIO = 0.016;

export const getShopSegmentsTop = (
  screenWidth: number,
  screenHeight: number,
  topInset: number,
) =>
  topInset +
  (getHeaderRowHeight(screenWidth, screenHeight) +
    screenHeight * GLASS_HEADER_PILL_HEIGHT_RATIO) /
    2 +
  screenHeight * SHOP_HEADER_CONTROLS_GAP_RATIO;

export const getShopHeaderHeight = (
  screenWidth: number,
  screenHeight: number,
  topInset: number,
) =>
  getShopSegmentsTop(screenWidth, screenHeight, topInset) +
  screenHeight *
    (SHOP_HEADER_SEGMENTS_HEIGHT_RATIO +
      SHOP_HEADER_GAP_RATIO +
      SHOP_HEADER_SEARCH_HEIGHT_RATIO) +
  screenWidth * SHOP_HEADER_INSET_RATIO;

// rows start at the gradient card's bottom edge
export const getShopListTop = getShopHeaderHeight;

// only browse carries the search pill; the other sections shed it and the
// gap above it, and the card (and the rows under it) rise by exactly this
export const getShopSearchBlock = (screenHeight: number) =>
  screenHeight * (SHOP_HEADER_GAP_RATIO + SHOP_HEADER_SEARCH_HEIGHT_RATIO);

export const SHOP_CELL_HEIGHT_RATIO = 0.09;
export const SHOP_CARD_GAP_RATIO = 0.01;
export const SHOP_MESSAGE_HEIGHT_RATIO = 0.2;

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

const formatDenomination = (value: number) =>
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
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
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
    const {labelHeight} = getShopRowLayout(SCREEN_WIDTH, SCREEN_HEIGHT);
    const cardRowHeight =
      SCREEN_HEIGHT * (SHOP_CELL_HEIGHT_RATIO + SHOP_CARD_GAP_RATIO);
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
        push(emptyRow('skeleton', y, cardRowHeight));
      }
    };

    const brandRow = (brand: Brand, heartVisible: boolean) => {
      const row = emptyRow('brand', y, cardRowHeight);
      row.id = brand.slug;
      row.title = brand.name;
      row.detail = priceRange(brand);
      row.logoKey = shopLogoKey(brand.slug, brand.logo_url);
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
            const row = emptyRow('pending', y, cardRowHeight);
            row.id = gc.id;
            row.title = gc.brand;
            row.detail = formatShopDate(gc.createdAt);
            row.amount = `${formatCurrency(gc.currency)}${gc.amount}`;
            row.logoKey = shopLogoKey(gc.brand, gc.logo_url);
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
            const row = emptyRow('giftcard', y, cardRowHeight);
            row.id = gc.id;
            row.title = gc.brand;
            row.detail = formatShopDate(gc.purchasedAt);
            row.amount = `${formatCurrency(gc.faceValue.currency)}${gc.faceValue.amount}`;
            row.logoKey = shopLogoKey(gc.brand, gc.logo_url);
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
    SCREEN_WIDTH,
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
  const cardInset = screenWidth * 0.04;
  const pad = cardInset + screenHeight * 0.015;
  const cellHeight = screenHeight * SHOP_CELL_HEIGHT_RATIO;
  const logoWidth = screenWidth * 0.2;
  const logoHeight = screenHeight * 0.07;
  const logoPadLeft = screenWidth * 0.015;
  const logoPadRight = screenWidth * 0.02;
  const logoLeft = cardInset + logoPadLeft;
  const textLeft = logoLeft + logoWidth + logoPadRight;
  const columnGap = screenWidth * 0.035;
  const contentRight = screenWidth - pad;
  const heartSize = screenHeight * 0.02;
  const heartPad = screenWidth * 0.05;
  const heartLeft = screenWidth - cardInset - heartPad - heartSize;
  const labelFontSize = screenHeight * 0.014;
  const labelLineHeight = 1.3;
  const labelPadTop = screenHeight * 0.012;
  const labelPadBottom = screenHeight * 0.012;
  const labelTextHeight = labelFontSize * labelLineHeight;
  return {
    labelFontSize,
    labelLineHeight,
    labelPadTop,
    labelTextHeight,
    labelHeight: labelPadTop + labelTextHeight + labelPadBottom,
    pad,
    cardInset,
    cardGap: screenHeight * SHOP_CARD_GAP_RATIO,
    cardRadius: screenHeight * 0.015,
    logoLeft,
    logoWidth,
    logoHeight,
    logoRadius: screenHeight * 0.012,
    cellHeight,
    textLeft,
    titleMaxWidth: contentRight - screenWidth * 0.27 - textLeft,
    brandTitleMaxWidth: heartLeft - columnGap - textLeft,
    cellPadV: screenHeight * 0.018,
    heartSize,
    heartLeft,
    messageCtaWidth: screenWidth * 0.4,
    messageCtaHeight: screenHeight * 0.05,
  };
};

export type ShopRowAction =
  | {type: 'heart'; id: string}
  | {type: 'purchase'; id: string}
  | {type: 'open-card'; id: string}
  | {type: 'open-pending'; id: string}
  | {type: 'filter'}
  | {type: 'retry'}
  | {type: 'signin'}
  | {type: 'none'};

// resolves a tap inside a row to its target; row-local coordinates
export const shopRowHitTarget = (
  model: ShopRowModel,
  x: number,
  yLocal: number,
  screenWidth: number,
  screenHeight: number,
): ShopRowAction => {
  const layout = getShopRowLayout(screenWidth, screenHeight);

  // the gaps around a card belong to no card
  if (
    model.kind === 'brand' ||
    model.kind === 'giftcard' ||
    model.kind === 'pending'
  ) {
    const cardTop = layout.cardGap / 2;
    if (
      x < layout.cardInset ||
      x > screenWidth - layout.cardInset ||
      yLocal < cardTop ||
      yLocal > cardTop + layout.cellHeight
    ) {
      return {type: 'none'};
    }
  }

  switch (model.kind) {
    case 'label':
      if (model.showFilter && x > screenWidth * 0.55) {
        return {type: 'filter'};
      }
      return {type: 'none'};

    case 'brand': {
      if (
        model.heart !== 0 &&
        x > layout.textLeft + layout.brandTitleMaxWidth
      ) {
        return {type: 'heart', id: model.id};
      }
      return {type: 'purchase', id: model.id};
    }

    case 'giftcard':
      return {type: 'open-card', id: model.id};

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
