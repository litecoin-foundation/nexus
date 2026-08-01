import React, {useContext, useMemo} from 'react';
import {Platform, StyleSheet, View} from 'react-native';
import {Gesture} from 'react-native-gesture-handler';
import {SharedValue} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import GlassTabButton from './Buttons/GlassTabButton';
import {ScreenSizeContext} from '../context/screenSize';
import {
  getNewMainSheetPoints,
  makeSheetSnapHandlers,
} from '../animations/useNewMainAnims';
import {
  getGlassTabLayouts,
  glassTabSplitProgressAt,
  GLASS_TAB_IDS,
} from './glassTabLayout';

const SPLIT_TOUCH_THRESHOLD = 0.82;

// Per-slot configs keyed by GLASS_TAB_IDS.
const TAB_CONFIGS = [
  {
    textKey: 'buy',
    imageSource: require('../assets/icons/buy-icon.png'),
    foldedTextKey: 'trade',
    foldedImageSource: require('../assets/icons/convert-icon.png'),
    tradeAnchor: true,
    lateSplitContent: true,
  },
  {
    textKey: 'sell',
    imageSource: require('../assets/icons/sell-icon.png'),
    hideFoldedContent: true,
    lateSplitContent: true,
  },
  {textKey: 'send', imageSource: require('../assets/icons/send-icon.png')},
  {
    textKey: 'receive',
    imageSource: require('../assets/icons/receive-icon.png'),
  },
].map((config, i) => ({...config, tab: GLASS_TAB_IDS[i]}));

interface Props {
  mainSheetsTranslationY: SharedValue<number>;
  mainSheetsTranslationYStart: SharedValue<number>;
  folded: boolean;
  foldUnfold: (isFolded: boolean) => void;
  activeTab: number;
  onPressTab: (tab: number) => void;
  isInternetReachable: boolean;
}

const GlassTabSelector: React.FC<Props> = props => {
  const {
    mainSheetsTranslationY,
    mainSheetsTranslationYStart,
    folded,
    foldUnfold,
    activeTab,
    onPressTab,
    isInternetReachable,
  } = props;

  const insets = useSafeAreaInsets();
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);

  const layouts = getGlassTabLayouts(SCREEN_WIDTH, SCREEN_HEIGHT);
  const {UNFOLD_SHEET_POINT, FOLD_SHEET_POINT} = getNewMainSheetPoints(
    SCREEN_HEIGHT,
    insets.top,
  );

  // Dragging on a button moves the sheet. The handlers capture `folded`, so
  // that is the only reason they ever need rebuilding.
  const {onDragUpdate, onEndTrigger} = useMemo(
    () =>
      makeSheetSnapHandlers({
        mainSheetsTranslationY,
        mainSheetsTranslationYStart,
        folded,
        foldUnfold,
        screenHeight: SCREEN_HEIGHT,
        topInset: insets.top,
      }),
    [
      mainSheetsTranslationY,
      mainSheetsTranslationYStart,
      folded,
      foldUnfold,
      SCREEN_HEIGHT,
      insets.top,
    ],
  );

  // One gesture per button, rebuilt only when the handlers change. The
  // handlers close over `folded`, so that is what actually gates it; building
  // them inline meant four fresh Gesture objects and four config pushes on
  // every render of this screen.
  const dragGestures = useMemo(
    () =>
      TAB_CONFIGS.map(() => {
        const baseGesture = Gesture.Pan();
        if (Platform.OS === 'android') {
          baseGesture.activeOffsetY([-15, 15]);
        }
        return baseGesture
          .onUpdate(e => {
            'worklet';
            onDragUpdate(e.translationY);
          })
          .onEnd(onEndTrigger);
      }),
    [onDragUpdate, onEndTrigger],
  );

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      {TAB_CONFIGS.map((config, i) => (
        <GlassTabButton
          key={config.tab}
          textKey={config.textKey}
          imageSource={config.imageSource}
          foldedTextKey={config.foldedTextKey}
          foldedImageSource={config.foldedImageSource}
          hideFoldedContent={config.hideFoldedContent}
          lateSplitContent={config.lateSplitContent}
          pointerEvents={config.hideFoldedContent && folded ? 'none' : 'auto'}
          handlePress={() => {
            const splitProgress = glassTabSplitProgressAt(
              mainSheetsTranslationY.value,
              UNFOLD_SHEET_POINT,
              FOLD_SHEET_POINT,
            );
            if (
              (config.tradeAnchor || config.hideFoldedContent) &&
              splitProgress < SPLIT_TOUCH_THRESHOLD
            ) {
              if (config.tradeAnchor && folded) {
                foldUnfold(folded);
              }
              return;
            }
            onPressTab(config.tab);
          }}
          active={activeTab === config.tab}
          // Receive works offline, everything else needs a connection.
          disabled={config.tab === 5 ? false : !isInternetReachable}
          folded={folded}
          mainSheetsTranslationY={mainSheetsTranslationY}
          layout={layouts[i]}
          dragGesture={dragGestures[i]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default GlassTabSelector;
