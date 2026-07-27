import React, {useContext} from 'react';
import {Image, ImageSourcePropType, Pressable, StyleSheet} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import {GestureDetector, PanGesture} from 'react-native-gesture-handler';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import TranslateText from '../TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';
import {getNewMainSheetPoints} from '../../animations/useNewMainAnims';
import {
  glassTabExpansionProgressAt,
  glassTabRectAt,
  glassTabSplitProgressAt,
  GlassTabLayout,
  GLASS_TAB_BUTTON_HEIGHT_RATIO,
} from '../glassTabLayout';

// Overlay for touch targets and labels; the canvas draws the glass.
const UNFOLDED_TOUCH_HEIGHT_RATIO = GLASS_TAB_BUTTON_HEIGHT_RATIO + 0.033;
const BELOW_LABEL_TOP_RATIO = GLASS_TAB_BUTTON_HEIGHT_RATIO + 0.014;

interface Props {
  textKey: string;
  imageSource: ImageSourcePropType;
  foldedTextKey?: string;
  foldedImageSource?: ImageSourcePropType;
  hideFoldedContent?: boolean;
  lateSplitContent?: boolean;
  pointerEvents?: 'auto' | 'none';
  handlePress: () => void;
  active: boolean;
  disabled: boolean;
  mainSheetsTranslationY: SharedValue<number>;
  layout: GlassTabLayout;
  // Dragging a button folds/unfolds the sheet.
  dragGesture: PanGesture;
}

