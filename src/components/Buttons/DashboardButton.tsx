import {
  BlurMask,
  Canvas,
  Group,
  Image,
  Mask,
  Rect,
  RoundedRect,
  Shadow,
  SweepGradient,
  interpolateColors,
  rect,
  rrect,
  useImage,
  vec,
} from '@shopify/react-native-skia';
import React, {useEffect, useContext, useMemo} from 'react';
import {ImageSourcePropType, Pressable, StyleSheet} from 'react-native';
import {
  Easing,
  interpolateColor,
  useAnimatedProps,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {useTranslation} from 'react-i18next';

import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

interface Props {
  imageSource: ImageSourcePropType;
  title?: string;
  textKey?: string;
  handlePress: () => void;
  active: boolean;
  disabled: boolean;
  wider?: boolean;
  sizePercentage?: number;
  glowBorder?: boolean;
}

const DashboardButton: React.FC<Props> = props => {
  const {
    active,
    handlePress,
    title,
    textKey,
    imageSource,
    disabled,
    wider,
    sizePercentage,
    glowBorder,
  } = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const rectWidth = wider ? SCREEN_WIDTH * 0.168 : SCREEN_WIDTH * 0.152;
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT, rectWidth);

  const {t} = useTranslation('main');

  const image = useImage(imageSource);

  const canvasXPadding = useMemo(() => SCREEN_WIDTH * 0.012, [SCREEN_WIDTH]);

  // animation
  const buttonHeight = useSharedValue(49);
  const borderOpacity = useSharedValue(1);

  useEffect(() => {
    buttonHeight.value = withSpring(active ? 88 : 49, {mass: 0.5});
    borderOpacity.value = withTiming(active ? 0 : 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // Glow border animation
  const glowRotation = useSharedValue(0);

  useEffect(() => {
    if (glowBorder) {
      glowRotation.value = withRepeat(
        withTiming(2 * Math.PI, {
          duration: 8000,
          easing: Easing.linear,
        }),
        -1,
        false,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [glowBorder]);

  const glowCenter = useDerivedValue(() =>
    vec(canvasXPadding + rectWidth / 2, 10 + buttonHeight.value / 2),
  );

  const glowTransform = useDerivedValue(() => {
    const cx = canvasXPadding + rectWidth / 2;
    const cy = 10 + buttonHeight.value / 2;
    return [
      {translateX: cx},
      {translateY: cy},
      {rotate: glowRotation.value},
      {translateX: -cx},
      {translateY: -cy},
    ];
  });

  const buttonClip = useDerivedValue(() =>
    rrect(rect(canvasXPadding, 10, rectWidth, buttonHeight.value), 12, 12),
  );

  const interpolatedButtonColour = useDerivedValue(
    () =>
      interpolateColors(buttonHeight.value, [49, 88], ['#fefefe', '#2C72FF']),
    [buttonHeight],
  );

  const interpolatedColour = useDerivedValue(
    () => interpolateColors(buttonHeight.value, [49, 88], ['#47516B', '#fff']),
    [buttonHeight],
  );

  const interpolatedShadowColour = useDerivedValue(
    () =>
      interpolateColors(
        buttonHeight.value,
        [49, 88],
        ['rgba(0, 0, 0, 0.07)', 'rgba(0, 0, 0, 0)'],
      ),
    [buttonHeight],
  );

  const interpolatedInnerShadowColour = useDerivedValue(
    () =>
      interpolateColors(
        buttonHeight.value,
        [49, 88],
        ['rgba(0, 0, 0, 0.11)', 'rgba(0, 0, 0, 0)'],
      ),
    [buttonHeight],
  );

  const textColorStyle = useAnimatedProps(() => {
    return {
      color: interpolateColor(
        buttonHeight.value,
        [49, 88],
        ['#47516B', '#fff'],
      ),
    };
  });

  const titleText = title ? title : textKey ? t(textKey) : '';

  const imageWidth = useMemo(
    () =>
      wider
        ? (SCREEN_WIDTH * 0.06 * (sizePercentage || 100)) / 100
        : (SCREEN_WIDTH * 0.05 * (sizePercentage || 100)) / 100,
    [wider, SCREEN_WIDTH, sizePercentage],
  );
  const imageXAlinging = useMemo(
    () => canvasXPadding + rectWidth / 2 - imageWidth / 2,
    [imageWidth, canvasXPadding, rectWidth],
  );

  return (
    <>
      <Pressable
        style={[styles.buttonContainer, disabled ? styles.disabled : null]}
        onPress={() => {
          if (!disabled) {
            handlePress();
          }
        }}>
        <Canvas style={styles.container} pointerEvents="none">
          <RoundedRect
            x={canvasXPadding}
            y={10}
            width={rectWidth}
            height={buttonHeight}
            r={12}
            color={interpolatedButtonColour}>
            <Shadow
              dx={0}
              dy={-1}
              blur={3}
              color={interpolatedInnerShadowColour}
              inner
            />
            <Shadow dx={0} dy={2} blur={4} color={interpolatedShadowColour} />
          </RoundedRect>
          <RoundedRect
            x={SCREEN_WIDTH * 0.012}
            y={10}
            width={rectWidth}
            height={buttonHeight}
            r={12}
            color="rgba(216, 210, 210, 0.75)"
            strokeWidth={1}
            style="stroke"
            opacity={borderOpacity}
          />

          {glowBorder && !active && (
            <Group clip={buttonClip}>
              {/* Full border gradient light */}
              <Mask
                mode="alpha"
                mask={
                  <RoundedRect
                    x={canvasXPadding}
                    y={10}
                    width={rectWidth}
                    height={buttonHeight}
                    r={12}
                    style="stroke"
                    strokeWidth={4}
                    color="white"
                  />
                }>
                <Group transform={glowTransform}>
                  <Rect x={-100} y={-100} width={400} height={400}>
                    <SweepGradient
                      c={glowCenter}
                      colors={[
                        '#93C5FD',
                        '#7FB6FC',
                        '#6AA7FA',
                        '#5698F8',
                        '#4189F7',
                        '#2C72FF',
                        '#1A5AD0',
                        '#2C72FF',
                        '#4189F7',
                        '#5698F8',
                        '#6AA7FA',
                        '#7FB6FC',
                        '#93C5FD',
                      ]}
                      positions={[
                        0, 0.083, 0.167, 0.25, 0.333, 0.417, 0.5, 0.583,
                        0.667, 0.75, 0.833, 0.917, 1,
                      ]}
                    />
                  </Rect>
                </Group>
              </Mask>
              {/* Soft inner glow aura */}
              <Mask
                mode="alpha"
                mask={
                  <RoundedRect
                    x={canvasXPadding}
                    y={10}
                    width={rectWidth}
                    height={buttonHeight}
                    r={12}
                    style="stroke"
                    strokeWidth={10}
                    color="white">
                    <BlurMask blur={12} style="normal" />
                  </RoundedRect>
                }>
                <Group transform={glowTransform}>
                  <Rect x={-100} y={-100} width={400} height={400}>
                    <SweepGradient
                      c={glowCenter}
                      colors={[
                        'rgba(147, 197, 253, 0.4)',
                        'rgba(127, 182, 252, 0.42)',
                        'rgba(106, 167, 250, 0.45)',
                        'rgba(86, 152, 248, 0.47)',
                        'rgba(65, 137, 247, 0.5)',
                        'rgba(44, 114, 255, 0.55)',
                        'rgba(26, 90, 208, 0.58)',
                        'rgba(44, 114, 255, 0.55)',
                        'rgba(65, 137, 247, 0.5)',
                        'rgba(86, 152, 248, 0.47)',
                        'rgba(106, 167, 250, 0.45)',
                        'rgba(127, 182, 252, 0.42)',
                        'rgba(147, 197, 253, 0.4)',
                      ]}
                      positions={[
                        0, 0.083, 0.167, 0.25, 0.333, 0.417, 0.5, 0.583,
                        0.667, 0.75, 0.833, 0.917, 1,
                      ]}
                    />
                  </Rect>
                </Group>
              </Mask>
            </Group>
          )}

          <Mask
            mode="alpha"
            mask={
              <Image
                antiAlias={true}
                image={image}
                x={imageXAlinging}
                y={10}
                width={imageWidth}
                height={50}
              />
            }>
            <Rect rect={rect(0, 0, 300, 300)} color={interpolatedColour} />
          </Mask>
        </Canvas>
        <TranslateText
          textKey={titleText}
          domain={'main'}
          maxSizeInPixels={SCREEN_WIDTH * 0.027}
          textStyle={styles.title}
          animatedProps={textColorStyle}
          numberOfLines={1}
        />
      </Pressable>
    </>
  );
};

const getStyles = (
  screenWidth: number,
  screenHeight: number,
  buttonWidth: number,
) =>
  StyleSheet.create({
    buttonContainer: {
      width: buttonWidth + screenWidth * 0.024,
      height: 110,
    },
    container: {
      flex: 1,
    },
    title: {
      position: 'absolute',
      bottom: 25,
      width: '100%',
      color: '#000',
      fontFamily: 'Satoshi Variable',
      fontSize: screenWidth * 0.025,
      fontStyle: 'normal',
      fontWeight: '700',
      textAlign: 'center',
    },
    disabled: {
      opacity: 0.2,
    },
  });

export default DashboardButton;
