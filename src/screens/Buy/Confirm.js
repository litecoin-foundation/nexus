import React, {Component} from 'react';
import {View, Text, SafeAreaView, StyleSheet} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';

import TableCell from '../../components/Cells/TableCell';
import BlueButton from '../../components/Buttons/BlueButton';
import {getQuote, priceSelector} from '../../reducers/buy';

export class Confirm extends Component {
  static navigationOptions = {
    headerTitle: 'Buy',
    headerTitleStyle: {
      fontWeight: 'bold',
      color: 'white',
    },
    headerTransparent: true,
    headerBackTitle: null,
  };

  constructor(props) {
    super(props);
    const {getQuote} = this.props;
    getQuote();
  }

  componentDidMount() {
    this.refreshRates = setInterval(() => {
      const {valid, getQuote} = this.props;
      const time = new Date();
      if (time.getTime() >= valid) {
        getQuote();
      }
    }, 2000);
  }

  componentWillUnmount() {
    clearInterval(this.refreshRates);
  }

  render() {
    const {amount, price, navigation} = this.props;
    const {pricePerUnit, fee, total} = price;
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#5A4FE7', '#2C44C8']}
          style={styles.headerContainer}>
          <SafeAreaView>
            <View style={styles.headerTitle}>
              <Text>YOU ARE PURCHASING</Text>
              <Text>
                {amount}
                LTC
              </Text>
              <Text>FROM PAYMENT PARTNER</Text>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.tableContainer}>
          <TableCell title="AVAILABLE" value="10-15 mins" />
          <TableCell title="1 LTC PRICE" value={pricePerUnit} />
          <TableCell title="PAYMENT FEE" value={fee} />
          <TableCell title="YOU WILL SPEND" value={total} />
        </View>

        <View style={styles.buttonContainer}>
          <BlueButton
            value="BUY NOW"
            onPress={() => navigation.navigate('Processing')}
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
  headerContainer: {
    height: 200,
  },
  headerTitle: {
    alignItems: 'center',
    paddingTop: 50,
  },
  tableContainer: {
    height: 200,
  },
  buttonContainer: {
    alignItems: 'center',
  },
});

Confirm.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
};

const mapStateToProps = state => ({
  amount: state.buy.amount,
  valid: state.buy.valid,
  price: priceSelector(state),
});

const mapDispatchToProps = {
  getQuote,
};

export default connect(mapStateToProps, mapDispatchToProps)(Confirm);
