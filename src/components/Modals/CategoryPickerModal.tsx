import React, {
  useEffect,
  useContext,
  useMemo,
  useState,
  useRef,
  useCallback,
} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  useDerivedValue,
  withTiming,
  withSpring,
  ReduceMotion,
} from 'react-native-reanimated';
import {
  Canvas,
  BackdropFilter,
  ImageFilter,
  Image as SkiaImage,
  Rect,
  RoundedRect,
  LinearGradient,
  Skia,
  TileMode,
  makeImageFromView,
  vec,
} from '@shopify/react-native-skia';
import type {SkImage} from '@shopify/react-native-skia';

import {glassModalShader, makeGlassModalFilter} from './glassModalShader';
import TranslateText from '../TranslateText';
import {
  getShopListTop,
  SHOP_LABEL_HEIGHT_RATIO,
} from '../GiftCardShop/GlassShopRows';
import {ROW_BORDER} from '../GlassTxRows';

import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {ScreenSizeContext} from '../../context/screenSize';
import {PopUpContext} from '../../context/popUpContext';
import {ScreenCaptureContext} from '../../context/screenCapture';
import {
  formatCategoryLabel,
  TILLO_CATEGORIES,
  TilloCategory,
} from '../../services/giftcards';

// Frosted category menu, dropped from the shop's filter control: the same
// milky glass sheet as the tx detail modal, anchored under the filter glyph
// so the picker reads as part of it.

interface Props {
  isVisible: boolean;
  close: () => void;
  selectedCategory: TilloCategory | null;
  onSelect: (category: TilloCategory | null) => void;
}

const FALLBACK_GRADIENT = ['#0A1628', '#122B5C', '#0E1F3C'];
const GLASS_BLUR_SIGMA = 12;

interface GlassModalProps {
  isOpened: boolean;
  close: () => void;
  selectedCategory: TilloCategory | null;
  onSelect: (category: TilloCategory | null) => void;
}

