import React, {useEffect} from 'react';
import {ImageSourcePropType, StyleSheet, View, Platform} from 'react-native';
import {TouchableOpacity} from 'react-native-gesture-handler';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface Props {
  imageSource: ImageSourcePropType;
  title: string;
  handlePress: () => void;
  active: boolean;
}

const DashboardButton: React.FC<Props> = props => {
  const {imageSource, title, handlePress, active} = props;

  // animates when active prop changes
  useEffect(() => {
    buttonHeight.value = active ? 88 : 50;
    progress.value = withTiming(1 - progress.value, {duration: 200});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const buttonHeight = useSharedValue(active ? 88 : 49);
  const progress = useSharedValue(active ? 0 : 1);

  const animatedButtonContainerStyle = useAnimatedStyle(() => {
    return {
      height: withSpring(buttonHeight.value, {mass: 0.5}),
      backgroundColor: interpolateColor(
        progress.value,
        [0, 1],
        ['#fefefe', '#2C72FF'],
      ),
      borderColor: interpolateColor(
        progress.value,
        [0, 1],
        ['rgba(216, 210, 210, 0.75)', 'rgba(0,0,0,0)'],
      ),
    };
  });

  const animatedImageStyle = useAnimatedStyle(() => {
    return {
      tintColor: interpolateColor(progress.value, [0, 1], ['black', 'white']),
    };
  });

  const animatedTextStyle = useAnimatedStyle(() => {
    return {
      color: interpolateColor(progress.value, [0, 1], ['black', 'white']),
    };
  });

  return (
    <TouchableOpacity onPress={handlePress}>
      <>
        <Animated.View style={[styles.container, animatedButtonContainerStyle]}>
          <Animated.Image style={animatedImageStyle} source={imageSource} />
        </Animated.View>
        <View style={styles.textContainer}>
          <Animated.Text style={[styles.text, animatedTextStyle]}>
            {title}
          </Animated.Text>
        </View>
      </>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#fefefe',
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    position: 'absolute',
    width: '100%',
    marginTop: 60,
  },
  text: {
    fontFamily:
      Platform.OS === 'ios'
        ? 'Satoshi Variable'
        : 'SatoshiVariable-Regular.ttf',
    fontStyle: 'normal',
    fontWeight: '700',
    color: '#2E2E2E',
    fontSize: 12,
    textAlign: 'center',
  },
});

export default DashboardButton;