const GlassTabButton: React.FC<Props> = props => {
  const {
    textKey,
    imageSource,
    foldedTextKey,
    foldedImageSource,
    hideFoldedContent,
    lateSplitContent,
    pointerEvents,
    handlePress,
    active,
    disabled,
    mainSheetsTranslationY,
    layout,
    dragGesture,
  } = props;

  const insets = useSafeAreaInsets();
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);
  const unfoldedLabelWidth = layout.unfolded.width;

  const {UNFOLD_SHEET_POINT, FOLD_SHEET_POINT} = getNewMainSheetPoints(
    SCREEN_HEIGHT,
    insets.top,
  );

  const animatedRect = useAnimatedStyle(() => {
    const rect = glassTabRectAt(
      layout,
      mainSheetsTranslationY.value,
      UNFOLD_SHEET_POINT,
      FOLD_SHEET_POINT,
    );
    return {left: rect.x, top: rect.y, width: rect.width};
  });

  // Folded and unfolded content cross-fade while the rect morphs.
  const animatedFoldedContent = useAnimatedStyle(() => {
    // All three compact controls must enter and leave together. The late SDF
    // split only governs the expanded Buy/Sell content and geometry.
    const progress = glassTabExpansionProgressAt(
      mainSheetsTranslationY.value,
      UNFOLD_SHEET_POINT,
      FOLD_SHEET_POINT,
    );
    return {
      opacity: interpolate(progress, [0, 0.45], [1, 0], Extrapolation.CLAMP),
    };
  });

  const animatedUnfoldedContent = useAnimatedStyle(() => {
    const progress = lateSplitContent
      ? glassTabSplitProgressAt(
          mainSheetsTranslationY.value,
          UNFOLD_SHEET_POINT,
          FOLD_SHEET_POINT,
        )
      : glassTabExpansionProgressAt(
          mainSheetsTranslationY.value,
          UNFOLD_SHEET_POINT,
          FOLD_SHEET_POINT,
        );
    return {
      opacity: interpolate(
        progress,
        hideFoldedContent
          ? [0.62, 1]
          : lateSplitContent
            ? [0.28, 1]
            : [0.55, 1],
        [0, 1],
        Extrapolation.CLAMP,
      ),
      transform: [
        {
          scale: lateSplitContent
            ? interpolate(
                progress,
                hideFoldedContent ? [0.62, 1] : [0.28, 1],
                [0.72, 1],
                Extrapolation.CLAMP,
              )
            : 1,
        },
      ],
    };
  });

  // Unfolded, the tap target grows down to cover the label; folded it hugs
  // the pill.
  const animatedPressableArea = useAnimatedStyle(() => {
    const progress = glassTabExpansionProgressAt(
      mainSheetsTranslationY.value,
      UNFOLD_SHEET_POINT,
      FOLD_SHEET_POINT,
    );
    return {
      height: interpolate(
        progress,
        [0, 1],
        [
          SCREEN_HEIGHT * GLASS_TAB_BUTTON_HEIGHT_RATIO,
          SCREEN_HEIGHT * UNFOLDED_TOUCH_HEIGHT_RATIO,
        ],
      ),
    };
  });

  return (
    <GestureDetector gesture={dragGesture}>
      <Animated.View
        pointerEvents={pointerEvents}
        style={[
          styles.buttonRoot,
          disabled ? styles.disabled : null,
          animatedRect,
        ]}>
        <Animated.View style={[styles.pressableWrap, animatedPressableArea]}>
          <Pressable
            onPress={handlePress}
            disabled={disabled}
            style={({pressed}) => [
              styles.pressable,
              pressed ? styles.pressed : null,
            ]}>
            <Animated.View
              style={[
                styles.foldedContent,
                animatedFoldedContent,
                hideFoldedContent ? styles.hidden : null,
              ]}>
              <Image
                source={foldedImageSource ?? imageSource}
                style={styles.icon}
              />
              <TranslateText
                textKey={foldedTextKey ?? textKey}
                domain="main"
                maxSizeInPixels={SCREEN_HEIGHT * 0.015}
                maxLengthInPixels={layout.folded.width * 0.65}
                textStyle={styles.labelText}
                numberOfLines={1}
              />
            </Animated.View>
            <Animated.View
              style={[styles.unfoldedContent, animatedUnfoldedContent]}>
              <Image source={imageSource} style={styles.icon} />
            </Animated.View>
          </Pressable>
        </Animated.View>
        <Animated.View
          style={[styles.belowLabelContainer, animatedUnfoldedContent]}
          pointerEvents="none">
          <TranslateText
            textKey={textKey}
            domain="main"
            maxSizeInPixels={SCREEN_HEIGHT * 0.015}
            maxLengthInPixels={unfoldedLabelWidth}
            textStyle={[
              active ? styles.labelTextActive : styles.labelText,
              styles.centeredLabel,
              {width: unfoldedLabelWidth},
            ]}
            adjustsFontSizeToFit
            minimumFontScale={0.65}
            numberOfLines={1}
          />
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    buttonRoot: {
      position: 'absolute',
      height: screenHeight * UNFOLDED_TOUCH_HEIGHT_RATIO,
    },
    pressableWrap: {
      width: '100%',
      // A newly born zero-width Sell control must not leak its fixed-size
      // icon into the neighbouring Trade control.
      overflow: 'hidden',
    },
    pressable: {
      width: '100%',
      height: '100%',
    },
    pressed: {
      opacity: 0.7,
    },
    // Content stays pinned to the glass square while the pressable grows.
    foldedContent: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: screenHeight * GLASS_TAB_BUTTON_HEIGHT_RATIO,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: screenWidth * 0.02,
    },
    unfoldedContent: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: screenHeight * GLASS_TAB_BUTTON_HEIGHT_RATIO,
      justifyContent: 'center',
      alignItems: 'center',
    },
    icon: {
      width: screenHeight * 0.022,
      height: screenHeight * 0.022,
      resizeMode: 'contain',
      tintColor: '#ffffff',
    },
    labelText: {
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '500',
      color: '#ffffff',
      fontSize: screenHeight * 0.015,
    },
    centeredLabel: {
      textAlign: 'center',
    },
    labelTextActive: {
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      color: '#ffffff',
      fontSize: screenHeight * 0.015,
    },
    belowLabelContainer: {
      position: 'absolute',
      top: screenHeight * BELOW_LABEL_TOP_RATIO,
      left: -screenWidth * 0.03,
      right: -screenWidth * 0.03,
      alignItems: 'center',
    },
    disabled: {
      opacity: 0.2,
    },
    hidden: {
      opacity: 0,
    },
  });

export default GlassTabButton;
