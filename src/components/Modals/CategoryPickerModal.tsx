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
  withTiming,
  withSpring,
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
import TranslateText from '../TranslateText';

import {ScreenSizeContext} from '../../context/screenSize';
import {PopUpContext} from '../../context/popUpContext';
import {ScreenCaptureContext} from '../../context/screenCapture';
import {TILLO_CATEGORIES, TilloCategory} from '../../services/giftcards';

interface Props {
  isVisible: boolean;
  close: () => void;
  selectedCategory: TilloCategory | null;
  onSelect: (category: TilloCategory | null) => void;
}

export const formatCategoryLabel = (category: string): string => {
  return category
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const FALLBACK_GRADIENT = ['#0A1628', '#122B5C', '#0E1F3C'];

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

  const modalWidth = SCREEN_WIDTH * 0.58;
  const modalHeight = SCREEN_HEIGHT * 0.48;
  const modalRight = SCREEN_WIDTH * 0.04;
  const modalTop = SCREEN_HEIGHT * 0.225;
  const modalLeft = SCREEN_WIDTH - modalWidth - modalRight;
  const cornerRadius = SCREEN_HEIGHT * 0.025;

  const [capturedImage, setCapturedImage] = useState<SkImage | null>(null);

  const captureScreen = useCallback(async () => {
    if (captureRef?.current) {
      try {
        const img = await makeImageFromView(captureRef);
        setCapturedImage(img);
      } catch {
        setCapturedImage(null);
      }
    }
  }, [captureRef]);

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
        setCapturedImage(null);
      }, 250);
    }
    return () => clearTimeout(animTimeout.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpened]);

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
          style={[styles.row, selected && styles.rowSelected]}
          onPress={() => handleSelect(item)}>
          <TranslateText
            textValue={item ? formatCategoryLabel(item) : 'All'}
            maxSizeInPixels={SCREEN_HEIGHT * 0.02}
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
    [selectedCategory, SCREEN_HEIGHT],
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
      style={[
        styles.overlay,
        {width: SCREEN_WIDTH, height: SCREEN_HEIGHT},
      ]}
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

      <Animated.View
        style={[
          styles.modalContainer,
          {
            top: modalTop,
            left: modalLeft,
            width: modalWidth,
            height: modalHeight,
            borderRadius: cornerRadius,
          },
          animatedModalStyle,
        ]}>
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
            color="rgba(255, 255, 255, 0.35)"
          />
        </Canvas>

        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            styles.tintLayer,
            {borderRadius: cornerRadius},
          ]}
        />

        <Animated.View style={[styles.content, animatedContentStyle]}>
          <FlatList
            data={[null, ...TILLO_CATEGORIES] as (TilloCategory | null)[]}
            keyExtractor={item => item ?? 'all'}
            renderItem={renderRow}
            ItemSeparatorComponent={renderSeparator}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </Animated.View>
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, selectedCategory]);

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
  modalContainer: {
    position: 'absolute',
    overflow: 'hidden',
  },
  tintLayer: {
    backgroundColor: 'rgba(238, 238, 240, 0.58)',
  },
  content: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  rowSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  rowTitle: {
    fontFamily: 'Satoshi Variable',
    fontWeight: '700',
    color: '#000000',
    fontSize: 16,
    letterSpacing: -0.1,
    flexShrink: 1,
  },
  rowTitleSelected: {
    color: '#000000',
  },
  check: {
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(60, 60, 67, 0.22)',
    marginHorizontal: 20,
  },
});

export default CategoryPickerModal;
