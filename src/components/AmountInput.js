import React, {useState, useEffect} from 'react';
import {View, StyleSheet, Text, TouchableOpacity} from 'react-native';
import {useSelector, useDispatch} from 'react-redux';

import Pad from './Numpad/Pad';
import BlueButton from './Buttons/BlueButton';
import {updateAmount, updateFiatAmount, resetInputs} from '../reducers/input';

const AmountInput = (props) => {
  const {
    toggleWithoutSelection,
    confirmButtonText,
    selected,
    onChangeText,
    onAccept,
  } = props;
  const dispatch = useDispatch();
  const amount = useSelector((state) => state.input.amount);
  const fiatAmount = useSelector((state) => state.input.fiatAmount);

  const [leftToggled, toggleLeft] = useState(true);
  const [toggled, toggle] = useState(false);

  const handlePress = (side) => {
    if (side === 'left') {
      toggleLeft(true);
      toggle(true);
      if (selected) {
        selected();
      }
    } else {
      toggleLeft(false);
      toggle(true);
      if (selected) {
        selected();
      }
    }
  };

  const onChange = (value) => {
    if (leftToggled) {
      dispatch(updateAmount(value));
    } else {
      dispatch(updateFiatAmount(value));
    }
  };

  useEffect(() => {
    if (onChangeText) {
      onChangeText(amount);
    }
  }, [amount, onChangeText, toggled]);

  useEffect(() => {
    return () => {
      dispatch(resetInputs());
    };
  }, [dispatch]);

  const PadContainer = (
    <View style={styles.padContainer}>
      <Pad
        onChange={(value) => onChange(value)}
        currentValue={leftToggled ? amount : fiatAmount}>
        <View style={styles.centerAlign}>
          <BlueButton
            value={confirmButtonText}
            onPress={() => {
              toggle(false);
              onAccept(amount);
            }}
          />
        </View>
      </Pad>
    </View>
  );

  return (
    <View style={[toggled || toggleWithoutSelection ? styles.height : null]}>
      <View style={styles.container}>
        <View style={styles.area}>
          <TouchableOpacity
            style={[styles.left, leftToggled ? styles.active : styles.inActive]}
            onPress={() => handlePress('left')}>
            <Text
              style={[
                styles.leftText,
                leftToggled ? styles.textActive : styles.textInactive,
              ]}>
              {amount} LTC
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.right,
              !leftToggled ? styles.active : styles.inActive,
            ]}
            onPress={() => handlePress('right')}>
            <Text
              style={[
                styles.rightText,
                leftToggled ? styles.textInactive : styles.textActive,
              ]}>
              ${fiatAmount}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      {toggleWithoutSelection ? PadContainer : null}
      {toggled && !toggleWithoutSelection ? PadContainer : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 77,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E1E1E1',
    shadowColor: 'rgb(82,84,103)',
    shadowOpacity: 0.12,
    shadowRadius: 2,
    shadowOffset: {
      height: 0,
      width: 0,
    },
  },
  padContainer: {
    backgroundColor: '#F8FBFD',
    flex: 1,
  },
  area: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  left: {
    justifyContent: 'center',
    width: '70%',
    borderRightColor: '#DBDBDB',
    borderRightWidth: 1,
    height: '100%',
  },
  leftText: {
    color: '#2C72FF',
    fontWeight: '600',
    paddingLeft: 20,
  },
  right: {
    justifyContent: 'center',
    width: '30%',
  },
  rightText: {
    color: '#20BB74',
    fontWeight: '600',
    paddingLeft: 20,
  },
  active: {
    width: '70%',
  },
  inActive: {
    width: '30%',
  },
  textActive: {
    fontSize: 28,
  },
  textInactive: {
    fontSize: 18,
  },
  height: {
    height: '100%',
  },
  centerAlign: {
    alignItems: 'center',
  },
});

export default AmountInput;
