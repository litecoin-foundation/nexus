import React, {useEffect, useState} from 'react';
import {
  Text,
  StyleSheet,
  Platform,
  Dimensions,
  Image,
  Pressable,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import WalletsInblockContent from '../../components/Modals/WalletsInblockContent';

interface Props {
  title: string;
  onPress(): void;
  customFontStyles?: {};
  arrowSpinAnim: any;
  isOpen: boolean;
}

const fontSize = Math.round(Dimensions.get('screen').height * 0.018) - 1;
const arrowHeight = Math.round(Dimensions.get('screen').height * 0.012);
const boxHeight = Math.round(Dimensions.get('screen').height * 0.05);
const boxWidth =
  Dimensions.get('screen').width - Dimensions.get('screen').height * 0.04;

const ChooseWalletLargeButton: React.FC<Props> = props => {
  const {title, onPress, arrowSpinAnim, isOpen} = props;

  const [unfoldHeight, setUnfoldHeight] = useState(0);

  const heightSharedValue = useSharedValue(boxHeight);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: heightSharedValue.value,
    };
  });

  function calcUnfoldHeight(offset: number) {
    setUnfoldHeight(Dimensions.get('screen').height - offset - Dimensions.get('screen').height * 0.025);
  }

  useEffect(() => {
    heightSharedValue.value = withSpring(isOpen ? unfoldHeight : boxHeight, {
      overshootClamping: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, unfoldHeight]);

  return (
    <Pressable
      style={styles.container}
      onPress={() => {
        onPress();
      }}
      onLayout={event => {
        event.target.measure((x, y, width, height, pageX, pageY) => {
          calcUnfoldHeight(pageY);
        });
      }}>
      <Animated.View style={[styles.buttonLargeBox, animatedStyle]}>
        <Animated.View style={styles.boxTitleContainer}>
          <Text style={styles.boxText}>{title}</Text>
          <Animated.View style={[styles.boxArrow, arrowSpinAnim]}>
            <Image
              style={styles.boxArrowIcon}
              source={require('../../assets/images/back-icon.png')}
            />
          </Animated.View>
        </Animated.View>
        <WalletsInblockContent
          isOpened={isOpen}
          animDelay={100}
          animDuration={200}
        />
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0d3d8a',
    borderRadius: 10,
  },
  buttonLargeBox: {
    width: boxWidth,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    paddingTop: Dimensions.get('screen').height * 0.01,
    paddingLeft: Dimensions.get('screen').height * 0.02,
    paddingRight: Dimensions.get('screen').height * 0.02,
  },
  boxTitleContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  boxText: {
    fontFamily:
      Platform.OS === 'ios'
        ? 'Satoshi Variable'
        : 'SatoshiVariable-Regular.ttf',
    color: '#fff',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: fontSize,
    lineHeight: Dimensions.get('screen').height * 0.03,
  },
  boxArrow: {
    height: arrowHeight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginLeft: 8,
  },
  boxArrowIcon: {
    height: '100%',
    objectFit: 'contain',
  },
  boxSvg: {
    position: 'absolute',
    height: boxHeight,
    width: boxWidth,
    zIndex: -1,
  },
  disabled: {
    opacity: 0.5,
  },
});

export default ChooseWalletLargeButton;
