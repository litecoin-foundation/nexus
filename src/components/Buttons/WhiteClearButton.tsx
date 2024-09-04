import {Platform, StyleSheet, Text, TouchableOpacity} from 'react-native';
import React from 'react';

interface Props {
  onPress: () => void;
  value: string;
  small?: boolean;
  selected?: boolean;
  disabled?: boolean;
}

const WhiteClearButton = (props: Props): React.JSX.Element => {
  const {onPress, value, small, selected, disabled} = props;
  return (
    <TouchableOpacity
      style={[
        styles.container,
        small ? styles.smallContainer : null,
        selected ? styles.selectedContainer : null,
      ]}
      disabled={disabled}
      onPress={onPress}>
      <Text
        style={[
          styles.text,
          small ? styles.smallText : null,
          selected ? styles.selectedText : null,
        ]}>
        {value}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 70,
    width: 335,
    borderColor: 'white',
    borderWidth: 2,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'black',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: {
      height: 0,
      width: 0,
    },
    marginTop: 10,
    marginBottom: 10,
  },
  selectedContainer: {
    backgroundColor: 'white',
  },
  smallContainer: {
    height: 50,
    borderRadius: 9,
  },
  text: {
    fontFamily:
      Platform.OS === 'ios'
        ? 'Satoshi Variable'
        : 'SatoshiVariable-Regular.ttf',
    fontStyle: 'normal',
    fontWeight: '700',
    color: 'white',
    fontSize: 17,
  },
  selectedText: {
    color: '#1341BE',
    fontWeight: 'bold',
  },
  smallText: {
    fontSize: 15,
  },
});

export default WhiteClearButton;
