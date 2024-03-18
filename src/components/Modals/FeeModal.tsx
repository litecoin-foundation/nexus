import React, {useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import Slider from '@react-native-community/slider';
import Modal from 'react-native-modal';

interface Props {
  isVisible: boolean;
  close: () => void;
}

const FeeModal: React.FC<Props> = props => {
  const {isVisible, close} = props;
  const [slider, setSlider] = useState(1);

  const handleSlider = (val: number) => {
    val = Math.round(val);
    if (val === slider) {
      return;
    }
    setSlider(val);
  };

  const time = Math.round(slider * 2.5);

  return (
    <View>
      <Modal
        isVisible={isVisible}
        swipeDirection="down"
        onSwipeComplete={() => close()}
        onBackdropPress={() => close()}
        backdropColor="rgb(19,58,138)"
        backdropOpacity={0.6}
        style={styles.noMargin}>
        <View style={styles.modal}>
          <View>
            <TouchableOpacity onPress={() => close()}>
              <Text>Hide Modal</Text>
            </TouchableOpacity>
            <Text>Transaction Speed</Text>
            <Text>The higher the speed, the higher the fee.</Text>
            <Text>{`${slider} blocks === ~${time}mins`}</Text>
            <Slider
              style={styles.slider}
              minimumValue={0.5}
              maximumValue={24.4}
              minimumTrackTintColor="#FFFFFF"
              maximumTrackTintColor="#000000"
              onValueChange={value => handleSlider(value)}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  modal: {
    margin: 0,
    backgroundColor: 'white',
    height: 300,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    position: 'absolute',
    bottom: 0,
    width: '100%',
    alignItems: 'center',
  },
  button: {
    height: 50,
    width: 150,
    borderRadius: 25,
    backgroundColor: 'white',
    shadowColor: '#393e53',
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 10,
  },
  noMargin: {
    margin: 0,
  },
  slider: {
    width: 300,
  },
});

export default FeeModal;
