import React, { Component } from 'react';
import { View, Text, Button } from 'react-native';
import { connect } from 'react-redux';
import { getRandomInt, randomShuffle, getBIP39Word } from '../../lib/utils';
import { initWallet } from '../../reducers/lightning';

export class VerifyWallet extends Component {
  constructor(props) {
    super(props);
    this.handlePress = this.handlePress.bind(this);
  }

  handlePress = async (val, actualVal) => {
    const { navigation, initWallet } = this.props;
    if (val === actualVal) {
      alert(`congrats!`);
      await initWallet();
      navigation.navigate('App');
    } else {
      alert(`incorrect`);
      navigation.goBack();
    }
  };

  render() {
    const { seed } = this.props;

    // TODO: refactor all of this!
    const startNumber = getRandomInt(0, 21); // limit to 21 otherwise overflow // TODO check
    const seedArray = seed.slice(startNumber, startNumber + 3);
    const topLine = `${seedArray[0]} ________ ${seedArray[2]}`;
    const challenge = seedArray[1];
    const challengeArray = [challenge, getBIP39Word(), getBIP39Word(), getBIP39Word()];

    const shuffled = randomShuffle(challengeArray);
    const options = shuffled.map(val => {
      return <Button title={val} onPress={() => this.handlePress(val, challenge)} />;
    });

    return (
      <View>
        <Text>{topLine}</Text>
        {options}
      </View>
    );
  }
}

const mapStateToProps = state => ({
  seed: state.onboarding.seed
});

const mapDispatchToProps = { initWallet };

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(VerifyWallet);
