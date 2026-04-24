import React, {
  useEffect,
  useState,
  useRef,
  useContext,
  useCallback,
} from 'react';
import {View, StyleSheet, TouchableOpacity} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  ReduceMotion,
  runOnJS,
  useDerivedValue,
} from 'react-native-reanimated';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import {useTranslation} from 'react-i18next';
import {
  Canvas,
  Rect,
  RoundedRect,
  LinearGradient,
  BackdropFilter,
  ImageFilter,
  Image as SkiaImage,
  Skia,
  TileMode,
  processUniforms,
  makeImageFromView,
  vec,
} from '@shopify/react-native-skia';
import type {SkImage} from '@shopify/react-native-skia';

import {liquidGlassShader} from './liquidGlassShader';
import WalletTab from '../Tabs/WalletTab';
import {useAppSelector} from '../../store/hooks';
import {satsToSubunitSelector} from '../../reducers/settings';
import {fiatValueSelector} from '../../reducers/ticker';
import {chartPercentageChangeSelector} from '../../reducers/chart';
import {ScreenSizeContext} from '../../context/screenSize';

interface Props {
  isOpened: boolean;
  close: () => void;
  gapInPixels: number;
  rotateWalletButtonArrow?: () => void;
  contentViewRef?: React.RefObject<View | null>;
}

const HORIZONTAL_MARGIN = 16;
const FALLBACK_GRADIENT = ['#0A1628', '#122B5C', '#0E1F3C'];

