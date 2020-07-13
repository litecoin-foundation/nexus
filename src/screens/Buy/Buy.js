import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';

import AmountInput from '../../components/AmountInput';
import WhiteButton from '../../components/Buttons/WhiteButton';
import Header from '../../components/Header';
import {setAmount} from '../../reducers/buy';

const Buy = (props) => {
  const dispatch = useDispatch();
  const {amount, fiatAmount} = useSelector((state) => state.input);

  return (
    <View style={styles.container}>
      <Header />
      <View style={styles.titleContainer}>
        <Text style={styles.title}>CHOOSE AMOUNT</Text>
      </View>
      <View style={styles.amountInputContainer}>
        <AmountInput
          toggleWithoutSelection
          onAccept={() => {
            dispatch(setAmount(amount, fiatAmount));
            props.navigation.navigate('Confirm');
          }}
          confirmButtonDisabled={fiatAmount < 20 ? true : false}
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
  headerRight: {
    paddingRight: 18,
  },
});

Buy.navigationOptions = ({navigation}) => {
  return {
    headerTitle: 'Buy',
    headerRight: () => (
      <View style={styles.headerRight}>
        <WhiteButton
          value="History"
          small={true}
          active={true}
          onPress={() => navigation.navigate('History')}
        />
      </View>
    ),
    headerTitleStyle: {
      fontWeight: 'bold',
      color: 'white',
    },
    headerTransparent: true,
    headerBackTitleVisible: false,
    headerTintColor: 'white',
  };
};

export default Buy;
