import React, {
  useEffect,
  useRef,
  useState,
  useContext,
  Fragment,
  useCallback,
  useMemo,
} from 'react';
import {StyleSheet, Image, Pressable, LayoutChangeEvent} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  useAnimatedProps,
} from 'react-native-reanimated';
import {v4 as uuidv4} from 'uuid';

import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

interface Props {
  initial: string;
  options: string[];
  chooseOptionCallback(option: string): void;
  cellHeight: number;
  cellHeightExpandMultiplier: number;
  separatorGapHeightInPx?: number;
}

interface OptionProps {
  isOpened: boolean;
  currentOption: string;
  options: string[];
  onPress(option: string): void;
  styles: {
    [key: string]: any;
  };
  cellHeightAnimatedStyle: any;
}

const FOLDING_ANIM_DURATION = 200;
const OPTIONS_ANIM_DURATION = FOLDING_ANIM_DURATION;

const RenderOptionsWithDelay: React.FC<OptionProps> = props => {
  const {
    isOpened,
    currentOption,
    options,
    onPress,
    styles,
    cellHeightAnimatedStyle,
  } = props;

  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);

  const [filteredOptions, setFilteredOptions] = useState<any>();
  function filterOptions() {
    setFilteredOptions(
      options
        .filter(option => option !== currentOption)
        .map(option => {
          return (
            <Animated.View style={animatedOpacity} key={uuidv4()}>
              <Animated.View
                style={[styles.optionBtnContainer, cellHeightAnimatedStyle]}>
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
  const {
    initial,
    options,
    chooseOptionCallback,
    cellHeight,
    cellHeightExpandMultiplier,
    separatorGapHeightInPx,
  } = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);

  const fontSize = Math.round(SCREEN_HEIGHT * 0.02);
  const arrowHeight = Math.round(SCREEN_HEIGHT * 0.015);
  const cellHeightMultiplier = cellHeightExpandMultiplier;
  const separatorGapHeight = separatorGapHeightInPx || 0;

  const [isOpened, setIsOpened] = useState(false);
  const [unfoldHeight, setUnfoldHeight] = useState(0);
  const [currentOption, setCurrentOption] = useState(initial);

  const styles = useMemo(
    () =>
      getStyles(
        SCREEN_WIDTH,
        SCREEN_HEIGHT,
        fontSize,
        arrowHeight,
        cellHeight,
        separatorGapHeight,
      ),
    [
      SCREEN_WIDTH,
      SCREEN_HEIGHT,
      fontSize,
      arrowHeight,
      cellHeight,
      separatorGapHeight,
    ],
  );

  // NOTE: LayoutChangeEvent might be useful in case if there're so many options that they don't fit on the screen
  // so should be scrolled within the maximum available height
  const calcUnfoldHeight = useCallback(
    (event: LayoutChangeEvent) => {
      setUnfoldHeight(
        cellHeight * cellHeightMultiplier * options.length + separatorGapHeight,
      );
    },
    [cellHeight, cellHeightMultiplier, separatorGapHeight, options],
  );

  const heightSharedValue = useSharedValue(cellHeight);
  const cellHeightSharedValue = useSharedValue(cellHeight);

  useEffect(() => {
    heightSharedValue.value = withTiming(isOpened ? unfoldHeight : cellHeight, {
      duration: FOLDING_ANIM_DURATION,
    });
    cellHeightSharedValue.value = withTiming(
      isOpened ? cellHeight * cellHeightMultiplier : cellHeight,
      {
        duration: FOLDING_ANIM_DURATION,
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpened, unfoldHeight]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: heightSharedValue.value,
    };
  });

  const cellHeightAnimatedStyle = useAnimatedProps(() => {
    return {
      height: cellHeightSharedValue.value,
    };
  });

  function foldUnfold(toggle: boolean) {
    setIsOpened(toggle);
  }

  return (
    <Pressable
      style={styles.container}
      onPress={() => foldUnfold(!isOpened)}
      onLayout={calcUnfoldHeight}>
      <Animated.View style={[styles.dropDownBox, animatedStyle]}>
        <Animated.View
          style={[styles.boxTitleContainer, cellHeightAnimatedStyle]}>
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
            cellHeightAnimatedStyle={cellHeightAnimatedStyle}
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
    optionBtnContainer: {
      width: screenWidth * 0.35,
      height: cellHeight,
      borderColor: 'rgba(240,240,240,0.15)',
      borderTopWidth: 1,
    },
    optionBtn: {
      width: '100%',
      height: '100%',
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
