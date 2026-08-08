import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {Alert} from 'react-native';
import {getCountry} from 'react-native-localize';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import Clipboard from '@react-native-clipboard/clipboard';
import {
  Easing,
  runOnJS,
  SharedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import {
  Brand,
  GiftCard,
  GiftCardClient,
  PendingGiftCardPurchase,
  TilloCategory,
  filterBrandsByCountry,
  formatCategoryLabel,
  formatCurrency,
} from '../../services/giftcards';
import {
  buildDenominations,
  formatDenomination,
  getShopBrandExpandHeight,
  getShopCardExpandHeight,
  getShopRowLayout,
  ShopPanelHit,
  ShopRowAction,
  ShopRowModels,
  ShopSection,
  SHOP_CELL_HEIGHT_RATIO,
  useShopRowModels,
} from './GlassShopRows';
import {
  ShopExpandedPanelData,
  useShopExpandedPanel,
} from './GlassShopExpandedPanel';
import {ShopLogoImages, useShopLogoImages} from './shopLogoImages';
import {getTabBarBandHeight} from '../glassTabBarLayout';
import {
  clearSessionToken,
  fetchWishlistFromServer,
  logoutFromNexusShop,
  setGiftCards,
  syncWishlistToggle,
} from '../../reducers/nexusshopaccount';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {ScreenSizeContext} from '../../context/screenSize';

// Data and UI state for the shop screen. The models feed the skia rows in
// the glass canvas; the surface renders the native header and resolves taps.

// the client is stateless, one instance serves the screen for the app's life
const shopClient = new GiftCardClient();

// the screen unmounts on close; the data survives so reopening starts from
// the last fetch (quiet refresh) instead of skeletons
let brandsCache: Brand[] | null = null;
let ownedCardsCache: GiftCard[] = [];
let pendingCardsCache: PendingGiftCardPurchase[] = [];
let hadCards = false;

export interface ShopScreenState {
  section: ShopSection;
  setSection: (section: ShopSection) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: TilloCategory | null;
  setSelectedCategory: (category: TilloCategory | null) => void;
  categoryPickerVisible: boolean;
  setCategoryPickerVisible: (visible: boolean) => void;
  loggedIn: boolean;
  rowModels: ShopRowModels;
  logos: ShopLogoImages;
  handleRowAction: (action: ShopRowAction) => void;
  refreshing: boolean;
  refresh: () => Promise<void>;
  // row-expansion unfold, read by the glass canvas
  expandSplit: SharedValue<number>;
  expandExtras: SharedValue<number>;
  expandProgress: SharedValue<number>;
  expandChevronLift: SharedValue<number>;
  ctaPressScale: SharedValue<number>;
  // declarative overlay the canvas reveals with the unfold
  panelNode: React.ReactNode;
  chevronNode: React.ReactNode;
  panelHit: ShopPanelHit | null;
}

interface Params {
  navigation: any;
  active: boolean;
  requestedSection?: string;
  // the canvas draws from this; section changes must zero it synchronously
  shopScrollY: SharedValue<number>;
}

// idle split sits past any list
const EXPAND_IDLE_SPLIT = 1e9;
const EXPAND_OPEN_MS = 340;
const EXPAND_CLOSE_MS = 260;
// silky settle out, gentle symmetric fold shut
const EXPAND_OPEN_EASING = Easing.bezier(0.22, 1, 0.36, 1);
const EXPAND_CLOSE_EASING = Easing.bezier(0.4, 0, 0.6, 1);

export const useShopScreenState = (params: Params): ShopScreenState => {
  const {navigation, active, requestedSection, shopScrollY} = params;

  const insets = useSafeAreaInsets();
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const dispatch = useAppDispatch();

  const account = useAppSelector(
    (state: any) => state.nexusshopaccount.account,
  );
  const wishlistBrands = useAppSelector(
    (state: any) => state.nexusshopaccount.wishlistBrands,
  );
  const wishlistLoading = useAppSelector(
    (state: any) => state.nexusshopaccount.loading,
  );
  const reduxGiftCards = useAppSelector(
    (state: any) => state.nexusshopaccount.giftCards,
  );
  const loggedIn = !!(account && account.isLoggedIn);
  const shopUserEmail = account && account.email;
  const userCountry = account?.userCountry || getCountry();

  const [section, setSection] = useState<ShopSection>(
    requestedSection === 'my-cards' ? 'my-cards' : 'browse',
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] =
    useState<TilloCategory | null>(null);
  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);
  const [expandedPanel, setExpandedPanel] =
    useState<ShopExpandedPanelData | null>(null);
  const [selectedAmounts, setSelectedAmounts] = useState<
    Record<string, number>
  >({});

  // fetch once the shop is first opened, not on app start
  const [activated, setActivated] = useState(false);
  useEffect(() => {
    if (active) {
      setActivated(true);
    }
  }, [active]);

  useEffect(() => {
    if (!loggedIn) {
      dispatch(clearSessionToken());
    }
  }, [loggedIn, dispatch]);

  // a stale session falls back to browsing logged out
  useEffect(() => {
    if (!activated || !loggedIn || !shopUserEmail) {
      return;
    }
    let alive = true;
    shopClient
      .validateUser(shopUserEmail)
      .then(res => {
        if (alive && !res.authenticated) {
          dispatch(logoutFromNexusShop());
        }
      })
      .catch(() => {
        if (alive) {
          dispatch(logoutFromNexusShop());
        }
      });
    return () => {
      alive = false;
    };
  }, [activated, loggedIn, shopUserEmail, dispatch]);

  // brands
  const [brands, setBrands] = useState<Brand[] | null>(brandsCache);
  const [brandsLoading, setBrandsLoading] = useState(brandsCache === null);
  const [brandsError, setBrandsError] = useState<string | null>(null);
  const fetchBrands = useCallback(async () => {
    // loading starts true so only the first fetch shows skeletons; later
    // refreshes are quiet and keep the array identity when nothing changed,
    // so the skia list (and its paragraph cache) is left alone
    setBrandsError(null);
    try {
      let fetched = await shopClient.getBrandsFiltered({country: userCountry});
      fetched = filterBrandsByCountry(fetched, userCountry);
      if (Array.isArray(fetched)) {
        setBrands(prev =>
          prev && JSON.stringify(prev) === JSON.stringify(fetched)
            ? prev
            : fetched,
        );
        if (loggedIn) {
          dispatch(fetchWishlistFromServer(fetched));
        }
      } else {
        setBrandsError('Invalid brands data format');
      }
    } catch (err) {
      setBrandsError(
        err instanceof Error ? err.message : 'Failed to fetch brands',
      );
    } finally {
      setBrandsLoading(false);
    }
  }, [userCountry, loggedIn, dispatch]);
  useEffect(() => {
    if (activated) {
      fetchBrands();
    }
  }, [activated, fetchBrands]);

  // owned + pending cards, refreshed on each visit to the section
  const [ownedGiftCards, setOwnedGiftCards] =
    useState<GiftCard[]>(ownedCardsCache);
  const [pendingGiftCards, setPendingGiftCards] =
    useState<PendingGiftCardPurchase[]>(pendingCardsCache);
  const [cardsLoading, setCardsLoading] = useState(!hadCards);
  const [cardsError, setCardsError] = useState<string | null>(null);
  const reduxGiftCardsRef = useRef(reduxGiftCards);
  reduxGiftCardsRef.current = reduxGiftCards;
  const hasCards = useRef(hadCards);
  useEffect(() => {
    brandsCache = brands;
    ownedCardsCache = ownedGiftCards;
    pendingCardsCache = pendingGiftCards;
  }, [brands, ownedGiftCards, pendingGiftCards]);
  const fetchCards = useCallback(async () => {
    // same quiet-refresh contract as the brands
    if (!hasCards.current) {
      setCardsLoading(true);
    }
    setCardsError(null);
    try {
      const cards = await shopClient.getMyGiftCards();
      const pending = await shopClient.getMyPendingGiftCards();
      hasCards.current = true;
      hadCards = true;
      setOwnedGiftCards(prev =>
        JSON.stringify(prev) === JSON.stringify(cards) ? prev : cards,
      );
      setPendingGiftCards(prev =>
        JSON.stringify(prev) === JSON.stringify(pending) ? prev : pending,
      );
      // the drawer's stats read redux; preserve favoured like the old hook
      dispatch(
        setGiftCards(
          cards.map(card => ({
            ...card,
            favoured:
              reduxGiftCardsRef.current?.find(
                (existing: GiftCard & {favoured?: boolean}) =>
                  existing.id === card.id,
              )?.favoured ?? false,
          })),
        ),
      );
    } catch (err) {
      setCardsError(
        err instanceof Error ? err.message : 'Failed to fetch gift cards',
      );
    } finally {
      setCardsLoading(false);
    }
  }, [dispatch]);
  useEffect(() => {
    if (activated && section === 'my-cards') {
      fetchCards();
    }
  }, [activated, section, fetchCards]);

  // later visits refresh quietly; the sheet card refetched on every open
  useEffect(() => {
    if (active && activated) {
      fetchBrands();
      if (section === 'my-cards') {
        fetchCards();
      }
    }
    // refetch on re-entry only, not on section/fetcher identity changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const [refreshing, setRefreshing] = useState(false);
  const refresh = useCallback(async () => {
    setRefreshing(true);
    if (section === 'my-cards') {
      await fetchCards();
    } else {
      await fetchBrands();
    }
    setRefreshing(false);
  }, [section, fetchCards, fetchBrands]);

  const brandNameBySlug = useMemo(() => {
    const map = new Map<string, string>();
    brands?.forEach(b => map.set(b.slug, b.name));
    return map;
  }, [brands]);

  // cards carry the brand slug; show its display name
  const namedGiftCards = useMemo(
    () =>
      ownedGiftCards.map(gc => ({
        ...gc,
        brand: brandNameBySlug.get(gc.brand) ?? gc.brand,
      })),
    [ownedGiftCards, brandNameBySlug],
  );
  const namedPending = useMemo(
    () =>
      pendingGiftCards.map(gc => ({
        ...gc,
        brand: brandNameBySlug.get(gc.brand) ?? gc.brand,
      })),
    [pendingGiftCards, brandNameBySlug],
  );

  const filteredBrands = useMemo(() => {
    if (section === 'wishlist') {
      if (!wishlistBrands) {
        return [];
      }
      return [...wishlistBrands].sort(
        (a: Brand, b: Brand) =>
          (b.priority ?? -Infinity) - (a.priority ?? -Infinity),
      );
    }
    let base =
      brands && selectedCategory
        ? brands.filter(b => b.categories?.includes(selectedCategory))
        : brands;
    if (!base) {
      return null;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      base = base.filter(b => b.name.toLowerCase().includes(q));
    }
    return [...base].sort(
      (a, b) => (b.priority ?? -Infinity) - (a.priority ?? -Infinity),
    );
  }, [section, brands, wishlistBrands, selectedCategory, searchQuery]);

  const wishlistSlugs = useMemo(
    () => (wishlistBrands ?? []).map((b: Brand) => b.slug),
    [wishlistBrands],
  );

  const logoUrls = useMemo(() => {
    const urls = new Set<string>();
    brands?.forEach(b => b.logo_url && urls.add(b.logo_url));
    ownedGiftCards.forEach(gc => gc.logo_url && urls.add(gc.logo_url));
    pendingGiftCards.forEach(gc => gc.logo_url && urls.add(gc.logo_url));
    return Array.from(urls);
  }, [brands, ownedGiftCards, pendingGiftCards]);
  const logos = useShopLogoImages(logoUrls);

  const bottomClearance =
    getTabBarBandHeight(SCREEN_HEIGHT, insets.bottom) + SCREEN_HEIGHT * 0.02;

  // the wishlist renders from redux; the browse fetch must not gate it
  const rowModels = useShopRowModels({
    section,
    brands: filteredBrands,
    giftCards: namedGiftCards,
    pendingGiftCards: namedPending,
    loading:
      section === 'my-cards'
        ? cardsLoading
        : section === 'wishlist'
          ? wishlistLoading
          : brandsLoading,
    error:
      section === 'my-cards'
        ? cardsError
        : section === 'wishlist'
          ? null
          : brandsError,
    loggedIn,
    wishlistSlugs,
    categoryLabel: selectedCategory
      ? formatCategoryLabel(selectedCategory)
      : null,
    bottomClearance,
  });

  // row expansion: the models never change — the canvas slides the rows
  // below the split and reveals the declarative panel with the progress
  const expandSplit = useSharedValue(EXPAND_IDLE_SPLIT);
  const expandExtras = useSharedValue(0);
  const expandProgress = useSharedValue(1);
  const expandChevronLift = useSharedValue(0);
  const ctaPressScale = useSharedValue(1);
  const clearExpanded = useCallback(() => {
    setExpandedPanel(null);
    expandSplit.value = EXPAND_IDLE_SPLIT;
    expandExtras.value = 0;
    expandProgress.value = 1;
  }, [expandSplit, expandExtras, expandProgress]);

  const {t} = useTranslation('nexusShop');

  const buildPanel = useCallback(
    (id: string): ShopExpandedPanelData | null => {
      const cellHeight = SCREEN_HEIGHT * SHOP_CELL_HEIGHT_RATIO;
      const layout = getShopRowLayout(SCREEN_WIDTH, SCREEN_HEIGHT);
      const model = rowModels.models.find(
        m => m.id === id && (m.kind === 'brand' || m.kind === 'giftcard'),
      );
      if (!model) {
        return null;
      }
      if (model.kind === 'brand') {
        const brand =
          brands?.find(b => b.slug === id) ??
          wishlistBrands?.find((b: Brand) => b.slug === id);
        if (!brand) {
          return null;
        }
        const symbol = formatCurrency(brand.currency);
        const values = buildDenominations(brand);
        const selected = selectedAmounts[id];
        const selectedIndex =
          selected === undefined ? -1 : values.indexOf(selected);
        return {
          id,
          kind: 'brand',
          splitY: model.top + cellHeight,
          extras: getShopBrandExpandHeight(SCREEN_HEIGHT),
          chevronLift: cellHeight / 2,
          symbol,
          chipValues: values,
          chipLabels: values.map(v => `${symbol}${formatDenomination(v)}`),
          selected: selectedIndex,
          ctaLabel:
            selectedIndex >= 0
              ? `${t('purchase')}  ${symbol}${formatDenomination(values[selectedIndex])}`
              : t('purchase'),
          code: '',
        };
      }
      const card = ownedGiftCards.find(gc => gc.id === id);
      if (!card) {
        return null;
      }
      return {
        id,
        kind: 'giftcard',
        splitY: model.top + cellHeight,
        extras: getShopCardExpandHeight(SCREEN_HEIGHT),
        chevronLift: layout.cellPadV + layout.chevronSize / 2,
        symbol: '',
        chipValues: [],
        chipLabels: [],
        selected: -1,
        ctaLabel: card.redeemCode
          ? ''
          : card.redeemUrl
            ? t('view_gift_card')
            : '',
        code: card.redeemCode ?? '',
      };
    },
    [
      rowModels.models,
      brands,
      wishlistBrands,
      ownedGiftCards,
      selectedAmounts,
      SCREEN_WIDTH,
      SCREEN_HEIGHT,
      t,
    ],
  );

  const openPanel = useCallback(
    (id: string) => {
      const panel = buildPanel(id);
      if (!panel) {
        return;
      }
      setExpandedPanel(panel);
      expandSplit.value = panel.splitY;
      expandExtras.value = panel.extras;
      expandChevronLift.value = panel.chevronLift;
      expandProgress.value = 0;
      expandProgress.value = withTiming(1, {
        duration: EXPAND_OPEN_MS,
        easing: EXPAND_OPEN_EASING,
      });
    },
    [buildPanel, expandSplit, expandExtras, expandChevronLift, expandProgress],
  );

  // opening another row folds the open one first, so both animate
  const swapPanels = useCallback(
    (id: string) => {
      clearExpanded();
      openPanel(id);
    },
    [clearExpanded, openPanel],
  );

  // fold shut, then hand over to whatever comes next
  const foldPanel = useCallback(
    (nextId: string | null) => {
      expandProgress.value = withTiming(
        0,
        {duration: EXPAND_CLOSE_MS, easing: EXPAND_CLOSE_EASING},
        finished => {
          if (finished) {
            if (nextId !== null) {
              runOnJS(swapPanels)(nextId);
            } else {
              runOnJS(clearExpanded)();
            }
          }
        },
      );
    },
    [expandProgress, swapPanels, clearExpanded],
  );

  const toggleExpanded = useCallback(
    (id: string) => {
      if (expandedPanel?.id === id) {
        foldPanel(null);
        return;
      }
      if (expandedPanel) {
        foldPanel(id);
        return;
      }
      openPanel(id);
    },
    [expandedPanel, foldPanel, openPanel],
  );

  // chip selection redraws only the declarative panel
  const selectChip = useCallback(
    (id: string, value: number) => {
      setSelectedAmounts(prev => ({...prev, [id]: value}));
      setExpandedPanel(prev => {
        if (!prev || prev.id !== id || prev.kind !== 'brand') {
          return prev;
        }
        const index = prev.chipValues.indexOf(value);
        return {
          ...prev,
          selected: index,
          ctaLabel:
            index >= 0
              ? `${t('purchase')}  ${prev.symbol}${formatDenomination(value)}`
              : t('purchase'),
        };
      });
    },
    [t],
  );

  const {panelNode, chevronNode} = useShopExpandedPanel(
    expandedPanel,
    ctaPressScale,
  );
  const panelHit = useMemo<ShopPanelHit | null>(
    () =>
      expandedPanel
        ? {
            id: expandedPanel.id,
            kind: expandedPanel.kind,
            splitY: expandedPanel.splitY,
            extras: expandedPanel.extras,
            chipValues: expandedPanel.chipValues,
            code: expandedPanel.code,
            hasCta: expandedPanel.ctaLabel !== '',
          }
        : null,
    [expandedPanel],
  );

  // collapse rows when the list underneath them changes meaning, and clear
  // the scroll now — the canvas draws the new rows from it this frame
  const setSectionAndReset = useCallback(
    (next: ShopSection) => {
      setSection(next);
      clearExpanded();
      shopScrollY.value = 0;
    },
    [clearExpanded, shopScrollY],
  );

  const handleRowAction = useCallback(
    (action: ShopRowAction) => {
      switch (action.type) {
        case 'toggle':
          toggleExpanded(action.id);
          break;
        case 'heart': {
          const brand =
            brands?.find(b => b.slug === action.id) ??
            wishlistBrands?.find((b: Brand) => b.slug === action.id);
          if (brand) {
            dispatch(syncWishlistToggle(brand));
          }
          break;
        }
        case 'chip':
          selectChip(action.id, action.value);
          break;
        case 'purchase': {
          const brand =
            brands?.find(b => b.slug === action.id) ??
            wishlistBrands?.find((b: Brand) => b.slug === action.id);
          if (brand) {
            navigation.navigate('NexusShopStack', {
              screen: 'PurchaseForm',
              params: {
                brand,
                initialAmount: selectedAmounts[action.id],
              },
            });
          }
          break;
        }
        case 'copy-code':
          Clipboard.setString(action.code);
          Alert.alert('Copied!', 'Gift card code copied to clipboard');
          break;
        case 'open-card': {
          const card = ownedGiftCards.find(gc => gc.id === action.id);
          if (card?.redeemUrl) {
            navigation.navigate('WebPage', {uri: card.redeemUrl});
          }
          break;
        }
        case 'open-pending': {
          const gc = pendingGiftCards.find(p => p.id === action.id);
          if (gc) {
            navigation.navigate('NexusShopStack', {
              screen: 'PendingGCDetails',
              params: {
                brand: brandNameBySlug.get(gc.brand) ?? gc.brand,
                amount: gc.amount,
                currency: gc.currency,
                paymentAmountLtc: gc.btcpayPaymentAmountLtc,
                paymentAddress: gc.btcpayPaymentAddress,
                pendingPurchaseId: gc.id,
              },
            });
          }
          break;
        }
        case 'filter':
          setCategoryPickerVisible(true);
          break;
        case 'retry':
          if (section === 'my-cards') {
            fetchCards();
          } else {
            fetchBrands();
          }
          break;
        case 'signin':
          navigation.navigate('NexusShopStack', {screen: 'SignUp'});
          break;
        default:
          break;
      }
    },
    [
      brands,
      wishlistBrands,
      ownedGiftCards,
      pendingGiftCards,
      brandNameBySlug,
      dispatch,
      navigation,
      section,
      fetchCards,
      fetchBrands,
      toggleExpanded,
      selectChip,
      selectedAmounts,
    ],
  );

  // wishlist is a logged-in section
  useEffect(() => {
    if (!loggedIn && section === 'wishlist') {
      setSectionAndReset('browse');
    }
  }, [loggedIn, section, setSectionAndReset]);

  // leaving the shop only closes the picker (it floats above the closing
  // surface). Search/panel state must NOT clear here: a row-model rebuild or
  // panel snap mid-close-fade is a visible glitch — that state simply dies
  // with the screen when the close pops it.
  const wasActive = useRef(active);
  useEffect(() => {
    if (wasActive.current && !active) {
      setCategoryPickerVisible(false);
    }
    wasActive.current = active;
  }, [active]);

  // stable identity while nothing changed, so the memoized surface holds
  return useMemo(
    () => ({
      section,
      setSection: setSectionAndReset,
      searchQuery,
      setSearchQuery,
      selectedCategory,
      setSelectedCategory,
      categoryPickerVisible,
      setCategoryPickerVisible,
      loggedIn,
      rowModels,
      logos,
      handleRowAction,
      refreshing,
      refresh,
      expandSplit,
      expandExtras,
      expandProgress,
      expandChevronLift,
      ctaPressScale,
      panelNode,
      chevronNode,
      panelHit,
    }),
    [
      section,
      setSectionAndReset,
      searchQuery,
      selectedCategory,
      setSelectedCategory,
      categoryPickerVisible,
      loggedIn,
      rowModels,
      logos,
      handleRowAction,
      refreshing,
      refresh,
      expandSplit,
      expandExtras,
      expandProgress,
      expandChevronLift,
      ctaPressScale,
      panelNode,
      chevronNode,
      panelHit,
    ],
  );
};
