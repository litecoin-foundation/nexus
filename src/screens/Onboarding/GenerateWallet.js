import React, { Component } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { connect } from 'react-redux';
import { getSeed } from '../../reducers/onboarding';

export class GenerateWallet extends Component {
  componentWillMount() {
    const { getSeed } = this.props;
    getSeed();
  }

  render() {
    const { seed, navigation } = this.props;
    const words = seed.map(val => {
      return (
        <Text style={styles.text} key={val}>
          {val}
        </Text>
      );
    });
    return (
      <View>
        {words}
        <Button
          title="I've written my paper-keys down"
          onPress={() => navigation.navigate('verifyWallet')}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  text: {
    textAlign: 'center',
    color: '#333333'
  }
});

const mapStateToProps = state => ({
  seed: state.onboarding.seed
});

const mapDispatchToProps = {
  getSeed
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(GenerateWallet);
