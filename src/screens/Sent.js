import React from 'react';
import {View, Text, StyleSheet, Platform, Image} from 'react-native';

import BlueClearWhiteButton from '../components/Buttons/BlueClearWhiteButton';
import WhiteButton from '../components/Buttons/WhiteButton';
import AnimatedLinearGradient from '../components/AnimatedLinearGradient';

const Sent = (props) => {
  const {navigation, route} = props;
  const {amount, address} = route.params;
  return (
    <AnimatedLinearGradient
      style={styles.container}
      colors={['#003DB3', '#7E58FF']}>
      <View style={styles.subContainer}>
        <Text style={styles.congratsText}>Congratulations!</Text>
        <Text style={styles.text}>YOU JUST SENT</Text>
        <Text style={styles.bigText}>{amount} LTC</Text>
        <Image
          style={styles.image}
          source={require('../assets/images/down-arrow.png')}
        />
        <View style={styles.addressContainer}>
          <Text style={styles.addressText}>{address}</Text>
        </View>
      </View>
      <View style={styles.bottomContainer}>
        <BlueClearWhiteButton value="Go to Transaction" />
        <WhiteButton
          value="Go to Wallets"
          active={true}
          onPress={() => navigation.pop(2)}
          small={false}
        />
      </View>
    </AnimatedLinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  subContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.28,
    paddingBottom: 5,
  },
  bigText: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -1.2,
  },
  congratsText: {
    fontFamily:
      Platform.OS === 'ios'
        ? 'Sugarstyle Millenial'
        : 'SugarstyleMillenial-Regular.ttf',
    fontSize: 48,
    color: 'white',
    paddingBottom: 50,
  },
  addressContainer: {
    height: 50,
    width: 345,
    borderRadius: 25,
    backgroundColor: '#FFFFFF1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.54,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 40,
    height: 120,
    alignSelf: 'center',
    justifyContent: 'space-between',
  },
  image: {
    height: 14,
    width: 14,
    marginTop: 10,
    marginBottom: 20,
  },
});

Sent.navigationOptions = {
  headerTitle: null,
  headerTransparent: true,
  headerBackTitleVisible: false,
  headerTintColor: 'white',
};

export default Sent;
