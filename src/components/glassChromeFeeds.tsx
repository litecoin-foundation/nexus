import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type {SharedValue} from 'react-native-reanimated';
import type {SkPicture} from '@shopify/react-native-skia';

import type {GlassTxRowModels} from './GlassTxRows';
import type {ShopRowModels} from './GiftCardShop/GlassShopRows';
import type {ShopLogoImages} from './GiftCardShop/shopLogoImages';

// The glass tab bar and its canvas are app chrome above the navigator; the
// wallet and shop screens publish what the chrome draws through these feeds,
// the same channel pattern as cardUnderlay. Shared values keep their
// identity across publishes, so the canvas mappers never rebuild.

export interface GlassWalletFeed {
  rowModels: GlassTxRowModels;
  mainSheetsTranslationY: SharedValue<number>;
  txListScrollY: SharedValue<number>;
  listHeaderOffset: SharedValue<number>;
  showTxList: boolean;
  cardSwapOpacity: SharedValue<number>;
  contentActivity: SharedValue<number>;
  activeSheet: number;
  onSelectSection: (index: number) => void;
  // content drags shrink the bar; the shop's scroller reports through this
  onContentActivity: () => void;
  // wallet modals used to cover the in-screen bar; the chrome fades instead
  barSuppressed: boolean;
}

export interface GlassShopFeed {
  presented: boolean;
  // outlives the close animation so the rows fade out with it
  canvasActive: boolean;
  // true while the transition is past the hand-off point (0.4): the shop
  // holds the shared nav bar, the wallet reclaims it the moment this drops
  ownsHeader: boolean;
  rowModels: ShopRowModels;
  scrollY: SharedValue<number>;
  logos: ShopLogoImages;
  transition: SharedValue<number>;
  // the wallet top-half height the gradient card morphs from; the canvas
  // rides the same boundary so the sheet and its rows travel together
  morphFrom: SharedValue<number>;
  // px the card has shed above the rows: 0 on browse, the search block on
  // the sections that have no search pill. The rows ride the card's edge.
  headerShrink: SharedValue<number>;
  expandSplit: SharedValue<number>;
  expandExtras: SharedValue<number>;
  expandProgress: SharedValue<number>;
  expandChevronLift: SharedValue<number>;
  panelNode: React.ReactNode;
  chevronNode: React.ReactNode;
  onSelectSection: (index: number) => void;
  drawerOpen: boolean;
}

interface Feeds {
  wallet: GlassWalletFeed | null;
  shop: GlassShopFeed | null;
}

const WalletFeedContext = createContext<GlassWalletFeed | null>(null);
const ShopFeedContext = createContext<GlassShopFeed | null>(null);
const SetWalletContext = createContext<(feed: GlassWalletFeed | null) => void>(
  () => {},
);
const SetShopContext = createContext<(feed: GlassShopFeed | null) => void>(
  () => {},
);

// The one channel that runs the other way: the chrome's canvas records the
// rows on the UI thread and the wallet's overlays draw that same recording,
// rather than each shaping its own window of paragraphs.
export interface GlassRowsLayer {
  picture: SharedValue<SkPicture>;
  contentHeight: SharedValue<number>;
}

const RowsLayerContext = createContext<GlassRowsLayer | null>(null);
const SetRowsLayerContext = createContext<
  (layer: GlassRowsLayer | null) => void
>(() => {});

export const GlassChromeProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const [wallet, setWallet] = useState<GlassWalletFeed | null>(null);
  const [shop, setShop] = useState<GlassShopFeed | null>(null);
  const [rowsLayer, setRowsLayer] = useState<GlassRowsLayer | null>(null);
  return (
    <SetWalletContext.Provider value={setWallet}>
      <SetShopContext.Provider value={setShop}>
        <SetRowsLayerContext.Provider value={setRowsLayer}>
          <WalletFeedContext.Provider value={wallet}>
            <ShopFeedContext.Provider value={shop}>
              <RowsLayerContext.Provider value={rowsLayer}>
                {children}
              </RowsLayerContext.Provider>
            </ShopFeedContext.Provider>
          </WalletFeedContext.Provider>
        </SetRowsLayerContext.Provider>
      </SetShopContext.Provider>
    </SetWalletContext.Provider>
  );
};

// publish on every render so state-driven redraws flow through; clear on
// unmount. Callers memoize the feed so quiet renders publish the same one.
export const useGlassWalletFeedPublisher = (feed: GlassWalletFeed) => {
  const setWallet = useContext(SetWalletContext);
  useEffect(() => {
    setWallet(feed);
  }, [feed, setWallet]);
  useEffect(() => () => setWallet(null), [setWallet]);
};

export const useGlassShopFeedPublisher = (feed: GlassShopFeed) => {
  const setShop = useContext(SetShopContext);
  useEffect(() => {
    setShop(feed);
  }, [feed, setShop]);
  useEffect(() => () => setShop(null), [setShop]);
};

// Shared values keep their identity for the canvas's life, so a memoized
// layer publishes once and never re-renders subscribers again.
export const useGlassRowsLayerPublisher = (layer: GlassRowsLayer) => {
  const setRowsLayer = useContext(SetRowsLayerContext);
  useEffect(() => {
    setRowsLayer(layer);
    return () => setRowsLayer(null);
  }, [layer, setRowsLayer]);
};

export const useGlassRowsLayer = (): GlassRowsLayer | null =>
  useContext(RowsLayerContext);

// subscribe to ONE feed wherever only one is read — a screen that publishes
// the other must not re-render on its own publish
export const useGlassWalletFeed = (): GlassWalletFeed | null =>
  useContext(WalletFeedContext);

export const useGlassShopFeed = (): GlassShopFeed | null =>
  useContext(ShopFeedContext);

// for the chrome itself, which draws from both and publishes neither
export const useGlassChromeFeeds = (): Feeds => {
  const wallet = useContext(WalletFeedContext);
  const shop = useContext(ShopFeedContext);
  return useMemo(() => ({wallet, shop}), [wallet, shop]);
};
