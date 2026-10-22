import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {Alert} from 'react-native';
import {useIsFocused} from '@react-navigation/native';
import {getCountry} from 'react-native-localize';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Clipboard from '@react-native-clipboard/clipboard';
import type {SharedValue} from 'react-native-reanimated';

import {
  Brand,
  GiftCard,
  GiftCardClient,
  PendingGiftCardPurchase,
  TilloCategory,
  filterBrandsByCountry,
  formatCategoryLabel,
} from '../../services/giftcards';
import {
  ShopRowAction,
  ShopRowModels,
  ShopSection,
  useShopRowModels,
} from './GlassShopRows';
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
}

interface Params {
  navigation: any;
  active: boolean;
  requestedSection?: string;
  // the canvas draws from this; section changes must zero it synchronously
  shopScrollY: SharedValue<number>;
}

export const useShopScreenState = (params: Params): ShopScreenState => {
  const {navigation, active, requestedSection, shopScrollY} = params;

  const insets = useSafeAreaInsets();
  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);
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

  // A screen pushed over the shop (sign-up, purchase form, pending details)
  // leaves it mounted with `presented` still true, so the effect above never
  // runs on the way back and the list keeps whatever it held when the user
  // left — after a sign-up that is the logged-out (or failed) fetch. A push
  // blurs this screen and popping back focuses it again, so refresh on the
  // way back in.
  const isFocused = useIsFocused();
  const wasFocused = useRef(isFocused);
  useEffect(() => {
    const regainedFocus = isFocused && !wasFocused.current;
    wasFocused.current = isFocused;
    if (!regainedFocus || !activated) {
      return;
    }
    fetchBrands();
    if (section === 'my-cards') {
      fetchCards();
    }
    // same contract as above: refetch on the transition alone
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocused, activated]);

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

  // clear the scroll when the list changes meaning — the canvas draws the
  // new rows from it this frame
  const setSectionAndReset = useCallback(
    (next: ShopSection) => {
      setSection(next);
      shopScrollY.value = 0;
    },
    [shopScrollY],
  );

  const handleRowAction = useCallback(
    (action: ShopRowAction) => {
      switch (action.type) {
        case 'heart': {
          const brand =
            brands?.find(b => b.slug === action.id) ??
            wishlistBrands?.find((b: Brand) => b.slug === action.id);
          if (brand) {
            dispatch(syncWishlistToggle(brand));
          }
          break;
        }
        case 'purchase': {
          const brand =
            brands?.find(b => b.slug === action.id) ??
            wishlistBrands?.find((b: Brand) => b.slug === action.id);
          if (brand) {
            navigation.navigate('NexusShopStack', {
              screen: 'PurchaseForm',
              params: {brand},
            });
          }
          break;
        }
        // a redeem code is copied; otherwise the redeem page opens
        case 'open-card': {
          const card = ownedGiftCards.find(gc => gc.id === action.id);
          if (card?.redeemCode) {
            Clipboard.setString(card.redeemCode);
            Alert.alert('Copied!', 'Gift card code copied to clipboard');
          } else if (card?.redeemUrl) {
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
    ],
  );

  // wishlist is a logged-in section
  useEffect(() => {
    if (!loggedIn && section === 'wishlist') {
      setSectionAndReset('browse');
    }
  }, [loggedIn, section, setSectionAndReset]);

  // leaving the shop only closes the picker (it floats above the closing
  // surface). Search state must NOT clear here: a row-model rebuild
  // mid-close-fade is a visible glitch — that state simply dies with the
  // screen when the close pops it.
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
    ],
  );
};
