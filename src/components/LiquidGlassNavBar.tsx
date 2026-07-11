import React, {useContext, useEffect, useCallback} from 'react';
import {
  View,
  Image,
  Pressable,
  StyleSheet,
  ImageSourcePropType,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {scheduleOnRN} from 'react-native-worklets';
import {GlassView, isLiquidGlassAvailable} from 'expo-glass-effect';
import {BlurView} from 'expo-blur';

import TranslateText from './TranslateText';
import {ScreenSizeContext} from '../context/screenSize';

const ACTIVE_COLOR = '#000000';
const INACTIVE_COLOR = '#000';
const GLASS_TINT = 'rgba(105, 165, 255, 0.3)';
const PILL_PADDING = 5;

// activeTab values on Main duplicated by this bar
const TABS = [0, 4, 5];

interface NavItem {
  tab: number;
  textKey: string;
  imageSource: ImageSourcePropType;
  disabled?: boolean;
}

interface Props {
  activeTab: number;
  onTabPress: (tab: number) => void;
  sendDisabled?: boolean;
}

const LiquidGlassNavBar: React.FC<Props> = props => {
  const {activeTab, onTabPress, sendDisabled} = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const insets = useSafeAreaInsets();

  const barWidth = SCREEN_WIDTH * 0.7;
  const barHeight = SCREEN_HEIGHT * 0.075;
  const itemWidth = barWidth / TABS.length;
  const pillWidth = itemWidth - PILL_PADDING * 2;
  const styles = getStyles(
    SCREEN_HEIGHT,
    insets.bottom,
    barWidth,
    barHeight,
    pillWidth,
  );

  const activeIndex = TABS.indexOf(activeTab);

  const pillX = useSharedValue(
    PILL_PADDING + (activeIndex >= 0 ? activeIndex : 0) * itemWidth,
  );
  const pillOpacity = useSharedValue(activeIndex >= 0 ? 1 : 0);

  useEffect(() => {
    if (activeIndex >= 0) {
      pillX.value = withSpring(PILL_PADDING + activeIndex * itemWidth, {
        mass: 0.5,
      });
      pillOpacity.value = withTiming(1, {duration: 150});
    } else {
      pillOpacity.value = withTiming(0, {duration: 150});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, itemWidth]);

  const selectIndex = useCallback(
    (index: number) => {
      const tab = TABS[index];
      if (tab === 4 && sendDisabled) {
        // spring back to the current selection
        if (activeIndex >= 0) {
          pillX.value = withSpring(PILL_PADDING + activeIndex * itemWidth, {
            mass: 0.5,
          });
        } else {
          pillOpacity.value = withTiming(0, {duration: 150});
        }
        return;
      }
      if (tab === activeTab) {
        pillX.value = withSpring(PILL_PADDING + activeIndex * itemWidth, {
          mass: 0.5,
        });
        return;
      }
      onTabPress(tab);
    },
    [
      activeIndex,
      activeTab,
      itemWidth,
      onTabPress,
      pillOpacity,
      pillX,
      sendDisabled,
    ],
  );

  const panGesture = Gesture.Pan()
    .onUpdate(e => {
      'worklet';
      pillOpacity.value = withTiming(1, {duration: 100});
      pillX.value = Math.min(
        Math.max(e.x - pillWidth / 2, PILL_PADDING),
        barWidth - pillWidth - PILL_PADDING,
      );
    })
    .onEnd(e => {
      'worklet';
      const index = Math.min(
        Math.max(Math.floor(e.x / itemWidth), 0),
        TABS.length - 1,
      );
      pillX.value = withSpring(PILL_PADDING + index * itemWidth, {mass: 0.5});
      scheduleOnRN(selectIndex, index);
    });

  const pillAnimatedStyle = useAnimatedStyle(() => ({
    opacity: pillOpacity.value,
    transform: [{translateX: pillX.value}],
  }));

  const items: NavItem[] = [
    {
      tab: 0,
      textKey: 'history',
      imageSource: require('../assets/icons/history-icon.png'),
    },
    {
      tab: 4,
      textKey: 'send',
      imageSource: require('../assets/icons/send-icon.png'),
      disabled: sendDisabled,
    },
    {
      tab: 5,
      textKey: 'receive',
      imageSource: require('../assets/icons/receive-icon.png'),
    },
  ];

  const inner = (
    <GestureDetector gesture={panGesture}>
      <View style={styles.row} collapsable={false}>
        <Animated.View style={[styles.pill, pillAnimatedStyle]} />
        {items.map(item => {
          const active = activeTab === item.tab;
          const color = active ? ACTIVE_COLOR : INACTIVE_COLOR;
          return (
            <Pressable
              key={item.tab}
              style={[styles.button, item.disabled ? styles.disabled : null]}
              onPress={() => {
                if (!item.disabled) {
                  onTabPress(item.tab);
                }
              }}>
              <Image
                source={item.imageSource}
                style={[styles.icon, {tintColor: color}]}
                resizeMode="contain"
              />
              <TranslateText
                textKey={item.textKey}
                domain="main"
                maxSizeInPixels={SCREEN_HEIGHT * 0.016}
                textStyle={{...styles.label, color}}
                numberOfLines={1}
              />
            </Pressable>
          );
        })}
      </View>
    </GestureDetector>
  );

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      {isLiquidGlassAvailable() ? (
        <GlassView
          style={styles.bar}
          glassEffectStyle="clear"
          tintColor={GLASS_TINT}
          isInteractive>
          {inner}
        </GlassView>
      ) : (
        // fallback for iOS < 26 and Android
        <View style={[styles.bar, styles.fallbackBar]}>
          <BlurView
            intensity={25}
            tint="light"
            style={StyleSheet.absoluteFill}
          />
          {inner}
        </View>
      )}
    </View>
  );
};

const getStyles = (
  screenHeight: number,
  bottomInset: number,
  barWidth: number,
  barHeight: number,
  pillWidth: number,
) =>
  StyleSheet.create({
    wrapper: {
      position: 'absolute',
      bottom: bottomInset > 0 ? bottomInset : screenHeight * 0.02,
      left: 0,
      right: 0,
      alignItems: 'center',
      zIndex: 3,
    },
    bar: {
      width: barWidth,
      height: barHeight,
      borderRadius: barHeight / 2,
    },
    fallbackBar: {
      overflow: 'hidden',
      backgroundColor: 'rgba(44, 114, 255, 0.12)',
      borderWidth: 0.5,
      borderColor: 'rgba(255, 255, 255, 0.35)',
    },
    row: {
      flex: 1,
      flexDirection: 'row',
    },
    pill: {
      position: 'absolute',
      top: PILL_PADDING,
      left: 0,
      width: pillWidth,
      height: barHeight - PILL_PADDING * 2,
      borderRadius: (barHeight - PILL_PADDING * 2) / 2,
      backgroundColor: 'rgba(164, 200, 255, 0.7)',
    },
    button: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 4,
    },
    icon: {
      width: screenHeight * 0.025,
      height: screenHeight * 0.025,
    },
    label: {
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.014,
      fontWeight: '700',
      textAlign: 'center',
    },
    disabled: {
      opacity: 0.4,
    },
  });

export default LiquidGlassNavBar;