function LiquidGlassCategoryPicker({
  isOpened,
  close,
  selectedCategory,
  onSelect,
}: GlassModalProps) {
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const {captureRef} = useContext(ScreenCaptureContext);
  const insets = useSafeAreaInsets();

  // dropped from the filter control at the end of the list's label row
  const panelWidth = SCREEN_WIDTH * 0.58;
  const panelRight = SCREEN_WIDTH * 0.05;
  const panelLeft = SCREEN_WIDTH - panelRight - panelWidth;
  const panelTop =
    getShopListTop(SCREEN_HEIGHT, insets.top) +
    SCREEN_HEIGHT * (SHOP_LABEL_HEIGHT_RATIO + 0.006);
  const panelHeight = Math.min(
    SCREEN_HEIGHT * 0.5,
    SCREEN_HEIGHT - panelTop - SCREEN_HEIGHT * 0.2,
  );
  const cornerRadius = SCREEN_HEIGHT * 0.022;

  const [capturedImage, setCapturedImage] = useState<SkImage | null>(null);
  const capturedRef = useRef<SkImage | null>(null);

  const captureScreen = useCallback(async () => {
    if (captureRef?.current) {
      try {
        const img = await makeImageFromView(captureRef);
        capturedRef.current = img;
        setCapturedImage(prev => {
          if (prev && prev !== img) {
            prev.dispose?.();
          }
          return img;
        });
      } catch {
        setCapturedImage(null);
      }
    }
  }, [captureRef]);

  useEffect(() => {
    return () => {
      capturedRef.current?.dispose?.();
      capturedRef.current = null;
    };
  }, []);

  const scale = useSharedValue(0.9);
  const modalOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);

  const [isVisible, setVisible] = useState(false);
  const animTimeout = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    if (isOpened) {
      captureScreen();
      setVisible(true);
      scale.value = withSpring(1, {
        duration: 450,
        dampingRatio: 0.8,
        reduceMotion: ReduceMotion.Never,
      });
      modalOpacity.value = withTiming(1, {duration: 180});
      contentOpacity.value = withTiming(1, {duration: 280});
      backdropOpacity.value = withTiming(1, {duration: 220});
    } else {
      scale.value = withTiming(0.92, {duration: 180});
      modalOpacity.value = withTiming(0, {duration: 180});
      contentOpacity.value = withTiming(0, {duration: 140});
      backdropOpacity.value = withTiming(0, {duration: 180});
      animTimeout.current = setTimeout(() => {
        setVisible(false);
        capturedRef.current = null;
        setCapturedImage(prev => {
          prev?.dispose?.();
          return null;
        });
      }, 230);
    }
    return () => clearTimeout(animTimeout.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpened]);

  // milky frosted sheet, scaling out of its top-right anchor
  const shaderBuilder = useMemo(
    () => Skia.RuntimeShaderBuilder(glassModalShader),
    [],
  );
  const glassBlurChild = useMemo(
    () =>
      Skia.ImageFilter.MakeBlur(
        GLASS_BLUR_SIGMA,
        GLASS_BLUR_SIGMA,
        TileMode.Clamp,
      ),
    [],
  );
  const glassFilter = useDerivedValue(() => {
    const s = scale.value;
    const width = panelWidth * s;
    const height = panelHeight * s;
    return makeGlassModalFilter(
      shaderBuilder,
      glassBlurChild,
      [panelLeft + panelWidth - width, panelTop, width, height],
      cornerRadius,
      1.0,
    );
  });

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));
  const animatedCanvasStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
  }));
  const animatedContentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [
      {translateX: (panelWidth / 2) * (1 - scale.value)},
      {translateY: (-panelHeight / 2) * (1 - scale.value)},
      {scale: scale.value},
    ],
  }));

  const handleSelect = (category: TilloCategory | null) => {
    onSelect(category);
    close();
  };

  const renderRow = useCallback(
    ({item}: {item: TilloCategory | null}) => {
      const selected = selectedCategory === item;
      return (
        <TouchableOpacity
          activeOpacity={0.55}
          style={styles.row}
          onPress={() => handleSelect(item)}>
          <TranslateText
            textValue={item ? formatCategoryLabel(item) : 'All'}
            maxSizeInPixels={SCREEN_HEIGHT * 0.019}
            textStyle={[styles.rowTitle, selected && styles.rowTitleSelected]}
            numberOfLines={1}
          />
          {selected ? (
            <Image
              source={require('../../assets/images/checkBlue.png')}
              style={styles.check}
            />
          ) : null}
        </TouchableOpacity>
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedCategory, SCREEN_HEIGHT, onSelect, close],
  );

  const renderSeparator = useCallback(
    () => <View style={styles.divider} />,
    [],
  );

  if (!isVisible) {
    return null;
  }

  return (
    <View
      style={[styles.overlay, {width: SCREEN_WIDTH, height: SCREEN_HEIGHT}]}
      pointerEvents="box-none">
      <Animated.View
        style={[
          {width: SCREEN_WIDTH, height: SCREEN_HEIGHT},
          animatedBackdropStyle,
        ]}
        pointerEvents="box-none">
        <TouchableOpacity
          activeOpacity={1}
          style={[
            {width: SCREEN_WIDTH, height: SCREEN_HEIGHT},
            styles.backdrop,
          ]}
          onPress={close}
        />
      </Animated.View>

      {/* the frosted sheet refracts a one-shot capture of the screen */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, animatedCanvasStyle]}>
        <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
          {capturedImage ? (
            <SkiaImage
              image={capturedImage}
              x={0}
              y={0}
              width={SCREEN_WIDTH}
              height={SCREEN_HEIGHT}
              fit="cover"
            />
          ) : (
            <Rect x={0} y={0} width={SCREEN_WIDTH} height={SCREEN_HEIGHT}>
              <LinearGradient
                start={vec(0, 0)}
                end={vec(SCREEN_WIDTH, SCREEN_HEIGHT)}
                colors={FALLBACK_GRADIENT}
              />
            </Rect>
          )}
          <BackdropFilter filter={<ImageFilter filter={glassFilter} />} />
          <RoundedRect
            x={panelLeft + 0.5}
            y={panelTop + 0.5}
            width={panelWidth - 1}
            height={panelHeight - 1}
            r={cornerRadius - 0.5}
            style="stroke"
            strokeWidth={0.5}
            color="rgba(255, 255, 255, 0.45)"
          />
        </Canvas>
      </Animated.View>

      <Animated.View
        style={[
          styles.panel,
          {
            top: panelTop,
            left: panelLeft,
            width: panelWidth,
            height: panelHeight,
            borderRadius: cornerRadius,
          },
          animatedContentStyle,
        ]}>
        <FlatList
          data={[null, ...TILLO_CATEGORIES] as (TilloCategory | null)[]}
          keyExtractor={item => item ?? 'all'}
          renderItem={renderRow}
          ItemSeparatorComponent={renderSeparator}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </Animated.View>
    </View>
  );
}

const CategoryPickerModal: React.FC<Props> = props => {
  const {isVisible, close, selectedCategory, onSelect} = props;
  const {showPopUp} = useContext(PopUpContext);

  const modal = useMemo(
    () => (
      <LiquidGlassCategoryPicker
        isOpened={isVisible}
        close={close}
        selectedCategory={selectedCategory}
        onSelect={onSelect}
      />
    ),
    [isVisible, close, selectedCategory, onSelect],
  );

  useEffect(() => {
    showPopUp(modal, 'category-picker-modal');
  }, [modal, showPopUp]);

  // the shop screen can unmount with the picker portal entry live (deep-link
  // pop); clear the slot or the portal strands the last-rendered picker
  useEffect(
    () => () => {
      showPopUp(<React.Fragment />, 'category-picker-modal');
    },
    [showPopUp],
  );

  return <></>;
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 10,
  },
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  panel: {
    position: 'absolute',
    overflow: 'hidden',
  },
  listContent: {
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 13,
  },
  rowTitle: {
    fontFamily: 'Satoshi Variable',
    fontWeight: '700',
    color: '#2E2E2E',
    fontSize: 15,
    letterSpacing: -0.1,
    flexShrink: 1,
  },
  rowTitleSelected: {
    color: '#1162E6',
  },
  check: {
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: ROW_BORDER,
    marginHorizontal: 18,
  },
});

export default CategoryPickerModal;
