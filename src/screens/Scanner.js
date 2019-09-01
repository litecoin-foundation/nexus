import React, {Component} from 'react';
import {View, StyleSheet, Dimensions, Vibration} from 'react-native';
import {connect} from 'react-redux';
import {RNCamera} from 'react-native-camera';

export class Scanner extends Component {
  handleRead = event => {
    Vibration.vibrate();
    const address = event.data;
    alert(address);
    // validate address, then handle
  };

  render() {
    return (
      <View>
        <RNCamera
          style={styles.camera}
          captureAudio={false}
          onBarCodeRead={this.handleRead}
          type={RNCamera.Constants.Type.back}
          barCodeTypes={[RNCamera.Constants.BarCodeType.qr]}
          androidCameraPermissionOptions={{
            title: 'Permission to use Camera',
            message:
              'App will use your camera to scan QR codes for Litecoin Payments',
            buttonPositive: 'Ok',
            buttonNegative: 'Cancel',
          }}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  camera: {
    height: Dimensions.get('window').height,
  },
});

const mapStateToProps = state => ({});

const mapDispatchToProps = {};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Scanner);
