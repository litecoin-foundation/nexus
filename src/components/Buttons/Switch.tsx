import React, {useState} from 'react';
import {StyleSheet, Switch} from 'react-native';

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
    <Switch
      value={triggered}
      onValueChange={(value: boolean) => handlePress(value)}
      trackColor={{true: 'white'}}
      thumbColor={triggered ? '#2C72FF' : '#C2C2C2'}
      ios_backgroundColor="#E9E9E948"
      style={triggered ? styles.triggered : null}
    />
  );
};

const styles = StyleSheet.create({
  triggered: {
    borderWidth: 0.5,
    borderColor: '#D5D5D5',
  },
});

export default SwitchButton;
