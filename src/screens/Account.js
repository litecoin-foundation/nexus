import React, {Component} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';

import AmountView from '../components/AmountView';
import AccountCell from '../components/AccountCell';

export class Accounts extends Component {
  static navigationOptions = {
    headerTitle: 'Your Wallet',
    headerTitleStyle: {
      fontWeight: 'bold',
      color: 'white',
    },
    headerTransparent: true,
    headerBackTitle: null,
  };

  render() {
    const {
      navigation,
      amount,
      rates,
      percentSynced,
      syncedToChain,
    } = this.props;
    return (
      <View style={styles.container}>
        <AmountView />
        <Text style={styles.text}>Accounts</Text>
        <View style={styles.accountsContainer}>
          <AccountCell
            onPress={() => navigation.navigate('Wallet')}
            rates={rates}
            amount={amount}
            progress={percentSynced}
            synced={syncedToChain}
            // TODO: sync status is only shown on initial sync
            // future syncs have a timestamp difference where synced should be false if 99+%
          />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  accountsContainer: {
    flex: 1,
    alignItems: 'center',
  },
  text: {
    color: '#7C96AE',
    opacity: 0.9,
    fontSize: 11,
    letterSpacing: -0.28,
    paddingTop: 15,
    paddingBottom: 15,
    paddingLeft: 20,
  },
});

Accounts.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
  amount: PropTypes.number.isRequired,
  rates: PropTypes.objectOf(PropTypes.string),
  percentSynced: PropTypes.number,
  syncedToChain: PropTypes.bool.isRequired,
};

const mapStateToProps = state => ({
  amount: state.balance.totalBalance,
  rates: state.ticker.rates,
  percentSynced: state.info.percentSynced,
  syncedToChain: state.info.syncedToChain,
});

const mapDispatchToProps = {};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Accounts);
