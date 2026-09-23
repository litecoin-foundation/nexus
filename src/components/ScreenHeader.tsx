import React, {useCallback, useContext, useMemo} from 'react';
import {Image, Pressable, StyleSheet, View} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {StackNavigationOptions} from '@react-navigation/stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';

import TranslateText from './TranslateText';
import {BACK_ICON_RATIO, FLAT_PILL_COLOR} from './SearchHeader';
import {
  BACK_PILL_ASPECT,
  getGlassHeaderRects,
  GLASS_HEADER_PILL_HEIGHT_RATIO,
  GlassHeaderRects,
} from './glassSearchLayout';
import {useHeaderHeight} from './useHeaderHeight';
import {SKIN_GRADIENT_COLORS, SKIN_GRADIENT_LOCATIONS} from './FoldedSkinView';
import {CARD_FOLD_RADIUS_RATIO} from '../animations/useNewMainAnims';
import {FADE_EASING, OPEN_MS} from '../animations/screenTransitions';
import {ScreenSizeContext} from '../context/screenSize';

// Width fractions
export const PADDING_HORIZONTAL_RATIO = 0.04;
const BUTTON_PADDING_RATIO = 0.04;
// Height fractions
const HEADER_GAP_RATIO = 0;
const HEADER_GRADIENT_EXTEND_RATIO = 0.1;
const TITLE_FONT_RATIO = 0.02;
const TITLE_PADDING_LEFT_RATIO = 0.012;
const BUTTON_FONT_RATIO = 0.013;

const PRESSED_OPACITY = 0.7;

export const ScreenHeaderNavigationOptions: StackNavigationOptions = {
  headerShown: true,
  headerTransparent: true,
  headerTitle: () => null,
  headerLeft: () => null,
  headerRight: () => null,
};

export const useScreenHeaderLayout = () => {
  const {width, height} = useContext(ScreenSizeContext);
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const paddingHorizontal = width * PADDING_HORIZONTAL_RATIO;
  const rects = useMemo(
    () =>
      getGlassHeaderRects({
        screenWidth: width,
        screenHeight: height,
        topInset: insets.top,
        rowHeight: headerHeight - insets.top,
        paddingHorizontal,
        dropdownWidth: 0,
      }),
    [width, height, insets.top, headerHeight, paddingHorizontal],
  );
  const cardHeight = headerHeight + height * HEADER_GAP_RATIO;
  const titleLeft = rects.titleLeft + height * TITLE_PADDING_LEFT_RATIO;
  return {headerHeight, cardHeight, rects, paddingHorizontal, titleLeft};
};

export const useScreenHeaderArrival = () => {
  const arrival = useSharedValue(0);
  useFocusEffect(
    useCallback(() => {
      arrival.value = withTiming(1, {duration: OPEN_MS, easing: FADE_EASING});
    }, [arrival]),
  );
  return useAnimatedStyle(() => ({opacity: arrival.value}));
};

interface CardProps {
  cardHeight: number;
}

export const ScreenHeaderCard: React.FC<CardProps> = props => {
  const {cardHeight} = props;
  const {height} = useContext(ScreenSizeContext);
  const styles = useMemo(
    () => getCardStyles(height, cardHeight),
    [height, cardHeight],
  );
  return (
    <View style={styles.card} pointerEvents="none">
      <LinearGradient
        style={styles.gradient}
        colors={SKIN_GRADIENT_COLORS}
        locations={SKIN_GRADIENT_LOCATIONS}
      />
    </View>
  );
};

const getCardStyles = (screenHeight: number, cardHeight: number) =>
  StyleSheet.create({
    card: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: cardHeight,
      zIndex: 1,
      borderBottomLeftRadius: screenHeight * CARD_FOLD_RADIUS_RATIO,
      borderBottomRightRadius: screenHeight * CARD_FOLD_RADIUS_RATIO,
      borderCurve: 'continuous',
      overflow: 'hidden',
    },
    gradient: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: cardHeight + screenHeight * HEADER_GRADIENT_EXTEND_RATIO,
    },
  });

interface PillProps {
  onPress: () => void;
  style?: any;
  color?: string;
  children?: React.ReactNode;
}

