import React, { Component } from 'react';
import { StyleSheet, View, Button } from 'react-native';
import { connect } from 'react-redux';

export class Initial extends Component {
  render() {
    const { navigation } = this.props;
    return (
      <View style={styles.container}>
        <Button onPress={() => navigation.navigate('createPin')} title="Create Wallet" />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF'
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5
  }
});

const mapStateToProps = state => ({});

const mapDispatchToProps = {};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Initial);
