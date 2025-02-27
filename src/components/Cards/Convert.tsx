import React, {useContext, useEffect, useState} from 'react';
import {View, Text, StyleSheet, Pressable} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import ConvertField from '../InputFields/ConvertField';
import BuyPad from '../Numpad/BuyPad';
import BlueButton from '../Buttons/BlueButton';
import {useAppSelector} from '../../store/hooks';
import {
  satsToSubunitSelector,
  subunitSymbolSelector,
} from '../../reducers/settings';
import {useDispatch} from 'react-redux';
import {
  resetInputs,
  updatePrivateAmount,
  updateRegularAmount,
} from '../../reducers/input';

import {ScreenSizeContext} from '../../context/screenSize';

interface Props {}

const Convert: React.FC<Props> = props => {
  const {} = props;
  const dispatch = useDispatch();
  const [activeField, setActiveField] = useState('regular');
  const {regularConfirmedBalance, privateConfirmedBalance} = useAppSelector(
    state => state.balance,
  );
  const {regularAmount, privateAmount} = useAppSelector(
    state => state.input.convert,
  );
  const convertToSubunit = useAppSelector(state =>
    satsToSubunitSelector(state),
  );
  const amountSymbol = useAppSelector(state => subunitSymbolSelector(state));

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  useEffect(() => {
    return function cleanup() {
      dispatch(resetInputs());
    };
  }, [dispatch]);

  const onChange = (value: string) => {
    if (activeField === 'regular') {
      dispatch(updateRegularAmount(value));
    } else if (activeField === 'private') {
      dispatch(updatePrivateAmount(value));
    }
  };

  const pressArrow = () => {
    if (activeField === 'regular') {
      setActiveField('private');
    } else if (activeField === 'private') {
      setActiveField('regular');
    }
  };

  // animation
  const rotation = useSharedValue(0);
  const scaler = useSharedValue(1);

  useEffect(() => {
    rotation.value = withTiming(activeField === 'private' ? 180 : 0, {
      duration: 300,
    });
  }, [activeField]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{rotate: `${rotation.value}deg`}],
  }));

  // arrow button animation
  const motionStyle = useAnimatedStyle(() => {
    return {
      transform: [{scale: scaler.value}],
    };
  });

  const onPressIn = () => {
    scaler.value = withSpring(0.9, {mass: 1});
  };

  const onPressOut = () => {
    scaler.value = withSpring(1, {mass: 0.7});
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputsContainer}>
        <View style={styles.fieldContainer}>
          <Text style={styles.smallText}>YOUR REGULAR LITECOIN</Text>
          <ConvertField
            active={activeField === 'regular'}
            amount={regularAmount}
            handlePress={() => {
              setActiveField('regular');
              dispatch(resetInputs());
            }}
          />
          <Text style={styles.smallText}>
            {convertToSubunit(regularConfirmedBalance)}
            {amountSymbol}
          </Text>
        </View>

        <Animated.View style={[styles.arrowButtonContainer, motionStyle]}>
          <Pressable
            style={styles.arrowButton}
            onPress={pressArrow}
            onPressIn={onPressIn}
            onPressOut={onPressOut}>
            <Animated.Image
              style={[styles.arrowImage, animatedStyle]}
              source={require('../../assets/images/arrow-convert.png')}
            />
          </Pressable>
        </Animated.View>

        <View style={styles.fieldContainer}>
          <Text style={styles.smallText}>YOUR PRIVATE LITECOIN</Text>
          <ConvertField
            active={activeField === 'private'}
            amount={privateAmount}
            handlePress={() => {
              setActiveField('private');
              dispatch(resetInputs());
            }}
          />
          <Text style={styles.smallText}>
            {convertToSubunit(privateConfirmedBalance)}
            {amountSymbol}
          </Text>
        </View>
      </View>

      <View style={styles.bottomContainer}>
        <View style={styles.numpadContainer}>
          <BuyPad
            onChange={(value: string) => onChange(value)}
            currentValue={
              activeField === 'regular' ? regularAmount : privateAmount
            }
          />
        </View>

        <View style={styles.buttonContainer}>
          <BlueButton
            disabled={false}
            textKey="convert_button"
            textDomain="convertTab"
            onPress={() => {
              console.log('pressed');
            }}
          />
        </View>
      </View>
    </View>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      width: screenWidth,
      height: screenHeight * 0.55,
      paddingHorizontal: screenWidth * 0.06,
    },
    inputsContainer: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-evenly',
    },
    bottomContainer: {
      flexBasis: '82%',
      width: '100%',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    buttonContainer: {
      flexBasis: '20%',
      width: '100%',
      marginVertical: screenHeight * 0.02,
    },
    fieldContainer: {
      flex: 1,
      flexDirection: 'column',
      justifyContent: 'center',
    },
    numpadContainer: {
      width: screenWidth,
    },
    smallText: {
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.013,
      fontStyle: 'normal',
      fontWeight: '700',
      color: '#7C96AE',
    },
    arrowButtonContainer: {
      marginHorizontal: screenWidth * 0.024,
      justifyContent: 'center',
    },
    arrowButton: {
      backgroundColor: '#2C72FF',
      borderRadius: 10,
      height: screenHeight * 0.055,
      width: screenHeight * 0.055,
      alignItems: 'center',
      justifyContent: 'center',
    },
    arrowImage: {
      height: 13,
      width: 20,
    },
  });

export default Convert;
