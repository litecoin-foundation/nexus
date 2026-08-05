import React, {useContext} from 'react';
import {StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {
  getMainSheetPoints,
  MAIN_BACKGROUND_COLOR,
  MAIN_OFFLINE_BACKGROUND_COLOR,
  MAIN_SHEET_BACKGROUND_COLOR,
  MAIN_TOP_FOLD_RADIUS_RATIO,
} from '../animations/mainTransition';
import {ScreenSizeContext} from '../context/screenSize';

interface Props {
  online: boolean;
}

const FoldedSkinView: React.FC<Props> = ({online}) => {
  const insets = useSafeAreaInsets();
  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);
  const {FOLD_SHEET_POINT} = getMainSheetPoints(SCREEN_HEIGHT, insets.top);
  const styles = getStyles(SCREEN_HEIGHT, FOLD_SHEET_POINT, online);

  return (
    <View style={styles.base} pointerEvents="none">
      <View style={styles.topCard} />
    </View>
  );
};

const getStyles = (
  screenHeight: number,
  foldedSheetPoint: number,
  online: boolean,
) =>
  StyleSheet.create({
    base: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: MAIN_SHEET_BACKGROUND_COLOR,
    },
    topCard: {
      width: '100%',
      height: foldedSheetPoint,
      backgroundColor: online
        ? MAIN_BACKGROUND_COLOR
        : MAIN_OFFLINE_BACKGROUND_COLOR,
      borderBottomLeftRadius: screenHeight * MAIN_TOP_FOLD_RADIUS_RATIO,
      borderBottomRightRadius: screenHeight * MAIN_TOP_FOLD_RADIUS_RATIO,
      overflow: 'hidden',
    },
  });

export default React.memo(FoldedSkinView);
