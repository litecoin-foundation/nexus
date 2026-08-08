import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type {SharedValue} from 'react-native-reanimated';

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

const FeedsContext = createContext<Feeds>({wallet: null, shop: null});
const SetWalletContext = createContext<(feed: GlassWalletFeed | null) => void>(
  () => {},
);
const SetShopContext = createContext<(feed: GlassShopFeed | null) => void>(
  () => {},
);

export const GlassChromeProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const [wallet, setWallet] = useState<GlassWalletFeed | null>(null);
  const [shop, setShop] = useState<GlassShopFeed | null>(null);
  // derived in render, NOT via an effect: consumers must see publishes and
  // teardowns in the same commit, or the chrome draws from a dead feed
  const feeds = useMemo<Feeds>(() => ({wallet, shop}), [wallet, shop]);
  return (
    <SetWalletContext.Provider value={setWallet}>
      <SetShopContext.Provider value={setShop}>
        <FeedsContext.Provider value={feeds}>{children}</FeedsContext.Provider>
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

export const useGlassChromeFeeds = (): Feeds => useContext(FeedsContext);
