import React, { Component } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { connect } from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';
import PropTypes from 'prop-types';

import GreenButton from './GreenButton';
import { converter } from '../lib/utils';

export class AmountView extends Component {
  render() {
    const { rates, totalBalance } = this.props;
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#5A4FE7', '#2C44C8']} style={{ height: '100%' }}>
          <SafeAreaView>
            <View style={styles.subview}>
              <View style={styles.fiat}>
                <Text style={styles.fiatText}>
                  {converter.satoshisToBtc(totalBalance) * rates.USD}
                </Text>
              </View>
              <View style={styles.amount}>
                <Text style={styles.amountText}>{converter.satoshisToBtc(totalBalance)}</Text>
                <Text style={styles.amountSymbol}>Ł</Text>
              </View>
              <GreenButton value="+0.92%" />
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    top: 0,
    height: 300,
    width: '100%'
  },
  subview: {
    flex: 1,
    flexDirection: 'column',
    flexWrap: 'nowrap',
    alignItems: 'center',
    paddingTop: 50
  },
  amount: {
    height: 40,
    alignItems: 'flex-end',
    flexDirection: 'row',
    marginBottom: 5
  },
  amountText: {
    fontWeight: 'bold',
    fontSize: 28,
    color: '#FFFFFF'
  },
  amountSymbol: {
    fontStyle: 'italic',
    fontWeight: 'bold',
    fontSize: 17,
    color: '#FFFFFF',
    lineHeight: 27
  },
  fiat: {
    height: 13
  },
  fiatText: {
    opacity: 0.9,
    color: '#7C96AE',
    fontSize: 11,
    letterSpacing: -0.28,
    lineHeight: 13
  }
});

AmountView.propTypes = {
  rates: PropTypes.objectOf(PropTypes.string).isRequired,
  totalBalance: PropTypes.number.isRequired
};

const mapStateToProps = state => ({
  rates: state.ticker.rates,
  totalBalance: state.balance.totalBalance
});

const mapDispatchToProps = {};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AmountView);
