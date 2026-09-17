import React, {useContext, useMemo} from 'react';
import {Image, Pressable, StyleSheet, View} from 'react-native';
import Animated, {SharedValue} from 'react-native-reanimated';

import DropDownButton from './Buttons/DropDownButton';
import GlassHeaderSurface from './GlassHeaderSurface';
import TranslateText from './TranslateText';
import {GlassHeaderRects} from './glassSearchLayout';
import {ScreenSizeContext} from '../context/screenSize';

// The search screen's own header, the same arrangement NewMain has with
// MainHeader: the navigator's header for this route stays mounted but blank,
// and everything visible is drawn here. That is what lets the back button and
// the filter dropdown be glass — they need to sit on rects the Skia canvas
// knows about, which a navigator-supplied headerLeft/headerRight cannot do.
//
// Neither control paints its own surface: GlassHeaderSurface, the first child
// here, draws the lens under both, so the rest is icons, text and touch only.

const TITLE_FONT_RATIO = 0.02;
const BACK_ICON_RATIO = 0.018;
const PRESSED_OPACITY = 0.7;

interface Props {
  rects: GlassHeaderRects;
  onBack: () => void;
  // Fades the whole header: in with the search's arrival, out while the tx
  // detail sheet is up.
  fadeStyle: any;
  screenWidth: number;
  screenHeight: number;
  online: boolean;
  cardHeight: SharedValue<number>;
  privacyFilter: string;
  onSelectPrivacyFilter: (option: string) => void;
  privacyFilterOptions: string[];
  cellHeight: number;
  cellHeightExpandMultiplier: number;
  dropdownHeight: SharedValue<number>;
  interactive: boolean;
}

const SearchHeader: React.FC<Props> = props => {
  const {
    rects,
    onBack,
    fadeStyle,
    screenWidth,
    screenHeight,
    online,
    cardHeight,
    privacyFilter,
    onSelectPrivacyFilter,
    privacyFilterOptions,
    cellHeight,
    cellHeightExpandMultiplier,
    dropdownHeight,
    interactive,
  } = props;

  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);
  const styles = useMemo(() => getStyles(SCREEN_HEIGHT), [SCREEN_HEIGHT]);

  return (
    <Animated.View
      style={[styles.host, fadeStyle]}
      pointerEvents={interactive ? 'box-none' : 'none'}>
      <GlassHeaderSurface
        screenWidth={screenWidth}
        screenHeight={screenHeight}
        online={online}
        cardHeight={cardHeight}
        rects={rects}
        dropdownHeight={dropdownHeight}
      />

      <Pressable
        onPress={onBack}
        style={({pressed}) => [
          styles.back,
          {
            left: rects.back.x,
            top: rects.back.y,
            width: rects.back.width,
            height: rects.back.height,
          },
          pressed ? styles.pressed : null,
        ]}>
        <Image
          style={styles.backIcon}
          source={require('../assets/images/back-icon.png')}
        />
      </Pressable>

      <View
        style={[
          styles.title,
          {
            left: rects.titleLeft,
            top: rects.back.y,
            height: rects.back.height,
            right: rects.dropdown.width + (rects.back.x + rects.back.width),
          },
        ]}
        pointerEvents="none">
        <TranslateText
          textKey="transactions"
          domain="searchTab"
          maxSizeInPixels={SCREEN_HEIGHT * TITLE_FONT_RATIO}
          textStyle={styles.titleText}
          numberOfLines={1}
        />
      </View>
      <View
        style={[
          styles.dropdown,
          {
            left: rects.dropdown.x,
            top: rects.dropdown.y,
            width: rects.dropdown.width,
            height:
              cellHeight *
              cellHeightExpandMultiplier *
              privacyFilterOptions.length,
          },
        ]}
        pointerEvents="box-none">
        <DropDownButton
          initial={privacyFilter}
          options={privacyFilterOptions}
          chooseOptionCallback={onSelectPrivacyFilter}
          cellHeight={cellHeight}
          cellHeightExpandMultiplier={cellHeightExpandMultiplier}
          titleTextKey="type_filter"
          tickDisabled
          backgroundColor="transparent"
          heightValue={dropdownHeight}
          centerText
        />
      </View>
    </Animated.View>
  );
};

const getStyles = (screenHeight: number) =>
  StyleSheet.create({
    host: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 2,
    },
    back: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
    },
    backIcon: {
      width: screenHeight * BACK_ICON_RATIO,
      height: screenHeight * BACK_ICON_RATIO,
      resizeMode: 'contain',
      tintColor: '#ffffff',
    },
    pressed: {
      opacity: PRESSED_OPACITY,
    },
    title: {
      position: 'absolute',
      justifyContent: 'center',
      paddingLeft: screenHeight * 0.012,
    },
    titleText: {
      color: '#ffffff',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * TITLE_FONT_RATIO,
      fontStyle: 'normal',
      fontWeight: '700',
    },
    dropdown: {
      position: 'absolute',
    },
  });

export default React.memo(SearchHeader);