export default function LiquidGlassWalletModal({
  isOpened,
  close,
  gapInPixels,
  rotateWalletButtonArrow,
  contentViewRef,
}: Props) {
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const {t} = useTranslation('main');

  const totalBalance = useAppSelector(state => state.balance.totalBalance);
  const convertToSubunit = useAppSelector(state =>
    satsToSubunitSelector(state),
  );
  const balanceAmount = convertToSubunit(totalBalance);
  const calculateFiatAmount = useAppSelector(state => fiatValueSelector(state));
  const fiatAmount = calculateFiatAmount(totalBalance);
  const chartPercentageChange = useAppSelector(state =>
    chartPercentageChangeSelector(state),
  );
  const chartPercentage = chartPercentageChange
    ? Number(
        chartPercentageChange.substring(0, chartPercentageChange.length - 1),
      )
    : 0;

  const modalWidth = SCREEN_WIDTH - HORIZONTAL_MARGIN * 2;
  const modalHeight = SCREEN_HEIGHT * 0.195;
  const modalTop = gapInPixels + 4;
  const cornerRadius = SCREEN_HEIGHT * 0.025;

  const [capturedImage, setCapturedImage] = useState<SkImage | null>(null);

  const captureScreen = useCallback(async () => {
    if (contentViewRef?.current) {
      try {
        const img = await makeImageFromView(contentViewRef);
        setCapturedImage(img);
      } catch {
        setCapturedImage(null);
      }
    }
  }, [contentViewRef]);

  const glassFilter = useDerivedValue(() => {
    const builder = Skia.RuntimeShaderBuilder(liquidGlassShader);
    processUniforms(
      liquidGlassShader,
      {
        size: [modalWidth, modalHeight],
        cornerR: cornerRadius,
        resolution: [modalWidth, modalHeight],
      },
      builder,
    );
    return Skia.ImageFilter.MakeRuntimeShaderWithChildren(
      builder,
      0,
      ['blurredImage'],
      [Skia.ImageFilter.MakeBlur(8, 8, TileMode.Clamp)],
    )!;
  });

  const translateY = useSharedValue(0);
  const scale = useSharedValue(0.95);
  const modalOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);

  const [isVisible, setVisible] = useState(false);
  const animTimeout = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    if (isOpened) {
      captureScreen();
      setVisible(true);
      translateY.value = 0;
      scale.value = withSpring(1, {
        duration: 500,
        dampingRatio: 0.75,
        reduceMotion: ReduceMotion.Never,
      });
      modalOpacity.value = withTiming(1, {duration: 200});
      contentOpacity.value = withTiming(1, {duration: 300});
      backdropOpacity.value = withTiming(1, {duration: 250});
    } else {
      scale.value = withTiming(0.95, {duration: 200});
      modalOpacity.value = withTiming(0, {duration: 200});
      contentOpacity.value = withTiming(0, {duration: 150});
      backdropOpacity.value = withTiming(0, {duration: 200});
      animTimeout.current = setTimeout(() => {
        setVisible(false);
        translateY.value = 0;
        setCapturedImage(null);
      }, 250);
    }
    return () => clearTimeout(animTimeout.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpened]);

  const animatedModalStyle = useAnimatedStyle(() => ({
    transform: [{translateY: translateY.value}, {scale: scale.value}],
    opacity: modalOpacity.value,
  }));
  const animatedContentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));
  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const panGesture = Gesture.Pan()
    .onUpdate(e => {
      if (e.translationY < 0) {
        translateY.value = e.translationY;
      }
    })
    .onEnd(e => {
      if (e.translationY < -(modalHeight * 0.25) || e.velocityY < -500) {
        translateY.value = withTiming(-modalHeight, {duration: 200});
        modalOpacity.value = withTiming(0, {duration: 200});
        contentOpacity.value = withTiming(0, {duration: 150});
        backdropOpacity.value = withTiming(0, {duration: 200});
        if (rotateWalletButtonArrow) {
          runOnJS(rotateWalletButtonArrow)();
        }
        runOnJS(close)();
      } else {
        translateY.value = withSpring(0, {duration: 400, dampingRatio: 0.8});
      }
    });

  const handleBackdropPress = () => {
    if (rotateWalletButtonArrow) {
      rotateWalletButtonArrow();
    }
    close();
  };

  if (!isVisible) {
    return null;
  }

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      {/* Backdrop */}
      <Animated.View
        style={[StyleSheet.absoluteFill, animatedBackdropStyle]}
        pointerEvents="box-none">
        <TouchableOpacity
          activeOpacity={1}
          style={[StyleSheet.absoluteFill, styles.backdrop]}
          onPress={handleBackdropPress}
        />
      </Animated.View>

      {/* Liquid-glass modal */}
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              top: modalTop,
              left: HORIZONTAL_MARGIN,
              width: modalWidth,
              height: modalHeight,
              borderRadius: cornerRadius,
            },
            animatedModalStyle,
          ]}>
          {/* Liquid glass surface */}
          <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
            {capturedImage ? (
              <SkiaImage
                image={capturedImage}
                x={-HORIZONTAL_MARGIN}
                y={-modalTop}
                width={SCREEN_WIDTH}
                height={SCREEN_HEIGHT}
                fit="cover"
              />
            ) : (
              <Rect x={0} y={0} width={modalWidth} height={modalHeight}>
                <LinearGradient
                  start={vec(0, 0)}
                  end={vec(modalWidth, modalHeight)}
                  colors={FALLBACK_GRADIENT}
                />
              </Rect>
            )}
            <BackdropFilter filter={<ImageFilter filter={glassFilter} />} />
            <RoundedRect
              x={0.5}
              y={0.5}
              width={modalWidth - 1}
              height={modalHeight - 1}
              r={cornerRadius - 0.5}
              style="stroke"
              strokeWidth={0.5}
              color="rgba(255, 255, 255, 0.3)"
            />
          </Canvas>

          {/* Content on the glass surface */}
          <Animated.View
            style={[
              styles.content,
              {padding: SCREEN_HEIGHT * 0.025},
              animatedContentStyle,
            ]}>
            <View style={styles.walletTabContainer}>
              <WalletTab
                colorStyle="White"
                walletName={t('main_wallet')}
                balance={balanceAmount}
                fiatBalance={fiatAmount}
                chartPercentage={chartPercentage}
                chartPercentageChange={String(chartPercentageChange)}
              />
            </View>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  modalContainer: {
    position: 'absolute',
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  walletTabContainer: {
    width: '100%',
  },
  buttonContainer: {
    width: '100%',
  },
});
