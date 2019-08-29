import React, { Component } from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import TableCell from '../../components/TableCell';
import BlueButton from '../../components/BlueButton';
import { getQuote, priceSelector } from '../../reducers/buy';

export class Confirm extends Component {
  static navigationOptions = {
    headerTitle: 'Buy',
    headerTitleStyle: {
      fontWeight: 'bold',
      color: 'white'
    },
    headerTransparent: true,
    headerBackTitle: null
  };

  constructor(props) {
    super(props);
    const { getQuote } = this.props;
    getQuote();
  }

  componentDidMount() {
    this.refreshRates = setInterval(() => {
      const { valid, getQuote } = this.props;
      const time = new Date();
      if (time.getTime() >= valid) {
        getQuote();
      }
    }, 2000);
  }

  render() {
    const { amount, price, navigation } = this.props;
    const { pricePerUnit, fee, total } = price;
    return (
      <View style={{ flex: 1 }}>
        <LinearGradient colors={['#5A4FE7', '#2C44C8']} style={{ height: 200 }}>
          <SafeAreaView>
            <View style={{ alignItems: 'center', paddingTop: 50 }}>
              <Text>YOU ARE PURCHASING</Text>
              <Text>
                {amount}
                LTC
              </Text>
              <Text>FROM PAYMENT PARTNER</Text>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <View style={{ height: 200 }}>
          <TableCell title="AVAILABLE" value="10-15 mins" />
          <TableCell title="1 LTC PRICE" value={pricePerUnit} />
          <TableCell title="PAYMENT FEE" value={fee} />
          <TableCell title="YOU WILL SPEND" value={total} />
        </View>

        <View style={{ alignItems: 'center' }}>
          <BlueButton value="BUY NOW" onPress={() => navigation.navigate('Processing')} />
        </View>
      </View>
    );
  }
}

Confirm.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired
  }).isRequired
};

const mapStateToProps = state => ({
  amount: state.buy.amount,
  valid: state.buy.valid,
  price: priceSelector(state)
});

const mapDispatchToProps = {
  getQuote
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Confirm);