export const ScreenHeaderPill: React.FC<PillProps> = props => {
  const {onPress, style, color, children} = props;
  const {height} = useContext(ScreenSizeContext);
  const styles = useMemo(() => getPillStyles(height), [height]);
  return (
    <Pressable
      onPress={onPress}
      style={({pressed}) => [
        styles.pill,
        color ? {backgroundColor: color} : null,
        style,
        pressed ? styles.pressed : null,
      ]}>
      {children}
    </Pressable>
  );
};

export const ScreenHeaderBackIcon: React.FC = () => {
  const {height} = useContext(ScreenSizeContext);
  const styles = useMemo(() => getPillStyles(height), [height]);
  return (
    <Image
      style={styles.backIcon}
      source={require('../assets/images/back-icon.png')}
    />
  );
};

const getPillStyles = (screenHeight: number) => {
  const pillHeight = screenHeight * GLASS_HEADER_PILL_HEIGHT_RATIO;
  return StyleSheet.create({
    pill: {
      width: pillHeight * BACK_PILL_ASPECT,
      height: pillHeight,
      borderRadius: pillHeight / 2,
      backgroundColor: FLAT_PILL_COLOR,
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
  });
};

interface Props {
  rects: GlassHeaderRects;
  paddingHorizontal: number;
  titleKey?: string;
  titleDomain?: string;
  onBack?: () => void;
  rightTextKey?: string;
  rightTextDomain?: string;
  onRightPress?: () => void;
  fadeStyle: any;
  interactive?: boolean;
  pillColor?: string;
}

const ScreenHeader: React.FC<Props> = props => {
  const {
    rects,
    paddingHorizontal,
    titleKey,
    titleDomain,
    onBack,
    rightTextKey,
    rightTextDomain,
    onRightPress,
    fadeStyle,
    interactive = true,
    pillColor,
  } = props;

  const navigation = useNavigation();
  const goBack = useCallback(() => navigation.goBack(), [navigation]);

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = useMemo(
    () => getStyles(SCREEN_WIDTH, SCREEN_HEIGHT),
    [SCREEN_WIDTH, SCREEN_HEIGHT],
  );
  const {t} = useTranslation(rightTextDomain);

  return (
    <Animated.View
      style={[styles.host, fadeStyle]}
      pointerEvents={interactive ? 'box-none' : 'none'}>
      <ScreenHeaderPill
        onPress={onBack ?? goBack}
        color={pillColor}
        style={[
          styles.absolute,
          {
            left: rects.back.x,
            top: rects.back.y,
            width: rects.back.width,
            height: rects.back.height,
          },
        ]}>
        <ScreenHeaderBackIcon />
      </ScreenHeaderPill>

      {titleKey ? (
        <View
          style={[
            styles.title,
            {
              left: rects.titleLeft,
              top: rects.back.y,
              height: rects.back.height,
              right: paddingHorizontal,
            },
          ]}
          pointerEvents="none">
          <TranslateText
            textKey={titleKey}
            domain={titleDomain}
            maxSizeInPixels={SCREEN_HEIGHT * TITLE_FONT_RATIO}
            textStyle={styles.titleText}
            numberOfLines={1}
          />
        </View>
      ) : null}

      {rightTextKey && onRightPress ? (
        <ScreenHeaderPill
          onPress={onRightPress}
          color={pillColor}
          style={[
            styles.absolute,
            styles.rightButton,
            {
              right: paddingHorizontal,
              top: rects.dropdown.y,
              height: rects.dropdown.height,
            },
          ]}>
          <TranslateText
            textValue={t(rightTextKey).toUpperCase()}
            maxSizeInPixels={SCREEN_HEIGHT * TITLE_FONT_RATIO}
            textStyle={styles.rightButtonText}
            numberOfLines={1}
          />
        </ScreenHeaderPill>
      ) : null}
    </Animated.View>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    host: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 2,
    },
    absolute: {
      position: 'absolute',
    },
    title: {
      position: 'absolute',
      justifyContent: 'center',
      paddingLeft: screenHeight * TITLE_PADDING_LEFT_RATIO,
    },
    titleText: {
      color: '#ffffff',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * TITLE_FONT_RATIO,
      fontStyle: 'normal',
      fontWeight: '700',
    },
    rightButton: {
      width: undefined,
      paddingHorizontal: screenWidth * BUTTON_PADDING_RATIO,
    },
    rightButtonText: {
      color: '#ffffff',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * BUTTON_FONT_RATIO,
      fontStyle: 'normal',
      fontWeight: '700',
    },
  });

export default React.memo(ScreenHeader);
