import React, {useContext, useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Image} from 'react-native';
import Animated from 'react-native-reanimated';
import {useTranslation} from 'react-i18next';
import {BlurView} from 'expo-blur';
import {
  Canvas,
  RoundedRect,
  LinearGradient,
  vec,
} from '@shopify/react-native-skia';

import TranslateText from '../TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

interface Props {
  title: string;
  onPress(): void;
  disabled?: boolean;
  rotateArrow(): void;
  arrowSpinAnim: any;
}

const LiquidGlassWalletButton: React.FC<Props> = ({
  title,
  onPress,
  disabled,
  rotateArrow,
  arrowSpinAnim,
}) => {
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const {t} = useTranslation('main');

  const MAX_FONT_SIZE = SCREEN_HEIGHT * 0.02;
  const MAX_TEXT_WIDTH = SCREEN_WIDTH * 0.4;
  let fontSize = Math.round(SCREEN_HEIGHT * 0.018) - 1;
  if (fontSize > MAX_FONT_SIZE) {
    fontSize = MAX_FONT_SIZE;
  }
  const arrowHeight = Math.round(SCREEN_HEIGHT * 0.012);
  const boxHeight = Math.round(SCREEN_HEIGHT * 0.035);
  const boxPadding = Math.round(SCREEN_HEIGHT * 0.015);

  const [textWidth, setTextWidth] = useState(0);
  const onTextLayout = (event: any) => {
    setTextWidth(Math.round(event.nativeEvent.layout.width));
  };
  const clampedTextWidth = Math.min(
    textWidth || SCREEN_WIDTH * 0.18,
    MAX_TEXT_WIDTH,
  );
  const boxWidth = clampedTextWidth + arrowHeight * 2 + boxPadding * 2;
  const pillRadius = boxHeight / 2;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled}
      style={[
        styles.container,
        {height: boxHeight, minHeight: 25},
        disabled ? styles.disabled : null,
      ]}
      onPress={() => {
        onPress();
        rotateArrow();
      }}>
      <View
        style={{
          width: boxWidth,
          height: boxHeight,
          borderRadius: pillRadius,
          overflow: 'hidden',
        }}>
        {/* Frosted blur of native header behind */}
        <BlurView
          intensity={25}
          tint="light"
          style={StyleSheet.absoluteFill}
        />

        {/* Skia glass highlights on top of the blur */}
        <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
          {/* Glass body — translucent white gradient for depth */}
          <RoundedRect
            x={0}
            y={0}
            width={boxWidth}
            height={boxHeight}
            r={pillRadius}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(0, boxHeight)}
              colors={[
                'rgba(255, 255, 255, 0.22)',
                'rgba(255, 255, 255, 0.06)',
              ]}
            />
          </RoundedRect>

          {/* Edge highlight — thin bright border */}
          <RoundedRect
            x={1}
            y={1}
            width={boxWidth - 2}
            height={boxHeight - 2}
            r={pillRadius - 1}
            style="stroke"
            strokeWidth={0.5}
            color="rgba(255, 255, 255, 0.35)"
          />
        </Canvas>

        {/* Button content */}
        <View style={styles.content}>
          <Text
            style={[styles.hiddenText, {fontSize}]}
            onLayout={onTextLayout}>
            {t(title)}
          </Text>
          <TranslateText
            textKey={title}
            domain="main"
            maxSizeInPixels={MAX_FONT_SIZE}
            maxLengthInPixels={MAX_TEXT_WIDTH}
            textStyle={{
              color: '#fff',
              fontFamily: 'Satoshi Variable',
              fontSize,
              fontStyle: 'normal',
              fontWeight: '500',
            }}
            numberOfLines={1}
          />
          <Animated.View
            style={[
              {
                height: arrowHeight,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 2,
                marginLeft: 8,
              },
              arrowSpinAnim,
            ]}>
            <Image
              style={{height: '100%', objectFit: 'contain'}}
              source={require('../../assets/images/back-icon.png')}
            />
          </Animated.View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hiddenText: {
    position: 'absolute',
    opacity: 0,
    color: '#fff',
    fontFamily: 'Satoshi Variable',
    fontWeight: '500',
  },
  disabled: {
    opacity: 0.5,
  },
});

export default LiquidGlassWalletButton;
