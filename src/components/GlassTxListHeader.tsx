import React, {useContext, useMemo} from 'react';
import {Image, Pressable, StyleSheet, View} from 'react-native';
import {
  Canvas,
  Image as SkiaImage,
  RoundedRect,
  Shadow,
  useImage,
} from '@shopify/react-native-skia';

import TranslateText from './TranslateText';
import {ScreenSizeContext} from '../context/screenSize';
import {TX_TITLE_ROW_HEIGHT_RATIO} from './GlassTxRows';
import {getSearchButtonImpl} from '../config/perfHarness';

// Title row above the transaction list. Extracted from NewMain so the perf
// harness mounts the real thing rather than a copy of it.
//
// The search button is a third <Canvas> on the wallet sheet, which reads like an
// obvious thing to remove: rn-skia re-runs a canvas's useLayoutEffect on every
// render of its children, and this subtree re-renders on every fold, so each
// open/close pays a re-record plus a synchronous setJsiProperty submit.
// Measured, that costs nothing — a ~4ms submit once per 1200ms cycle is one
// frame in ~380, far under the noise floor, and it never even became an HWUI
// layer. The native equivalent below measured no better and its elevation
// shadow does not match. Kept as the A/B, not as the default. See
// bottomsheet-perf-plan.md 2g.

const searchIcon = require('../assets/icons/search-icon.png');

interface Props {
  onSearch: () => void;
}

// What production draws.
const SkiaSearchButton: React.FC<{screenHeight: number}> = ({screenHeight}) => {
  const image = useImage(searchIcon);
  const styles = getStyles(0, screenHeight);
  return (
    <Canvas style={styles.searchButton} pointerEvents="none">
      <RoundedRect
        x={screenHeight * 0.02}
        y={screenHeight * 0.01}
        width={screenHeight * 0.1}
        height={screenHeight * 0.05}
        color="white"
        r={screenHeight * 0.01}>
        <Shadow dx={0} dy={2} blur={4} color={'rgba(0, 0, 0, 0.07)'} />
      </RoundedRect>
      <SkiaImage
        image={image}
        x={screenHeight * 0.035}
        y={screenHeight * 0.025}
        width={screenHeight * 0.02}
        height={screenHeight * 0.02}
        fit="scaleDown"
      />
    </Canvas>
  );
};

const GlassTxListHeader: React.FC<Props> = ({onSearch}) => {
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = useMemo(
    () => getStyles(SCREEN_WIDTH, SCREEN_HEIGHT),
    [SCREEN_WIDTH, SCREEN_HEIGHT],
  );

  return (
    <View style={styles.titleRow}>
      <TranslateText
        textKey={'latest_txs'}
        domain={'main'}
        maxSizeInPixels={SCREEN_HEIGHT * 0.025}
        maxLengthInPixels={SCREEN_WIDTH * 0.8}
        textStyle={styles.titleText}
        numberOfLines={1}
      />

      <Pressable onPress={onSearch}>
        {getSearchButtonImpl() === 'skia' ? (
          <SkiaSearchButton screenHeight={SCREEN_HEIGHT} />
        ) : (
          // Harness only. Same geometry, including the pill running past the
          // right edge and being clipped there.
          <View style={styles.searchButton}>
            <View style={styles.searchPill} />
            <Image
              source={searchIcon}
              style={styles.searchIcon}
              resizeMode="contain"
            />
          </View>
        )}
      </Pressable>
    </View>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    titleRow: {
      width: '100%',
      height: screenHeight * TX_TITLE_ROW_HEIGHT_RATIO,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    titleText: {
      color: '#2E2E2E',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.025,
      fontWeight: '500',
      letterSpacing: -0.59,
      paddingLeft: screenWidth * 0.04,
    },
    searchButton: {
      width: screenHeight * 0.07,
      height: screenHeight * 0.07,
      // The pill is wider than this box on purpose; the canvas used to clip it
      // at the same edge.
      overflow: 'hidden',
    },
    searchPill: {
      position: 'absolute',
      left: screenHeight * 0.02,
      top: screenHeight * 0.01,
      width: screenHeight * 0.1,
      height: screenHeight * 0.05,
      borderRadius: screenHeight * 0.01,
      backgroundColor: 'white',
      // stands in for the Skia <Shadow dy={2} blur={4} rgba(0,0,0,0.07)>
      elevation: 2,
      shadowColor: 'rgba(0, 0, 0, 0.07)',
    },
    searchIcon: {
      position: 'absolute',
      left: screenHeight * 0.035,
      top: screenHeight * 0.025,
      width: screenHeight * 0.02,
      height: screenHeight * 0.02,
    },
  });

export default React.memo(GlassTxListHeader);
