import React, {useContext} from 'react';
import {StyleSheet, Pressable, Image, ImageSourcePropType} from 'react-native';

import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

interface Props {
  value?: string;
  textKey?: string;
  textDomain?: string;
  onPress: () => void;
  disabled?: boolean;
  small?: boolean;
  rounded?: boolean;
  imageSource?: ImageSourcePropType;
  imageXY?: {
    x: number;
    y: number;
  };
}

const NewWhiteButton: React.FC<Props> = props => {
  const {
    value,
    textKey,
    textDomain,
    onPress,
    disabled,
    small,
    rounded,
    imageSource,
    imageXY,
  } = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT, rounded, imageXY);

  // animation
  const scaler = useSharedValue(1);

  const motionStyle = useAnimatedStyle(() => {
    return {
      transform: [{scale: scaler.value}],
    };
  });

  const textStyle = imageSource
    ? {...styles.text, ...styles.textWithImage}
    : styles.text;

  const onPressIn = () => {
    scaler.value = withSpring(0.96, {mass: 1});
  };

  const onPressOut = () => {
    scaler.value = withSpring(1, {mass: 0.7});
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={onPressIn}
      onPressOut={onPressOut}>
      <Animated.View
        style={[
          styles.container,
          small ? styles.small : styles.big,
          disabled ? styles.disabled : null,
          motionStyle,
        ]}>
        {imageSource ? (
          <Image source={imageSource} style={imageXY ? styles.image : null} />
        ) : null}
        {value ? (
          <TranslateText
            textValue={value}
            maxSizeInPixels={SCREEN_HEIGHT * 0.022}
            textStyle={textStyle}
            numberOfLines={1}
          />
        ) : textKey && textDomain ? (
          <TranslateText
            textKey={textKey}
            domain={textDomain}
            maxSizeInPixels={SCREEN_HEIGHT * 0.022}
            textStyle={textStyle}
            numberOfLines={1}
          />
        ) : (
          <></>
        )}
      </Animated.View>
    </Pressable>
  );
};

const getStyles = (
  screenWidth: number,
  screenHeight: number,
  rounded: boolean | undefined,
  imageXY:
    | {
        x: number;
        y: number;
      }
    | undefined,
) =>
  StyleSheet.create({
    container: {
      height: screenHeight * 0.055,
      backgroundColor: '#fff',
      borderRadius: rounded ? screenHeight * 0.0275 : screenHeight * 0.01,
      borderColor: '#e5e5e5',
      borderWidth: 1.5,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: screenHeight * 0.025,
    },
    small: {
      width: screenWidth * 0.7,
      height: screenHeight * 0.055,
      borderRadius: rounded ? screenHeight * 0.0275 : screenHeight * 0.01,
    },
    big: {
      width: '100%',
      height: screenHeight * 0.06,
      borderRadius: rounded ? screenHeight * 0.03 : screenHeight * 0.012,
    },
    image: {
      width: imageXY ? imageXY.x : screenHeight * 0.035,
      height: imageXY ? imageXY.y : '100%',
      objectFit: 'cover',
    },
    text: {
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      color: '#000',
      fontSize: screenHeight * 0.02,
    },
    textWithImage: {
      marginLeft: screenHeight * 0.01,
    },
    disabled: {
      opacity: 0.5,
    },
    smallText: {
      fontSize: screenHeight * 0.017,
    },
  });

export default NewWhiteButton;
