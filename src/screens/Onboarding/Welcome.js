import React from 'react';
import {StyleSheet, Text} from 'react-native';
import {useDispatch} from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';

import WhiteButton from '../../components/Buttons/WhiteButton';
import {initWallet} from '../../reducers/lightning';

const Welcome = (props) => {
  const dispatch = useDispatch();

  const handlePress = () => {
    dispatch(initWallet());
    props.navigation.navigate('AppStack');
  };

  return (
    <LinearGradient colors={['#544FE6', '#1c44b4']} style={styles.container}>
      <Text style={styles.text}>Welcome!</Text>
      <WhiteButton
        value="Tap Anywhere to Start"
        small={false}
        onPress={() => handlePress()}
        active={true}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 50,
  },
  text: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: -0.18,
    lineHeight: 34,
    paddingBottom: 556,
    textShadowColor: 'rgba(0, 0, 0, 0.11)',
    textShadowOffset: {width: 0, height: 3},
    textShadowRadius: 2,
  },
});

Welcome.navigationOptions = {
  headerTransparent: true,
  headerBackTitleVisible: false,
  headerShown: false,
};

export default Welcome;
