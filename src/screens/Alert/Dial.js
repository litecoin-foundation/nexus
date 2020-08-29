import React, {useState} from 'react';
import {View, Text, StyleSheet, Image} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useDispatch, useSelector} from 'react-redux';

import Header from '../../components/Header';
import SlideRuler from '../../components/SlideRuler';
import BlueButton from '../../components/Buttons/BlueButton';
import {addAlert} from '../../reducers/alerts';
import {getRandomBytes} from '../../lib/utils/random';

const Dial = (props) => {
  const dispatch = useDispatch();
  const [value, setValue] = useState(0);
  const rates = useSelector((state) => state.ticker.rates);

  return (
    <LinearGradient
      style={styles.container}
      colors={['#F6F9FC', 'rgb(238,244,249)']}>
      <Header />
      <View style={styles.subContainer}>
        <View style={styles.topContainer}>
          <View style={styles.imageContainer}>
            <Image source={require('../../assets/images/attention-big.png')} />
          </View>
          <Text style={styles.text}>ALERT ME WHEN</Text>
          <Text style={styles.boldText}>Litecoin (LTC)</Text>
          <Text style={styles.text}>
            IS {value >= rates.USD ? 'ABOVE' : 'BELOW'}
          </Text>
        </View>

        <View style={styles.flex}>
          <View style={styles.valueContainer}>
            <Text style={styles.valueText}>${value}</Text>
          </View>
          <View>
            <SlideRuler
              onValueChange={(value) => setValue(value)}
              multiplicity={1}
              initialValue={rates.USD}
            />
          </View>
        </View>
      </View>
      <View style={styles.buttonContainer}>
        <BlueButton
          value="Create alert"
          onPress={async () => {
            dispatch(
              addAlert({
                id: await getRandomBytes(),
                date: Date.now(),
                enabled: true,
                value,
                originalValue: rates.USD,
              }),
            );
            props.navigation.goBack();
          }}
        />
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  subContainer: {
    alignItems: 'center',
    flex: 1,
  },
  topContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  imageContainer: {
    paddingBottom: 46,
  },
  boldText: {
    color: '#484859',
    fontSize: 26,
    fontWeight: 'bold',
    letterSpacing: -0.36,
    paddingBottom: 6,
    paddingTop: 6,
  },
  valueText: {
    fontSize: 28,
    color: '#2C72FF',
    fontWeight: 'bold',
    letterSpacing: -0.39,
  },
  text: {
    color: '#7C96AE',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.28,
  },
  valueContainer: {
    backgroundColor: 'white',
    alignItems: 'center',
    height: 75,
    justifyContent: 'center',
  },
  flex: {
    flex: 1,
  },
  buttonContainer: {
    bottom: 0,
    position: 'absolute',
    alignSelf: 'center',
    height: 100,
  },
});

Dial.navigationOptions = ({}) => {
  return {
    headerTitle: 'Create Alert',
  };
};

export default Dial;
