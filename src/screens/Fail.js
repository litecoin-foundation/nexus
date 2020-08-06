import React from 'react';
import {View, Text, StyleSheet, Platform} from 'react-native';

import AnimatedLinearGradient from '../components/AnimatedLinearGradient';
import WhiteButton from '../components/Buttons/WhiteButton';

const Fail = (props) => {
  const {navigation, route} = props;
  const {amount, error} = route.params;

  return (
    <AnimatedLinearGradient
      colors={['#FF415E', '#FF9052']}
      style={styles.container}>
      <View style={styles.subContainer}>
        <Text style={styles.congratsText}>Payment Failed</Text>
        <Text style={styles.text}>YOUR PAYMENT OF</Text>
        <Text style={styles.bigText}>{amount} LTC</Text>
        <Text style={styles.text}>HAS FAILED</Text>

        <View style={styles.errorContainer}>
          <Text style={styles.text}>{error}</Text>
        </View>
      </View>
      <View style={styles.bottomContainer}>
        <WhiteButton
          value="GO TO WALLET"
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
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.28,
    paddingBottom: 5,
  },
  bigText: {
    color: 'white',
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
  bottomContainer: {
    position: 'absolute',
    bottom: 40,
    height: 70,
    alignSelf: 'center',
    justifyContent: 'space-between',
  },
  errorContainer: {
    paddingTop: 60,
  },
});

Fail.navigationOptions = {
  headerTitle: null,
  headerTransparent: true,
  headerBackTitleVisible: false,
  headerLeft: null,
  gesturesEnabled: false,
};

export default Fail;
