import React, { Component } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { connect } from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';

import { unlockWallet } from '../reducers/lightning';
import AuthPad from '../components/Numpad/AuthPad';

export class Auth extends Component {
  state = {
    pin: ''
  };

  handleInput = async () => {
    const { pin } = this.state;
    if (pin.length === 6) {
      const { unlockWallet, navigation } = this.props;
      const status = await unlockWallet(pin);
      if (status === true) {
        navigation.navigate('App');
      } else {
        this.setState({ pin: '' });
        alert('incorrect');
      }
    }
  };

  render() {
    const { pin } = this.state;
    return (
      <View>
        <View style={{ height: 200 }}>
          <LinearGradient colors={['#7E58FF', '#544FE5']}>
            <SafeAreaView style={{ height: '100%' }}>
              <View style={styles.headerContainer}>
                <Text style={styles.headerTitleText}>Unlock Wallet</Text>
                <Text style={styles.headerDescriptionText}>Use your PIN to unlock your Wallet</Text>
                <View>
                  <Text>{pin}</Text>
                </View>
              </View>
            </SafeAreaView>
          </LinearGradient>
        </View>

        <View style={styles.padContainer}>
          <LinearGradient
            colors={['#544FE6', '#003DB3']}
            style={{ height: '100%', paddingTop: 100 }}
          >
            <AuthPad
              type="auth"
              onChange={value => this.setState({ pin: value }, () => this.handleInput())}
              currentValue={pin}
            />
          </LinearGradient>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  headerContainer: {
    flex: 1,
    alignItems: 'center'
  },
  headerTitleText: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
    paddingTop: 20,
    paddingBottom: 20
  },
  headerDescriptionText: {
    color: '#FFFFFF',
    fontSize: 15,
    paddingBottom: 40
  },
  padContainer: {
    textAlign: 'center',
    flexGrow: 1
  }
});

const mapStateToProps = state => ({});

const mapDispatchToProps = { unlockWallet };

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Auth);
