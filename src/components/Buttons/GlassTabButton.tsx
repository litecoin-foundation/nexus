import React, {useContext} from 'react';
import {
  Image,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
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
import {tsOn} from '../../config/perfHarness';
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
  // Sizes the tap target. Not animated — see pressableArea below.
  folded: boolean;
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
    folded,
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

  // Position rides a transform, not left/top. left/top/width are Yoga props:
  // writing them dirties the node and forces a layout pass inside the same
  // Choreographer callback that commits the frame, four buttons at a time.
  // transform is not, so only `width` still costs a layout.
  const animatedRect = useAnimatedStyle(() => {
    const rect = glassTabRectAt(
      layout,
      mainSheetsTranslationY.value,
      UNFOLD_SHEET_POINT,
      FOLD_SHEET_POINT,
    );
    return {
      transform: [{translateX: rect.x}, {translateY: rect.y}],
      width: rect.width,
    };
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
  // the pill. Snapped to the fold state rather than interpolated: this is a
  // Yoga height, and animating it re-laid out four subtrees every frame to
  // resize a touch target that nobody can hit mid-animation.
  const pressableArea = folded
    ? styles.pressableFolded
    : styles.pressableUnfolded;

  // Sub-ladder gates. `geometry` off pins every control at its folded rect, so
  // the rung prices the animated rect (and its Yoga width) against a static one.
  const rectStyle = tsOn('geometry')
    ? animatedRect
    : {
        transform: [
          {translateX: layout.folded.left},
          {translateY: FOLD_SHEET_POINT + layout.folded.topOffset},
        ],
        width: layout.folded.width,
      };

  const body = (
    <Animated.View
      pointerEvents={pointerEvents}
      style={[styles.buttonRoot, disabled ? styles.disabled : null, rectStyle]}>
      <View style={[styles.pressableWrap, pressableArea]}>
        <PressableRoot
          enabled={tsOn('hittargets')}
          onPress={handlePress}
          disabled={disabled}
          styles={styles}>
          <Animated.View
            style={[
              styles.foldedContent,
              animatedFoldedContent,
              hideFoldedContent ? styles.hidden : null,
            ]}>
            {tsOn('icons') ? (
              <Image
                source={foldedImageSource ?? imageSource}
                style={styles.icon}
              />
            ) : null}
            {tsOn('labels') ? (
              <TranslateText
                textKey={foldedTextKey ?? textKey}
                domain="main"
                maxSizeInPixels={SCREEN_HEIGHT * 0.015}
                maxLengthInPixels={layout.folded.width * 0.65}
                textStyle={styles.labelText}
                numberOfLines={1}
              />
            ) : null}
          </Animated.View>
          <Animated.View
            style={[styles.unfoldedContent, animatedUnfoldedContent]}>
            {tsOn('icons') ? (
              <Image source={imageSource} style={styles.icon} />
            ) : null}
          </Animated.View>
        </PressableRoot>
      </View>
      <Animated.View
        style={[styles.belowLabelContainer, animatedUnfoldedContent]}
        pointerEvents="none">
        {tsOn('labels') ? (
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
        ) : null}
      </Animated.View>
    </Animated.View>
  );

  return tsOn('hittargets') ? (
    <GestureDetector gesture={dragGesture}>{body}</GestureDetector>
  ) : (
    body
  );
};

// A plain View when the sub-ladder turns hit targets off, so the rung prices
// the Pressable and its press-state style callback.
const PressableRoot: React.FC<{
  enabled: boolean;
  onPress: () => void;
  disabled: boolean;
  styles: ReturnType<typeof getStyles>;
  children: React.ReactNode;
}> = ({enabled, onPress, disabled, styles, children}) =>
  enabled ? (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({pressed}) => [
        styles.pressable,
        pressed ? styles.pressed : null,
      ]}>
      {children}
    </Pressable>
  ) : (
    <View style={styles.pressable}>{children}</View>
  );

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    buttonRoot: {
      position: 'absolute',
      // The animated transform positions this; Yoga only ever sees 0, 0.
      left: 0,
      top: 0,
      height: screenHeight * UNFOLDED_TOUCH_HEIGHT_RATIO,
    },
    pressableWrap: {
      width: '100%',
      // A newly born zero-width Sell control must not leak its fixed-size
      // icon into the neighbouring Trade control.
      overflow: 'hidden',
    },
    pressableFolded: {
      height: screenHeight * GLASS_TAB_BUTTON_HEIGHT_RATIO,
    },
    pressableUnfolded: {
      height: screenHeight * UNFOLDED_TOUCH_HEIGHT_RATIO,
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
