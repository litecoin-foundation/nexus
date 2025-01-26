import React, {useState} from 'react';
import {StyleSheet, View, Switch} from 'react-native';

interface Props {
  onPress: (bool: boolean) => void;
  initialValue: boolean;
}

const SwitchButton: React.FC<Props> = props => {
  const {onPress, initialValue} = props;
  const [triggered, trigger] = useState(initialValue ? initialValue : false);

  const handlePress = (value: boolean) => {
    trigger(value);
    onPress(value);
  };

  return (
    <View
      style={
        triggered
          ? {...styles.switchContainer, ...styles.triggered}
          : styles.switchContainer
      }>
      <Switch
        value={triggered}
        onValueChange={(value: boolean) => handlePress(value)}
        trackColor={{true: '#fff'}}
        thumbColor={triggered ? '#2C72FF' : '#C2C2C2'}
        ios_backgroundColor="#E9E9E948"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  switchContainer: {
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.07,
    shadowRadius: 4,
  },
  triggered: {
    borderWidth: 1,
    borderColor: '#d8d2d2c0',
  },
});

export default SwitchButton;
