import {
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  GestureResponderEvent,
} from 'react-native';
import React from 'react';

interface Props {
  title: string;
  key: string;
  onPress(event: GestureResponderEvent): void;
  selected: boolean;
}

const OptionCell: React.FC<Props> = (props: Props) => {
  const {title, onPress, selected} = props;
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Text style={styles.title}>{title}</Text>

      {selected ? (
        <Image source={require('../../assets/images/checkBlue.png')} />
      ) : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 25,
    paddingRight: 25,
    height: 50,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: '#9797974d',
    backgroundColor: 'white',
  },
  title: {
    color: '#7c96ae',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default OptionCell;
