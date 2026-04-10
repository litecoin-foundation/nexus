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

import WalletTab from '../Tabs/WalletTab';
import {useAppSelector} from '../../store/hooks';
import {satsToSubunitSelector} from '../../reducers/settings';
import {fiatValueSelector} from '../../reducers/ticker';
import {chartPercentageChangeSelector} from '../../reducers/chart';
import {ScreenSizeContext} from '../../context/screenSize';

const liquidGlassShader = Skia.RuntimeEffect.Make(`
uniform vec2 size;
uniform float cornerR;
uniform vec2 resolution;
uniform shader image;
uniform shader blurredImage;

float sdRoundedBox(in vec2 p, in vec2 b, in vec4 r) {
  r.xy = (p.x > 0.0) ? r.xy : r.zw;
  r.x  = (p.y > 0.0) ? r.x  : r.y;
  vec2 q = abs(p) - b + r.x;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r.x;
}

float sdf(vec2 xy) {
  vec2 center = size * 0.5;
  return sdRoundedBox(xy - center, size * 0.5, vec4(cornerR));
}

vec2 calculateGradient(vec2 p) {
  const float epsilon = 1.0;
  float dx = sdf(p + vec2(epsilon, 0.0)) - sdf(p - vec2(epsilon, 0.0));
  float dy = sdf(p + vec2(0.0, epsilon)) - sdf(p - vec2(0.0, epsilon));
  return vec2(dx, dy) / (2.0 * epsilon);
}

vec3 getNormal(float sd, vec2 gradient, float thickness) {
  float dx = gradient.x;
  float dy = gradient.y;
  float n_cos = max(thickness + sd, 0.0) / thickness;
  float n_sin = sqrt(1.0 - n_cos * n_cos);
  return normalize(vec3(dx * n_cos, dy * n_cos, n_sin));
}

float height(float sd, float thickness) {
  if (sd >= 0.0)       return 0.0;
  if (sd < -thickness) return thickness;
  float x = thickness + sd;
  return sqrt(thickness * thickness - x * x);
}

vec4 calculateLiquidGlass(float sd, vec2 g, vec2 fragCoord) {
  float thickness           = 14.0;
  float transmission        = 0.9;
  float ior                 = 1.5;
  float chromaticAberration = 0.03;
  float distortionScale     = 1.0;

  vec3 normal   = getNormal(sd, g * distortionScale, thickness);
  vec3 incident = vec3(0.0, 0.0, -1.0);

  float fresnel = pow(1.0 - abs(dot(incident, normal)), 3.0);

  vec3  refract_vec    = refract(incident, normal, 1.0 / ior);
  float h              = height(sd, thickness);
  float base_height    = thickness * 8.0;
  float refract_length = (h + base_height) / dot(vec3(0.0, 0.0, -1.0), refract_vec);

  vec2 base_coord = fragCoord + refract_vec.xy * refract_length;
  vec2 uv_base    = base_coord / resolution;
  vec2 offset     = refract_vec.xy * chromaticAberration;

  float rv = blurredImage.eval((uv_base - offset) * resolution).r;
  float gv = blurredImage.eval( uv_base           * resolution).g;
  float bv = blurredImage.eval((uv_base + offset) * resolution).b;
  vec4 refract_color = vec4(rv, gv, bv, 1.0);

  vec3 reflect_vec   = reflect(incident, normal);
  float spec = pow(clamp(abs(reflect_vec.x - reflect_vec.y), 0.0, 1.0), 2.0);
  vec4 reflect_color = vec4(spec, spec, spec, 0.0);

  vec4 glass_color = mix(refract_color, reflect_color,
                         fresnel * (1.0 - transmission));

  glass_color = mix(glass_color, vec4(1.0, 1.0, 1.0, 1.0), 0.10);

  float shadowWidth = 30.0;
  float edgeDist = clamp(-sd / shadowWidth, 0.0, 1.0);
  glass_color.rgb *= mix(0.88, 1.0, smoothstep(0.0, 1.0, edgeDist));

  return glass_color;
}

vec4 render(vec2 xy) {
  float d = sdf(xy);
  vec2  g = calculateGradient(xy);
  if (d > 0.0) {
    return image.eval(xy);
  } else {
    return calculateLiquidGlass(d, g, xy);
  }
}

vec4 main(vec2 fragCoord) {
  const int samples = 4;
  float sampleStrength = 1.0 / float(samples * samples);
  vec4 finalColor = vec4(0.0);
  for (int m = 0; m < samples; m++) {
    for (int n = 0; n < samples; n++) {
      vec2 off = vec2(float(m), float(n)) / float(samples)
               - 0.5 / float(samples);
      finalColor += render(fragCoord + off) * sampleStrength;
    }
  }
  return finalColor;
}
`)!;

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
