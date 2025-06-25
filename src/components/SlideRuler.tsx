import React, {
  useState,
  useEffect,
  useContext,
  Fragment,
  useCallback,
  useMemo,
} from 'react';
import {FlatList, View, StyleSheet} from 'react-native';
import {triggerHeavyFeedback, triggerLightFeedback} from '../lib/utils/haptic';

import TranslateText from '../components/TranslateText';
import {ScreenSizeContext} from '../context/screenSize';

interface ItemProps {
  oneColumnSize: number;
  index: number;
}

const Item: React.FC<ItemProps> = props => {
  const {oneColumnSize, index} = props;

  const {width, height} = useContext(ScreenSizeContext);
  const styles = getStyles(width, height);

  return (
    <Fragment>
      <View
        style={[
          styles.subBlock,
          {width: oneColumnSize},
          (index + 1) % 5 === 0 ? styles.bigSubBlock : null,
        ]}
      />
      {(index + 1) % 5 === 0 ? (
        <TranslateText
          textValue={String(index + 1 - 15)}
          maxSizeInPixels={height * 0.016}
          textStyle={styles.metricText}
          numberOfLines={1}
        />
      ) : null}
    </Fragment>
  );
};

interface Props {
  onValueChange: (slideValue: number) => void;
  maximumValue: number;
  decimalPlaces: number;
  multiplicity: number;
  arrayLength: number;
  initialValue: number;
}

const SlideRuler: React.FC<Props> = props => {
  const itemAmountPerScreen = 30;

  const {
    onValueChange,
    maximumValue,
    decimalPlaces,
    multiplicity,
    arrayLength,
    initialValue,
  } = props;

  const {width, height} = useContext(ScreenSizeContext);
  const styles = getStyles(width, height);

  const [items, setItems] = useState<any[]>([]);
  const [oneItemWidth, setOneItemWidth] = useState(0);
  const [value, setValueState] = useState(
    initialValue ? Number(initialValue) : 0,
  );

  useEffect(() => {
    if (value % 5 === 0) {
      // multiple of 5
      triggerHeavyFeedback();
    } else {
      triggerLightFeedback();
    }
  }, [value]);

  useEffect(() => {
    let length = arrayLength;

    if (maximumValue) {
      length = parseInt(String(maximumValue / multiplicity), 10);
      length += itemAmountPerScreen;
    }

    setItems(new Array(length).fill(0));
  }, [arrayLength, maximumValue, multiplicity]);

  const onLayout = () => {
    setOneItemWidth(Math.ceil(width / itemAmountPerScreen));
  };

  const onSliderMoved = useCallback(
    (event: any) => {
      let newValue =
        Math.floor(event.nativeEvent.contentOffset.x / oneItemWidth) *
        multiplicity;
      if (maximumValue && newValue > maximumValue) {
        newValue = maximumValue;
      }

      const setValue = parseFloat(
        parseFloat(newValue.toString()).toFixed(decimalPlaces),
      );

      setValueState(setValue);
      onValueChange(setValue);
    },
    [decimalPlaces, maximumValue, multiplicity, onValueChange, oneItemWidth],
  );

  const renderItem = useCallback(
    (element: any) => (
      <Item oneColumnSize={oneItemWidth} index={element.index} />
    ),
    [oneItemWidth],
  );

  const List = useCallback(
    () => (
      <FlatList
        data={width === 0 ? [] : items}
        renderItem={renderItem}
        keyExtractor={(element, index) => index.toString()}
        initialScrollIndex={initialValue ? Number(initialValue) : 0}
        getItemLayout={(data, index) => ({
          length: oneItemWidth,
          offset: oneItemWidth * index,
          index,
        })}
        scrollEnabled={true}
        horizontal
        onScroll={onSliderMoved}
        showsHorizontalScrollIndicator={false}
      />
    ),
    [width, items, initialValue, onSliderMoved, oneItemWidth, renderItem],
  );

  const renderThumb = useMemo(
    () => (
      <View style={styles.outerThumb}>
        <View style={styles.innerThumb} />
      </View>
    ),
    [styles],
  );

  return (
    <View style={styles.mainContainer} onLayout={onLayout}>
      <List />
      {renderThumb}
    </View>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    mainContainer: {
      width: '100%',
      height: screenHeight * 0.085,
    },
    outerThumb: {
      position: 'absolute',
      left: '48%',
      bottom: 0,
      alignSelf: 'center',
      height: screenHeight * 0.045,
      width: screenHeight * 0.025,
      borderTopLeftRadius: screenHeight < 701 ? 2 : 3,
      borderTopRightRadius: screenHeight < 701 ? 2 : 3,
      backgroundColor: '#20bb7420',
      marginBottom: screenHeight * 0.02,
    },
    innerThumb: {
      height: screenHeight * 0.035,
      width: screenHeight * 0.009,
      borderTopLeftRadius: screenHeight < 701 ? 2 : 3,
      borderTopRightRadius: screenHeight < 701 ? 2 : 3,
      backgroundColor: '#20BB74',
      alignSelf: 'center',
      marginTop: screenHeight * 0.01,
    },
    subBlock: {
      height: screenHeight * 0.025,
      width: 2,
      backgroundColor: 'transparent',
      alignSelf: 'flex-end',
      flexDirection: 'row',
      borderColor: '#7C96AE',
      borderBottomColor: '#7C96AE',
      borderBottomWidth: 3,
      borderRightWidth: 1,
      marginBottom: screenHeight * 0.02,
    },
    bigSubBlock: {
      height: screenHeight * 0.035,
      borderRightWidth: 2,
    },
    metricText: {
      position: 'absolute',
      left: screenWidth * 0.08 * -1,
      bottom: 0,
      width: screenWidth * 0.16,
      color: '#7C96AE',
      fontSize: screenHeight * 0.013,
      fontWeight: '500',
      textAlign: 'center',
      letterSpacing: -0.28,
    },
  });

export default SlideRuler;
