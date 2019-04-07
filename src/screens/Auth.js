import React, { Component } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { connect } from 'react-redux';
import { unlockWallet } from '../reducers/lightning';

export class Auth extends Component {
  constructor(props) {
    super(props);
    this.handleInput = this.handleInput.bind(this);
  }

  handleInput = async input => {
    const { unlockWallet, navigation } = this.props;
    if (input.length === 6) {
      const status = await unlockWallet(input);
      if (status === true) {
        navigation.navigate('App');
      } else {
        alert('incorrect');
      }
    }
  };

  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.instructions}> Login with Pincode</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          keyboardType="numeric"
          autoFocus
          maxLength={6}
          onChangeText={this.handleInput}
          ref={this.pinInput}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    textAlign: 'center',
    marginTop: 50
  },
  instructions: {
    textAlign: 'center',
    marginBottom: 20
  },
  input: {
    backgroundColor: 'green',
    height: 90,
    borderWidth: 1,
    textAlign: 'center'
  }
});

const mapStateToProps = state => ({});

const mapDispatchToProps = { unlockWallet };

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Auth);
