import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import BottomSheet from '../../components/BottomSheet';

interface Props {}

const ConfirmSend: React.FC<Props> = props => {
  const poop = (
    <View
      style={{
        backgroundColor: 'red',
        padding: 8,
        marginVertical: 8,
      }}>
      <Text>
        Lorem ipsum dolor sit, amet consectetur adipisicing elit. Obcaecati quia
        quas porro animi nobis debitis quo quisquam tenetur voluptates neque,
        ipsam esse aliquam quos autem eveniet optio repellat laudantium non.
      </Text>
    </View>
  );
  return (
    <View style={styles.container}>
      <BottomSheet>
        {poop}
        {poop}
        {poop}
        {poop}
        {poop}
        {poop}
        {poop}
        {poop}
        {poop}
        {poop}
        {poop}
        {poop}
        {poop}
        {poop}
      </BottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1162E6',
    flex: 1,
    // alignItems: 'center',
  },
});

export default ConfirmSend;
