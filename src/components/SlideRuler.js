import React, {
  PureComponent,
  useRef,
  useState,
  useEffect,
  Fragment,
} from 'react';
import {FlatList, View, StyleSheet, Text} from 'react-native';

class Item extends PureComponent {
  render() {
    const {oneColumnSize, index} = this.props;

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
          <Text style={styles.text}>{index + 1 - 15}</Text>
        ) : null}
      </Fragment>
    );
  }
}

const comparator = (prevProps, nextProps) => {
  if (nextProps.width === 0 && prevProps.width !== 0) {
    return true;
  }

  if (nextProps.value !== prevProps.value) {
    return true;
  }

  return false;
};

const SlideRuler = React.memo(props => {
  const itemAmountPerScreen = 30;
  const flatList = useRef();

  const {
    onValueChange,
    maximumValue,
    decimalPlaces,
    multiplicity,
    arrayLength,
    initialValue,
  } = props;

  const [items, setItems] = useState(null);
  const [width, setWidth] = useState(0);
  const [oneItemWidth, setOneItemWidth] = useState(0);
  const [value, setValueState] = useState(0);

  useEffect(() => {
    let length = arrayLength;

    if (maximumValue) {
      length = maximumValue / multiplicity;
      length += itemAmountPerScreen;
    }

    setItems(new Array(length).fill(0));
  }, [arrayLength, maximumValue, multiplicity]);

  const onLayout = event => {
    setWidth(event.nativeEvent.layout.width);
    setOneItemWidth(
      Math.round(event.nativeEvent.layout.width / itemAmountPerScreen),
    );
  };

  const onSliderMoved = event => {
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
  };

  const scrollToElement = () =>
    flatList.current &&
    flatList.current.scrollToOffset({
      offset: (value * oneItemWidth) / multiplicity,
      animated: true,
    });

  const renderItem = element => (
    <Item oneColumnSize={oneItemWidth} index={element.index} />
  );

  const renderDefaultThumb = () => (
    <View style={styles.outerThumb}>
      <View style={styles.innerThumb} />
    </View>
  );

  return (
    <View style={styles.mainContainer} onLayout={onLayout}>
      <FlatList
        style={styles.flex}
        ref={flatList}
        getItemLayout={(data, index) => ({
          length: oneItemWidth,
          offset: oneItemWidth * index,
          index,
        })}
        scrollEnabled={true}
        data={width === 0 ? [] : items}
        horizontal
        onScrollEndDrag={onSliderMoved}
        onScroll={onSliderMoved}
        onMomentumScrollBegin={onSliderMoved}
        onMomentumScrollEnd={scrollToElement}
        keyExtractor={(element, index) => index.toString()}
        renderItem={renderItem}
        initialScrollIndex={initialValue}
        showsHorizontalScrollIndicator={false}
      />
      {renderDefaultThumb()}
    </View>
  );
}, comparator);

SlideRuler.defaultProps = {
  multiplicity: 0.1,
  decimalPlaces: 1,
  arrayLength: 1000,
  initialValue: 0,
};

const styles = StyleSheet.create({
  mainContainer: {
    width: '100%',
    height: 80,
    position: 'relative',
  },
  outerThumb: {
    position: 'absolute',
    left: '48%',
    alignSelf: 'center',
    height: 39,
    width: 21,
    backgroundColor: '#7E58FF1A',
    marginTop: 40,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  innerThumb: {
    height: 32,
    width: 7,
    backgroundColor: '#2C72FF',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
  },
  subBlock: {
    height: 19,
    width: 2,
    backgroundColor: 'transparent',
    alignSelf: 'flex-end',
    flexDirection: 'row',
    borderColor: '#7C96AE',
    borderBottomColor: '#7C96AE',
    borderBottomWidth: 3,
    borderRightWidth: 1,
  },
  bigSubBlock: {
    borderRightWidth: 2,
    height: 30,
  },
  text: {
    color: '#7C96AE',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: -0.28,
    position: 'absolute',
    marginTop: 26,
    paddingLeft: 8,
  },
  flex: {
    flex: 1,
  },
});

export default SlideRuler;
