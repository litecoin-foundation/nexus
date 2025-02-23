import {
  Canvas,
  Image,
  Mask,
  Rect,
  RoundedRect,
  Shadow,
  // Text,
  interpolateColors,
  // matchFont,
  rect,
  // useFont,
  useImage,
} from '@shopify/react-native-skia';
import React, {useEffect, useContext} from 'react';
import {
  ImageSourcePropType,
  // Platform,
  Pressable,
  StyleSheet,
} from 'react-native';
import {
  interpolateColor,
  useAnimatedProps,
  useDerivedValue,
  useSharedValue,
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
  textPadding: number;
  disabled: boolean;
  wider?: boolean;
}

const DashboardButton: React.FC<Props> = props => {
  const {
    active,
    handlePress,
    title,
    textKey,
    imageSource,
    // textPadding,
    disabled,
    wider,
  } = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const width = wider ? SCREEN_WIDTH * 0.168 : SCREEN_WIDTH * 0.152;
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT, width);

  const {t} = useTranslation('main');

  // const fontStyle = {
  //   fontFamily: 'Satoshi Variable',
  //   fontSize: 12,
  //   fontStyle: 'normal',
  //   fontWeight: '700',
  // } as const;
  // const font = Platform.select({
  //   ios: matchFont(fontStyle),
  //   default: useFont(require('../../fonts/Satoshi-Variable.ttf'), 12),
  // });
  const image = useImage(imageSource);

  // animation
  const buttonHeight = useSharedValue(49);
  const borderOpacity = useSharedValue(1);

  useEffect(() => {
    buttonHeight.value = withSpring(active ? 88 : 49, {mass: 0.5});
    borderOpacity.value = withTiming(active ? 0 : 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

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

  return (
    <>
      <Pressable
        style={[styles.buttonContainer, disabled ? styles.disabled : null]}
        onPress={() => {
          if (!disabled) {
            handlePress();
          }
        }}>
        <Canvas style={styles.container}>
          <RoundedRect
            x={SCREEN_WIDTH * 0.012}
            y={10}
            width={width}
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
            width={width}
            height={buttonHeight}
            r={12}
            color="rgba(216, 210, 210, 0.75)"
            strokeWidth={1}
            style="stroke"
            opacity={borderOpacity}
          />

          <Mask
            mode="alpha"
            mask={
              <Image
                antiAlias={true}
                image={image}
                x={
                  wider
                    ? width / 2 - SCREEN_WIDTH * 0.015 - 2.1
                    : width / 2 - SCREEN_WIDTH * 0.015
                }
                y={10}
                width={wider ? 25.2 : 21}
                height={50}
              />
            }>
            <Rect rect={rect(0, 0, 300, 300)} color={interpolatedColour} />
          </Mask>

          {/* <Text
            text={titleText}
            x={width / 2 - textPadding}
            y={82}
            font={font}
            color={interpolatedColour}
          /> */}
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
