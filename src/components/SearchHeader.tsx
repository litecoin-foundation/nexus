import React, {useContext, useMemo, useState} from 'react';
import {Image, Pressable, StyleSheet, View} from 'react-native';
import Animated, {SharedValue} from 'react-native-reanimated';
import {useTranslation} from 'react-i18next';

import GlassHeaderSurface from './GlassHeaderSurface';
import TranslateText from './TranslateText';
import {GlassHeaderRects} from './glassSearchLayout';
import {ScreenSizeContext} from '../context/screenSize';

// The search screen's own header, the same arrangement NewMain has with
// MainHeader: the navigator's header for this route stays mounted but blank,
// and everything visible is drawn here. That is what lets the back button and
// the private toggle be glass — they need to sit on rects the Skia canvas
// knows about, which a navigator-supplied headerLeft/headerRight cannot do.
//
// Neither pill paints its own surface: GlassHeaderSurface, the first child
// here, draws the lens under both, so the rest is icon, text and touch only.
// The toggle, switched on, is the exception: it turns solid white.

const ENABLE_GLASS = false;
export const FLAT_PILL_COLOR = '#8FBCFB80';
const ACTIVE_PILL_COLOR = '#ffffff';
const ACTIVE_LABEL_COLOR = '#2C72FF';

const TITLE_FONT_RATIO = 0.02;
export const BACK_ICON_RATIO = 0.018;
const PRIVATE_LABEL_FONT_RATIO = 0.013;
const PRIVATE_LABEL_PADDING_RATIO = 0.04;
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
  privateOnly: boolean;
  onTogglePrivate: () => void;
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
    privateOnly,
    onTogglePrivate,
    interactive,
  } = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = useMemo(
    () => getStyles(SCREEN_WIDTH, SCREEN_HEIGHT),
    [SCREEN_WIDTH, SCREEN_HEIGHT],
  );
  const {t} = useTranslation('searchTab');

  const toggleRight = rects.dropdown.x + rects.dropdown.width;
  const [toggleWidth, setToggleWidth] = useState(rects.dropdown.width);
  const toggleX = toggleRight - toggleWidth;
  const glassRects = useMemo(
    () => ({
      ...rects,
      dropdown: {...rects.dropdown, x: toggleX, width: toggleWidth},
    }),
    [rects, toggleX, toggleWidth],
  );

  return (
    <Animated.View
      style={[styles.host, fadeStyle]}
      pointerEvents={interactive ? 'box-none' : 'none'}>
      {ENABLE_GLASS ? (
        <GlassHeaderSurface
          screenWidth={screenWidth}
          screenHeight={screenHeight}
          online={online}
          cardHeight={cardHeight}
          rects={glassRects}
        />
      ) : null}

      <Pressable
        onPress={onBack}
        style={({pressed}) => [
          styles.pill,
          {
            left: rects.back.x,
            top: rects.back.y,
            width: rects.back.width,
            height: rects.back.height,
            borderRadius: rects.back.height / 2,
          },
          ENABLE_GLASS ? null : styles.flatPill,
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
            right: screenWidth - toggleX,
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

      <Pressable
        onPress={onTogglePrivate}
        accessibilityRole="switch"
        accessibilityLabel={t('mweb')}
        accessibilityState={{checked: privateOnly}}
        onLayout={e => setToggleWidth(e.nativeEvent.layout.width)}
        style={({pressed}) => [
          styles.pill,
          styles.privatePill,
          {
            right: screenWidth - toggleRight,
            top: rects.dropdown.y,
            minWidth: rects.dropdown.width,
            height: rects.dropdown.height,
            borderRadius: rects.dropdown.height / 2,
          },
          privateOnly
            ? styles.activePill
            : ENABLE_GLASS
              ? null
              : styles.flatPill,
          pressed ? styles.pressed : null,
        ]}>
        <TranslateText
          textValue={t('mweb').toUpperCase()}
          maxSizeInPixels={SCREEN_HEIGHT * PRIVATE_LABEL_FONT_RATIO}
          textStyle={[
            styles.privateLabel,
            privateOnly ? styles.privateLabelActive : null,
          ]}
          numberOfLines={1}
        />
      </Pressable>
    </Animated.View>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    host: {
      ...StyleSheet.absoluteFill,
      zIndex: 2,
    },
    pill: {
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
    privatePill: {
      paddingHorizontal: screenWidth * PRIVATE_LABEL_PADDING_RATIO,
    },
    privateLabel: {
      color: '#ffffff',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * PRIVATE_LABEL_FONT_RATIO,
      fontStyle: 'normal',
      fontWeight: '700',
    },
    privateLabelActive: {
      color: ACTIVE_LABEL_COLOR,
    },
    flatPill: {
      backgroundColor: FLAT_PILL_COLOR,
    },
    activePill: {
      backgroundColor: ACTIVE_PILL_COLOR,
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
  });

export default React.memo(SearchHeader);
