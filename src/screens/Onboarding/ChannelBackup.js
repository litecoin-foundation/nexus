import React from 'react';
import {View, Text, StyleSheet, SafeAreaView, Image} from 'react-native';
import {useNavigation} from 'react-navigation-hooks';
import {useDispatch, useSelector} from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';

import WhiteButton from '../../components/WhiteButton';
import WhiteClearButton from '../../components/WhiteClearButton';
import {enableChannelBackup} from '../../reducers/channels';

const ChannelBackup = () => {
  const {navigate} = useNavigation();
  const dispatch = useDispatch();
  const biometricsAvailable = useSelector(
    state => state.authentication.biometricsAvailable,
  );

  return (
    <LinearGradient colors={['#544FE6', '#003DB3']} style={styles.container}>
      <SafeAreaView />
      <View style={styles.cardContainer}>
        <View style={styles.internalCardContainer}>
          <Text style={styles.titleText}>iCloud Backup</Text>
          <Text style={styles.descriptionText}>
            Your lightning balances will be backed up to the Cloud securely
            (encrypted so only your device can decrypt it). It is very strongly
            recommended that you enable this.
          </Text>
        </View>
        <View style={styles.imageContainer}>
          <Image
            source={require('../../assets/images/cloud.png')}
            style={styles.image}
          />
        </View>
      </View>

      <View>
        <WhiteButton
          value="Enable Cloud Backup"
          small={false}
          onPress={() => {
            dispatch(enableChannelBackup());

            if (!biometricsAvailable) {
              navigate('Welcome');
            } else {
              navigate('Biometric');
            }
          }}
        />

        <WhiteClearButton
          value="Maybe Later"
          small={true}
          onPress={() => {
            if (!biometricsAvailable) {
              navigate('Welcome');
            } else {
              navigate('Biometric');
            }
          }}
        />
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  cardContainer: {
    height: 450,
    width: 335,
    borderRadius: 12,
    backgroundColor: 'white',
    shadowColor: 'rgb(82,84,103);',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: {
      height: 0,
      width: 0,
    },
    textAlign: 'center',
  },
  internalCardContainer: {
    paddingLeft: 25,
    paddingRight: 25,
    paddingTop: 25,
  },
  titleText: {
    textAlign: 'center',
    color: '#2C72FF',
    fontSize: 27,
    fontWeight: 'bold',
    paddingBottom: 25,
  },
  descriptionText: {
    textAlign: 'center',
    color: '#4A4A4A',
    fontSize: 15,
  },
  imageContainer: {
    height: '50%',
    justifyContent: 'center',
  },
  image: {
    alignSelf: 'center',
  },
});

ChannelBackup.navigationOptions = {
  headerTitle: 'iCloud Backup',
  headerTitleStyle: {
    fontWeight: 'bold',
    color: 'white',
  },
  headerTransparent: true,
  headerBackTitle: null,
};

export default ChannelBackup;
