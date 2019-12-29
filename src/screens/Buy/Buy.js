import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useNavigation} from 'react-navigation-hooks';
import {useDispatch} from 'react-redux';

import AmountInput from '../../components/AmountInput';
import WhiteButton from '../../components/Buttons/WhiteButton';
import Header from '../../components/Header';
import {setAmount} from '../../reducers/buy';

const Buy = () => {
  const dispatch = useDispatch();
  const {navigate} = useNavigation();

  return (
    <View style={styles.container}>
      <Header />
      <View style={styles.titleContainer}>
        <Text style={styles.title}>CHOOSE AMOUNT</Text>
      </View>
      <View style={styles.amountInputContainer}>
        <AmountInput
          toggleWithoutSelection
          onChangeText={() => console.log('change text')}
          selected={() => console.log('selected')}
          onAccept={amount => {
            dispatch(setAmount(amount));
            navigate('Confirm');
          }}
          confirmButtonText="Preview Buy"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: '100%',
  },
  titleContainer: {
    height: 55,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountInputContainer: {
    height: '100%',
    paddingBottom: 180,
    backgroundColor: '#F8FBFD',
  },
  title: {
    color: '#7C96AE',
    fontSize: 12,
    fontWeight: '600',
  },
});

Buy.navigationOptions = ({navigation}) => {
  return {
    headerTitle: 'Buy',
    headerRight: (
      <WhiteButton
        value="History"
        small={true}
        active={true}
        onPress={() => navigation.navigate('History')}
      />
    ),
    headerTitleStyle: {
      fontWeight: 'bold',
      color: 'white',
    },
    headerTransparent: true,
    headerBackTitle: null,
  };
};

export default Buy;
