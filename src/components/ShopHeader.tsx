import React, {useContext, useEffect, useMemo} from 'react';
import {Image, StyleSheet, View} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import TranslateText from './TranslateText';
import {
  ScreenHeaderBackIcon,
  ScreenHeaderPill,
  useScreenHeaderLayout,
} from './ScreenHeader';
import {BACK_PILL_ASPECT} from './glassSearchLayout';
import {useGlassShopFeed} from './glassChromeFeeds';
import {ScreenSizeContext} from '../context/screenSize';
import {useAppSelector} from '../store/hooks';

// Height fractions, matching ScreenHeader's title
const TITLE_FONT_RATIO = 0.02;
const ACCOUNT_ICON_RATIO = 0.02;

// In after the shop's hand-off point and out ahead of it, so this crossfades
// with the wallet's MainHeader on the same transition
const ARRIVAL_RANGE = [0.45, 0.8];
const TITLE_RISE = 6;
const HIDE_MS = 250;

const ACTIVE_PILL_COLOR = '#0070F0';

interface Props {
  transition: SharedValue<number>;
  presented: boolean;
  drawerOpen: boolean;
  onBack: () => void;
  onToggleDrawer: () => void;
}

const ShopHeaderContent: React.FC<Props> = props => {
  const {transition, presented, drawerOpen, onBack, onToggleDrawer} = props;

  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);
  const styles = useMemo(() => getStyles(SCREEN_HEIGHT), [SCREEN_HEIGHT]);
  const {rects, paddingHorizontal, titleLeft} = useScreenHeaderLayout();
  const accountWidth = rects.back.height * BACK_PILL_ASPECT;

  const isCountryPickerOpen = useAppSelector(
    (state: any) => state.nexusshopaccount.isCountryPickerOpen,
  );

  // The back pill and title step aside for the open drawer; the account pill
  // stays as its toggle, except under the drawer's country picker.
  const drawerHide = useSharedValue(drawerOpen ? 0 : 1);
  useEffect(() => {
    drawerHide.value = withTiming(drawerOpen ? 0 : 1, {duration: HIDE_MS});
  }, [drawerOpen, drawerHide]);
  const pickerHide = useSharedValue(isCountryPickerOpen ? 0 : 1);
  useEffect(() => {
    pickerHide.value = withTiming(isCountryPickerOpen ? 0 : 1, {
      duration: HIDE_MS,
    });
  }, [isCountryPickerOpen, pickerHide]);

  const backStyle = useAnimatedStyle(() => ({
    opacity:
      interpolate(
        transition.value,
        ARRIVAL_RANGE,
        [0, 1],
        Extrapolation.CLAMP,
      ) * drawerHide.value,
  }));
  const titleStyle = useAnimatedStyle(() => {
    const arrived = interpolate(
      transition.value,
      ARRIVAL_RANGE,
      [0, 1],
      Extrapolation.CLAMP,
    );
    return {
      opacity: arrived * drawerHide.value,
      transform: [{translateY: (1 - arrived) * TITLE_RISE}],
    };
  });
  const accountStyle = useAnimatedStyle(() => ({
    opacity:
      interpolate(
        transition.value,
        ARRIVAL_RANGE,
        [0, 1],
        Extrapolation.CLAMP,
      ) * pickerHide.value,
  }));

  return (
    <View style={styles.host} pointerEvents={presented ? 'box-none' : 'none'}>
      <Animated.View
        style={[
          styles.absolute,
          {left: rects.back.x, top: rects.back.y},
          backStyle,
        ]}
        pointerEvents={drawerOpen ? 'none' : 'auto'}>
        <ScreenHeaderPill back onPress={onBack}>
          <ScreenHeaderBackIcon />
        </ScreenHeaderPill>
      </Animated.View>

      <Animated.View
        style={[
          styles.title,
          {
            left: titleLeft,
            top: rects.back.y,
            height: rects.back.height,
            right: paddingHorizontal + accountWidth,
          },
          titleStyle,
        ]}
        pointerEvents="none">
        <TranslateText
          textKey="nexus_shop"
          domain="nexusShop"
          maxSizeInPixels={SCREEN_HEIGHT * TITLE_FONT_RATIO}
          textStyle={styles.titleText}
          numberOfLines={1}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.absolute,
          {right: paddingHorizontal, top: rects.back.y},
          accountStyle,
        ]}
        pointerEvents={isCountryPickerOpen ? 'none' : 'auto'}>
        <ScreenHeaderPill
          back
          onPress={onToggleDrawer}
          color={drawerOpen ? ACTIVE_PILL_COLOR : undefined}>
          <Image
            style={styles.accountIcon}
            source={require('../assets/icons/user.png')}
          />
        </ScreenHeaderPill>
      </Animated.View>
    </View>
  );
};

const MemoShopHeaderContent = React.memo(ShopHeaderContent);

const ShopHeader: React.FC = () => {
  const shop = useGlassShopFeed();
  if (!shop) {
    return null;
  }
  return (
    <MemoShopHeaderContent
      transition={shop.transition}
      presented={shop.presented}
      drawerOpen={shop.drawerOpen}
      onBack={shop.onBack}
      onToggleDrawer={shop.onToggleDrawer}
    />
  );
};

const getStyles = (screenHeight: number) =>
  StyleSheet.create({
    host: {
      ...StyleSheet.absoluteFill,
      zIndex: 2,
    },
    absolute: {
      position: 'absolute',
    },
    title: {
      position: 'absolute',
      justifyContent: 'center',
    },
    titleText: {
      color: '#ffffff',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * TITLE_FONT_RATIO,
      fontStyle: 'normal',
      fontWeight: '700',
    },
    accountIcon: {
      width: screenHeight * ACCOUNT_ICON_RATIO,
      height: screenHeight * ACCOUNT_ICON_RATIO,
      resizeMode: 'contain',
    },
  });

export default ShopHeader;
