import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from 'react-navigation-hooks';
import { useDispatch } from 'react-redux';

import AmountInput from '../../components/AmountInput';
import WhiteButton from '../../components/WhiteButton';
import { setAmount } from '../../reducers/buy';

const Buy = () => {
  const dispatch = useDispatch();
  const { navigate } = useNavigation();

  return (
    <View style={{ height: '100%' }}>
      <LinearGradient colors={['#5A4FE7', '#2C44C8']} style={{ height: 120 }}>
        <SafeAreaView />
      </LinearGradient>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>CHOOSE AMOUNT</Text>
      </View>
      <View style={{ height: '100%', paddingBottom: 180 }}>
        <AmountInput
          toggleWithoutSelection
          onChangeText={() => console.log('change text')}
          selected={() => console.log('selected')}
          onAccept={amount => {
            dispatch(setAmount(amount));
            navigate('Confirm');
          }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  titleContainer: {
    height: 55,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    color: '#7C96AE',
    fontSize: 12,
    fontWeight: '600'
  }
});

Buy.navigationOptions = ({ navigation }) => {
  return {
    headerTitle: 'Buy',
    headerRight: <WhiteButton value="History" onPress={() => navigation.navigate('History')} />,
    headerTitleStyle: {
      fontWeight: 'bold',
      color: 'white'
    },
    headerTransparent: true,
    headerBackTitle: null
  };
};

export default Buy;
