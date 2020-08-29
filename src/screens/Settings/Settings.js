import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import Header from '../../components/Header';
import BlueClearButton from '../../components/Buttons/BlueClearButton';

const Settings = (props) => {
  return (
    <View style={styles.container}>
      <Header />
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={() => props.navigation.navigate('General')}
          style={styles.button}>
          <Image
            source={require('../../assets/images/general.png')}
            style={styles.image}
          />
          <Text style={styles.buttonText}>GENERAL</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => props.navigation.navigate('Wallets')}
          style={styles.button}>
          <Image
            source={require('../../assets/images/wallets.png')}
            style={styles.image}
          />
          <Text style={styles.buttonText}>WALLETS</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => props.navigation.navigate('Channel')}
          style={styles.button}>
          <Text style={styles.buttonText}>CHANNELS</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.bottomContainer}>
        <LinearGradient
          colors={['#F6F9FC', 'rgba(210,225,239,0)']}
          style={styles.gradient}>
          <View style={styles.bottomTextContainer}>
            <Text style={styles.bottomText}>Last Signed In on Apr 20 2019</Text>
          </View>
          <View style={styles.bottomButtonContainer}>
            <BlueClearButton
              value="Sign Out"
              onPress={() => props.navigation.navigate('AuthStack')}
            />
          </View>
        </LinearGradient>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgb(238,244,249)',
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  button: {
    width: '50%',
    height: Dimensions.get('window').width / 2,
    aspectRatio: 1,
    borderColor: '#979797',
    borderWidth: 0.5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  buttonText: {
    color: '#7C96AE',
    fontSize: 12,
    fontWeight: '600',
  },
  image: {
    marginBottom: 15,
  },
  bottomContainer: {
    bottom: 0,
    height: 135,
  },
  gradient: {
    flex: 1,
  },
  bottomText: {
    opacity: 0.9,
    color: '#7C96AE',
    fontSize: 11,
    fontWeight: '500',
  },
  bottomTextContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 40,
  },
  bottomButtonContainer: {
    flex: 1,
    alignItems: 'center',
  },
});

Settings.navigationOptions = {
  headerTitle: 'Settings',
};

export default Settings;
