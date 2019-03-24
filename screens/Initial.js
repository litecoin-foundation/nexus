import React, { Component } from 'react';
import { Platform, StyleSheet, View, Text, Button } from 'react-native';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { click } from '../reducers/test';

const instructions = Platform.select({
  ios: 'Press Cmd+R to reload,\nCmd+D or shake for dev menu',
  android: 'Double tap R on your keyboard to reload,\nShake or press menu button for dev menu'
});

export class Initial extends Component {
  render() {
    // eslint-disable-next-line no-shadow
    const { counter, click } = this.props;
    return (
      <View style={styles.container}>
        <Text style={styles.welcome}>React Placeholder</Text>
        <Text style={styles.instructions}>To get started, edit App.js</Text>
        <Text style={styles.instructions}>{instructions}</Text>
        <Text style={styles.instructions}>{counter}</Text>
        <Button onPress={() => click()} title="hello" />
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

Initial.propTypes = {
  counter: PropTypes.number,
  click: PropTypes.func
};

const mapStateToProps = state => ({
  counter: state.test.n
});

const mapDispatchToProps = { click };

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Initial);
