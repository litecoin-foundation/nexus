import React from 'react';
import {Platform, Pressable, StyleSheet, Text, View} from 'react-native';

interface Props {
  active: boolean;
  title: string;
  onPress: () => void;
}

const FilterButton: React.FC<Props> = props => {
  const {active, title, onPress} = props;
  return (
    <Pressable
      style={[styles.container, active ? styles.activeButton : null]}
      onPress={onPress}>
      <View>
        <Text style={styles.text}>{title}</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 57,
    width: 52,
    borderRadius: 11,
    backgroundColor: undefined,
    alignItems: 'center',
  },
  text: {
    fontFamily:
      Platform.OS === 'ios'
        ? 'Satoshi Variable'
        : 'SatoshiVariable-Regular.ttf',
    fontStyle: 'normal',
    fontWeight: '700',
    color: 'white',
    fontSize: 12,
  },
  activeButton: {
    backgroundColor: '#0A429B',
  },
});

export default FilterButton;
