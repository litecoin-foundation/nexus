import React, {useEffect, useRef, useState, useContext, Fragment} from 'react';
import {StyleSheet, Image, Pressable} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

interface Props {
  initial: string;
  options: string[];
  chooseOptionCallback(option: string): void;
  cellHeight: number;
}

interface OptionProps {
  isOpened: boolean;
  currentOption: string;
  options: string[];
  onPress(option: string): void;
  styles: {
    [key: string]: any;
  };
}

const FOLDIND_ANIM_DURATION = 200;
const OPTIONS_ANIM_DURATION = FOLDIND_ANIM_DURATION;

const RenderOptionsWithDelay: React.FC<OptionProps> = props => {
  const {isOpened, currentOption, options, onPress, styles} = props;

  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);

  const [filteredOptions, setFilteredOptions] = useState<any>();
  function filterOptions() {
    setFilteredOptions(
      options
        .filter(option => option !== currentOption)
        .map(option => {
          return (
            <Animated.View style={animatedOpacity}>
              <Pressable
                style={styles.optionBtn}
                onPress={() => onPress(option)}>
                <TranslateText
                  textKey={String(option).toLowerCase()}
                  domain="searchTab"
                  maxSizeInPixels={SCREEN_HEIGHT * 0.02}
                  textStyle={styles.optionBtnText}
                  numberOfLines={1}
                />
              </Pressable>
            </Animated.View>
          );
        }),
    );
  }

  const [render, setRender] = useState(false);
  const timeout = useRef<NodeJS.Timeout>();
  useEffect(() => {
    timeout.current = setTimeout(() => {
      filterOptions();
      setRender(isOpened);
    }, OPTIONS_ANIM_DURATION);
    return () => {
      clearTimeout(timeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [render, isOpened]);

  const opacity = useSharedValue(0);
  const animatedOpacity = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  useEffect(() => {
    if (isOpened) {
      // NOTE: Fading in when it's unfolded
      opacity.value = withTiming(1, {duration: OPTIONS_ANIM_DURATION * 2});
    } else {
      opacity.value = withTiming(0, {duration: OPTIONS_ANIM_DURATION});
    }
  }, [opacity, isOpened]);

  return render ? filteredOptions : <Fragment />;
};

const DropDownButton: React.FC<Props> = props => {
  const {initial, options, chooseOptionCallback, cellHeight} = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);

  const fontSize = Math.round(SCREEN_HEIGHT * 0.02);
  const arrowHeight = Math.round(SCREEN_HEIGHT * 0.015);
  const cellHeightMultiplier = 1.45;
  const separatorGapHeight = 0;
  const bottomGapHeight = SCREEN_HEIGHT * 0.01;

  const [isOpened, setIsOpened] = useState(false);
  const [unfoldHeight, setUnfoldHeight] = useState(0);

  function calcUnfoldHeight() {
    setUnfoldHeight(
      cellHeight * cellHeightMultiplier * options.length +
        separatorGapHeight +
        bottomGapHeight,
    );
  }

  const heightSharedValue = useSharedValue(cellHeight);

  useEffect(() => {
    heightSharedValue.value = withSpring(isOpened ? unfoldHeight : cellHeight, {
      overshootClamping: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpened, unfoldHeight]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: heightSharedValue.value,
    };
  });

  function foldUnfold(toggle: boolean) {
    setIsOpened(toggle);
  }

  const [currentOption, setCurrentOption] = useState(initial);

  const styles = getStyles(
    SCREEN_WIDTH,
    SCREEN_HEIGHT,
    fontSize,
    arrowHeight,
    isOpened ? cellHeight * cellHeightMultiplier : cellHeight,
    separatorGapHeight,
  );

  return (
    <Pressable
      style={styles.container}
      onPress={() => foldUnfold(!isOpened)}
      onLayout={event => {
        // NOTE: Might be useful in case if there're so many options that they don't fit on the screen
        // so should be scrolled within the maximum available height
        // eslint-disable-next-line
        event.target.measure((x, y, width, height, pageX, pageY) => {
          calcUnfoldHeight();
        });
      }}>
      <Animated.View style={[styles.dropDownBox, animatedStyle]}>
        <Animated.View style={styles.boxTitleContainer}>
          <TranslateText
            textKey={String(currentOption).toLowerCase()}
            domain="searchTab"
            maxSizeInPixels={SCREEN_HEIGHT * 0.02}
            textStyle={styles.boxText}
            numberOfLines={1}
          />
          <Animated.View style={styles.boxArrow}>
            <Image
              style={styles.boxArrowIcon}
              source={require('../../assets/icons/tick-icon.png')}
            />
          </Animated.View>
        </Animated.View>
        <Animated.View style={styles.optionsContainer}>
          <RenderOptionsWithDelay
            isOpened={isOpened}
            currentOption={currentOption}
            options={options}
            onPress={(option: string) => {
              chooseOptionCallback(option);
              setCurrentOption(option);
              foldUnfold(false);
            }}
            styles={styles}
          />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
};

const getStyles = (
  screenWidth: number,
  screenHeight: number,
  fontSize: number,
  arrowHeight: number,
  cellHeight: number,
  separatorGapHeight: number,
) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      borderRadius: screenHeight * 0.01,
      backgroundColor: '#0F4CAD',
      justifyContent: 'center',
      alignItems: 'center',
    },
    dropDownBox: {
      width: '100%',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      overflow: 'hidden',
    },
    boxTitleContainer: {
      width: '100%',
      height: cellHeight,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: screenHeight * 0.02,
    },
    boxText: {
      color: '#fff',
      fontFamily: 'Satoshi Variable',
      fontSize: fontSize,
      fontStyle: 'normal',
      fontWeight: '500',
      letterSpacing: -0.39,
    },
    boxArrow: {
      height: arrowHeight,
    },
    boxArrowIcon: {
      height: '100%',
      objectFit: 'contain',
    },
    optionsContainer: {
      flex: 1,
    },
    optionBtn: {
      width: screenWidth * 0.35,
      height: cellHeight,
      minHeight: 25,
      borderColor: 'rgba(240,240,240,0.15)',
      borderTopWidth: 1,
      justifyContent: 'center',
      paddingHorizontal: screenHeight * 0.02,
    },
    optionBtnText: {
      color: '#fff',
      fontFamily: 'Satoshi Variable',
      fontSize: fontSize,
      fontStyle: 'normal',
      fontWeight: '500',
      letterSpacing: -0.39,
    },
    separatorGap: {
      width: '100%',
      height: separatorGapHeight,
      justifyContent: 'center',
    },
    separator: {
      width: '100%',
      height: 1,
      borderRadius: 0.5,
      backgroundColor: '#f7f7f77f',
    },
  });

export default DropDownButton;
