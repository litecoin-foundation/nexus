import React, { Component } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { connect } from 'react-redux';
import Modal from 'react-native-modal';
import PropTypes from 'prop-types';

import AmountInput from './AmountInput';

export class RequestModal extends Component {
  render() {
    const { isVisible, close, onChange } = this.props;
    return (
      <Modal
        isVisible={isVisible}
        swipeDirection="down"
        onSwipeComplete={() => close()}
        onBackdropPress={() => close()}
        backdropColor="rgb(19,58,138)"
        backdropOpacity={0.6}
        style={{ margin: 0 }}
      >
        <View style={styles.modal}>
          <View>
            <View style={styles.textContainer}>
              <Text style={styles.text}>Choose Amount</Text>
            </View>

            <AmountInput
              onChangeText={input => onChange(input)}
              toggleWithoutSelection
              onAccept={() => close()}
            />
          </View>
        </View>
      </Modal>
    );
  }
}

const styles = StyleSheet.create({
  modal: {
    margin: 0,
    backgroundColor: 'white',
    height: 640,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    position: 'absolute',
    bottom: 0,
    width: '100%',
    alignItems: 'center'
  },
  textContainer: {
    paddingTop: 20,
    paddingBottom: 20,
    alignItems: 'center'
  },
  text: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.36,
    color: '#484859'
  }
});

RequestModal.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  close: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired
};

const mapStateToProps = state => ({});

const mapDispatchToProps = {};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(RequestModal);
