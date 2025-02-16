import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import TranslateText from '../TranslateText';

interface Props {
  onPress: () => void;
}

const SupportCell: React.FC<Props> = props => {
  const {onPress} = props;
  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress()}>
      <View style={styles.questionBox}>
        <Text style={styles.questionText}>?</Text>
      </View>
      <TranslateText
        textKey="need_support"
        domain="settingsTab"
        textStyle={styles.title}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    gap: 11,
    alignItems: 'center',
    paddingLeft: 25,
    paddingRight: 25,
    height: 66,
    backgroundColor: 'white',
    marginBottom: 27,
  },
  title: {
    fontFamily: 'Satoshi Variable',
    fontStyle: 'normal',
    fontWeight: '700',
    color: '#484859',
    fontSize: 16,
  },
  questionBox: {
    height: 30,
    width: 30,
    borderRadius: 9,
    backgroundColor: '#1162E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionText: {
    fontFamily: 'Satoshi Variable',
    fontStyle: 'normal',
    fontWeight: '700',
    color: 'white',
    fontSize: 15,
  },
});

export default SupportCell;
