import React, {useEffect} from 'react';
import {StyleSheet} from 'react-native';
import {Canvas, Group, Picture} from '@shopify/react-native-skia';
import {
  SharedValue,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';

import {useSkiaList} from './SkiaList';
import {glassTxRowCallbacks, useGlassTxRowContext} from './GlassTxSkiaRows';
import {GlassTxRowModels} from './GlassTxRows';

// The search screen's rows: the wallet's rows, recorded the same way, drawn
// in a canvas of the list's own. The wallet's live in the chrome canvas so
// the tab bar glass can refract them; there is no bar over the search, so
// nothing here has to leave the screen. Mounted as GlassTransactionList's
// rows layer, it fills the scroller's box: the first row sits the inset below
// the top, and everything scrolls by scrollY.

// stable identity keeps the Skia list row cache intact
const EMPTY_ROWS: GlassTxRowModels['models'] = [];

interface Props {
  rowModels: GlassTxRowModels;
  // Written on the UI thread by the scroller.
  scrollY: SharedValue<number>;
  // The scroller's content inset: where the first row starts.
  topInset: number;
  // The scroller's box.
  height: number;
}

const GlassSearchTxCanvas: React.FC<Props> = props => {
  const {rowModels, scrollY, topInset, height} = props;

  const headerOffset = useSharedValue(topInset);
  useEffect(() => {
    headerOffset.value = topInset;
  }, [topInset, headerOffset]);

  const rowContext = useGlassTxRowContext();
  const rowsReady = rowContext !== null;
  const skiaList = useSkiaList({
    ...glassTxRowCallbacks,
    data: rowsReady ? rowModels.models : EMPTY_ROWS,
    context: rowContext,
    scrollY,
    headerOffset,
    viewportHeight: height,
    enabled: rowsReady,
  });

  const contentTransform = useDerivedValue(() => [
    {translateY: headerOffset.value - scrollY.value},
  ]);

  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      {rowsReady ? (
        <Group transform={contentTransform}>
          <Picture picture={skiaList.picture} />
        </Group>
      ) : null}
    </Canvas>
  );
};

export default React.memo(GlassSearchTxCanvas);
