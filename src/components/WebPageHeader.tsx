import React, {useCallback, useContext, useMemo} from 'react';
import {Image, StyleSheet, View} from 'react-native';
import Animated from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import {useNavigation} from '@react-navigation/native';

import TranslateText from './TranslateText';
import {
  PADDING_HORIZONTAL_RATIO,
  ScreenHeaderBackIcon,
  ScreenHeaderPill,
} from './ScreenHeader';
import {BACK_ICON_RATIO} from './SearchHeader';
import {GlassHeaderRects} from './glassSearchLayout';
import {ScreenSizeContext} from '../context/screenSize';

// Height fractions, matching ScreenHeader's title
const TITLE_FONT_RATIO = 0.02;
const TITLE_PADDING_RATIO = 0.012;
const FOOTER_PADDING_VERTICAL_RATIO = 0.01;

const DISABLED_OPACITY = 0.4;

const GRADIENT_COLORS = ['#CFE2FD', '#FFFFFF'];
const PILL_COLOR = 'rgba(130, 130, 130, 0.5)';
const TITLE_COLOR = '#2E2E2E';

const getDomain = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
};

interface Props {
  url: string;
  isLoading: boolean;
  onRefresh: () => void;
  cardHeight: number;
  rects: GlassHeaderRects;
  fadeStyle: any;
}

const WebPageHeader: React.FC<Props> = props => {
  const {url, isLoading, onRefresh, cardHeight, rects, fadeStyle} = props;

  const navigation = useNavigation();
  const goBack = useCallback(() => navigation.goBack(), [navigation]);

  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);
  const styles = useMemo(
    () => getStyles(SCREEN_HEIGHT, cardHeight),
    [SCREEN_HEIGHT, cardHeight],
  );

  return (
    <>
      <View style={styles.card} pointerEvents="none">
        <LinearGradient
          style={StyleSheet.absoluteFill}
          colors={GRADIENT_COLORS}
        />
      </View>
      <Animated.View style={[styles.host, fadeStyle]} pointerEvents="box-none">
        <ScreenHeaderPill
          onPress={goBack}
          color={PILL_COLOR}
          style={[
            styles.absolute,
            {
              left: rects.back.x,
              top: rects.back.y,
              width: rects.back.width,
              height: rects.back.height,
            },
          ]}>
          <Image
            style={styles.icon}
            source={require('../assets/images/close-white.png')}
          />
        </ScreenHeaderPill>

        <ScreenHeaderPill
          onPress={onRefresh}
          color={PILL_COLOR}
          style={[
            styles.absolute,
            {
              // Mirrors the back pill on the right
              right: rects.back.x,
              top: rects.back.y,
              width: rects.back.width,
              height: rects.back.height,
            },
          ]}>
          <Image
            style={styles.icon}
            source={
              isLoading
                ? require('../assets/images/close-white.png')
                : require('../assets/images/refresh.png')
            }
          />
        </ScreenHeaderPill>

        <View
          style={[
            styles.title,
            {
              // Mirrors the back pill's inset so the domain sits mid-screen
              left: rects.titleLeft,
              right: rects.titleLeft,
              top: rects.back.y,
              height: rects.back.height,
            },
          ]}
          pointerEvents="none">
          <TranslateText
            textValue={getDomain(url)}
            maxSizeInPixels={SCREEN_HEIGHT * TITLE_FONT_RATIO}
            textStyle={styles.titleText}
            numberOfLines={1}
          />
        </View>
      </Animated.View>
    </>
  );
};

const getStyles = (screenHeight: number, cardHeight: number) =>
  StyleSheet.create({
    card: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: cardHeight,
      zIndex: 1,
      overflow: 'hidden',
    },
    host: {
      ...StyleSheet.absoluteFill,
      zIndex: 2,
    },
    absolute: {
      position: 'absolute',
    },
    icon: {
      width: screenHeight * BACK_ICON_RATIO,
      height: screenHeight * BACK_ICON_RATIO,
      resizeMode: 'contain',
      tintColor: '#ffffff',
    },
    title: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: screenHeight * TITLE_PADDING_RATIO,
    },
    titleText: {
      color: TITLE_COLOR,
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * TITLE_FONT_RATIO,
      fontStyle: 'normal',
      fontWeight: '700',
    },
  });

interface FooterPillProps {
  enabled: boolean;
  onPress: () => void;
  children: React.ReactNode;
}

const FooterPill: React.FC<FooterPillProps> = props => {
  const {enabled, onPress, children} = props;
  return (
    <View
      style={enabled ? null : footerStyles.disabled}
      pointerEvents={enabled ? 'auto' : 'none'}>
      <ScreenHeaderPill back onPress={onPress} color={PILL_COLOR}>
        {children}
      </ScreenHeaderPill>
    </View>
  );
};

interface FooterProps {
  canGoBack: boolean;
  canGoForward: boolean;
  onBack: () => void;
  onForward: () => void;
}

// The white strip under the page, its pills matching the header's
export const WebPageFooter: React.FC<FooterProps> = props => {
  const {canGoBack, canGoForward, onBack, onForward} = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = useMemo(
    () => getFooterStyles(SCREEN_WIDTH, SCREEN_HEIGHT),
    [SCREEN_WIDTH, SCREEN_HEIGHT],
  );

  return (
    <View style={styles.footer}>
      <FooterPill enabled={canGoBack} onPress={onBack}>
        <ScreenHeaderBackIcon />
      </FooterPill>
      <FooterPill enabled={canGoForward} onPress={onForward}>
        <View style={footerStyles.mirrored}>
          <ScreenHeaderBackIcon />
        </View>
      </FooterPill>
    </View>
  );
};

const footerStyles = StyleSheet.create({
  disabled: {
    opacity: DISABLED_OPACITY,
  },
  mirrored: {
    transform: [{scaleX: -1}],
  },
});

const getFooterStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: screenHeight * FOOTER_PADDING_VERTICAL_RATIO,
      paddingHorizontal: screenWidth * PADDING_HORIZONTAL_RATIO,
      backgroundColor: '#ffffff',
    },
  });

export default React.memo(WebPageHeader);
