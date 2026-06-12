import React, {
  useEffect,
  useState,
  useRef,
  useContext,
  useCallback,
  useMemo,
} from 'react';
import {
  View,
  StyleSheet,
  InteractionManager,
  LayoutChangeEvent,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  ReduceMotion,
  useDerivedValue,
} from 'react-native-reanimated';
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
import TranslateText from '../../components/TranslateText';
import SecondaryRoundButton from '../Buttons/SecondaryRoundButton';
import {ScreenSizeContext} from '../../context/screenSize';

interface Props {
  isVisible: boolean;
  close: () => void;
  titleTextKey: string;
  textKey: string;
  // Shared i18n domain for the title and body copy.
  domain?: string;
  buttonTextKey?: string;
  buttonTextDomain?: string;
  onButtonPress?: () => void;
  contentViewRef?: React.RefObject<View | null>;
}

const FALLBACK_GRADIENT = ['#0A1628', '#122B5C', '#0E1F3C'];
// 1.0 = clear glass, <1.0 = darker/smoked glass. Slightly darkened so the
// alert reads as distinct from the content behind it.
const GLASS_DARKEN = 0.3;

export default function LiquidGlassAlertModal({
  isVisible,
  close,
  titleTextKey,
  textKey,
  domain = 'modals',
  buttonTextKey = 'dismiss',
  buttonTextDomain = 'settingsTab',
  onButtonPress,
  contentViewRef,
}: Props) {
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);

  const styles = useMemo(
    () => getStyles(SCREEN_WIDTH, SCREEN_HEIGHT),
    [SCREEN_WIDTH, SCREEN_HEIGHT],
  );

  const modalWidth = SCREEN_WIDTH * 0.82;
  const cornerRadius = SCREEN_HEIGHT * 0.028;
  // The modal height follows its content (measured below) so the container
  // hugs the title/body/button rather than using a fixed oversized box.
  const [modalHeight, setModalHeight] = useState(0);
  const modalLeft = (SCREEN_WIDTH - modalWidth) / 2;
  const modalTop = (SCREEN_HEIGHT - modalHeight) / 2;

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
        darken: GLASS_DARKEN,
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

  const scale = useSharedValue(0.95);
  const modalOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);

  const [isMounted, setMounted] = useState(false);
  const revealed = useRef(false);
  const animTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
  const captureTask = useRef<{cancel: () => void} | undefined>(undefined);
  const captureRaf = useRef<number | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    if (isVisible) {
      // Defer until the native view tree is attached — calling
      // makeImageFromView during the launch/mount burst throws an uncatchable
      // native "Could not find view with tag" crash. Snapshot the background
      // BEFORE mounting the modal (while it still renders null), so the liquid
      // glass refracts the real screen behind it rather than the modal's own
      // dim backdrop. Only then mount the (still-transparent) content, which
      // measures its height and triggers the reveal below.
      captureTask.current = InteractionManager.runAfterInteractions(() => {
        captureRaf.current = requestAnimationFrame(async () => {
          if (cancelled) {
            return;
          }
          await captureScreen();
          if (cancelled) {
            return;
          }
          setMounted(true);
        });
      });
    } else {
      scale.value = withTiming(0.95, {duration: 200});
      modalOpacity.value = withTiming(0, {duration: 200});
      contentOpacity.value = withTiming(0, {duration: 150});
      backdropOpacity.value = withTiming(0, {duration: 200});
      animTimeout.current = setTimeout(() => {
        setMounted(false);
        setCapturedImage(null);
        setModalHeight(0);
        revealed.current = false;
      }, 250);
    }
    return () => {
      cancelled = true;
      clearTimeout(animTimeout.current);
      captureTask.current?.cancel();
      if (captureRaf.current !== undefined) {
        cancelAnimationFrame(captureRaf.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]);

  // Reveal once the content has been mounted and measured, so the glass
  // surface animates in at its final size.
  useEffect(() => {
    if (isVisible && isMounted && modalHeight > 0 && !revealed.current) {
      revealed.current = true;
      scale.value = withSpring(1, {
        duration: 500,
        dampingRatio: 0.75,
        reduceMotion: ReduceMotion.Never,
      });
      modalOpacity.value = withTiming(1, {duration: 200});
      contentOpacity.value = withTiming(1, {duration: 300});
      backdropOpacity.value = withTiming(1, {duration: 250});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, isMounted, modalHeight]);

  const onContentLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const h = Math.round(e.nativeEvent.layout.height);
      if (h > 0 && h !== modalHeight) {
        setModalHeight(h);
      }
    },
    [modalHeight],
  );

  const handleButtonPress = useCallback(() => {
    onButtonPress?.();
    close();
  }, [onButtonPress, close]);

  const animatedModalStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
    opacity: modalOpacity.value,
  }));
  const animatedContentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));
  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!isMounted) {
    return null;
  }

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      {/* Dimmed backdrop — blocks taps behind the alert until acknowledged */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          styles.backdrop,
          animatedBackdropStyle,
        ]}
        pointerEvents="auto"
      />

      {/* Liquid-glass modal — auto-height, hugs its content */}
      <Animated.View
        style={[
          styles.modalContainer,
          {
            top: modalTop,
            left: modalLeft,
            width: modalWidth,
            borderRadius: cornerRadius,
          },
          animatedModalStyle,
        ]}>
        {/* Liquid glass surface */}
        <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
          {capturedImage ? (
            <SkiaImage
              image={capturedImage}
              x={-modalLeft}
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

        {/* Content on the glass surface — drives the modal height */}
        <Animated.View
          style={[styles.content, animatedContentStyle]}
          onLayout={onContentLayout}>
          <TranslateText
            textKey={titleTextKey}
            domain={domain}
            maxSizeInPixels={SCREEN_HEIGHT * 0.026}
            textStyle={styles.title}
            numberOfLines={2}
          />
          <TranslateText
            textKey={textKey}
            domain={domain}
            maxSizeInPixels={SCREEN_HEIGHT * 0.0165}
            textStyle={styles.text}
            numberOfLines={8}
          />
          <View style={styles.button}>
            <SecondaryRoundButton
              textKey={buttonTextKey}
              textDomain={buttonTextDomain}
              onPress={handleButtonPress}
            />
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 100,
    },
    backdrop: {
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    modalContainer: {
      position: 'absolute',
      overflow: 'hidden',
    },
    content: {
      paddingHorizontal: screenWidth * 0.06,
      paddingVertical: screenHeight * 0.03,
      gap: screenHeight * 0.018,
    },
    title: {
      color: '#fff',
      fontSize: screenHeight * 0.026,
      fontWeight: '700',
      letterSpacing: -0.18,
      textAlign: 'center',
    },
    text: {
      color: 'rgba(255, 255, 255, 0.85)',
      fontSize: screenHeight * 0.0165,
      lineHeight: screenHeight * 0.024,
      letterSpacing: -0.18,
      textAlign: 'center',
    },
    button: {
      width: '100%',
      alignSelf: 'center',
      marginTop: screenHeight * 0.008,
    },
  });
