import React, {createRef, useRef, useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  StyleSheet,
} from 'react-native';

import {checkBIP39Word} from '../lib/utils/bip39';

const RecoveryField = (props) => {
  const n = [...Array(24).keys()];
  const [phrase, setPhrasePosition] = useState(0);
  const phraseRef = useRef(n.map(() => createRef()));
  const listRef = useRef(null);
  const [seed, setSeed] = useState([]);
  const {handleLogin, headerText} = props;

  useEffect(() => {
    phraseRef.current[phrase].current.focus();
  });

  const handleSubmit = async (index) => {
    if (checkBIP39Word(seed[index]) === false) {
      alert('invalid word');
      return;
    }

    if (index === 23) {
      console.log(seed);
      await handleLogin(seed.toString());

      // reset seed list inputs in state and ui
      setSeed([]);
      for (let i = 0; i < 24; i++) {
        phraseRef.current[i].current.clear();
      }
      return;
    }

    if (index >= 1) {
      listRef.current.scrollToIndex({index: index});
    }

    setPhrasePosition(phrase + 1);
  };

  const handleChange = (input, index) => {
    if (index !== phrase) {
      setPhrasePosition(index);
    }

    const arr = [...seed];
    arr[index] = input;
    setSeed(arr);
  };

  return (
    <KeyboardAvoidingView behavior="padding">
      <View style={styles.container}>
        <Text style={styles.headerText}>{headerText}</Text>
        <FlatList
          data={n}
          ref={listRef}
          keyExtractor={(item) => item}
          ListFooterComponent={<View style={styles.emptyView} />}
          renderItem={({item, index}) => (
            <View
              style={[
                styles.wordContainer,
                index === phrase ? styles.wordContainerActive : null,
              ]}>
              <View style={styles.wordNumberContainer}>
                <Text style={styles.wordNumber}>{index + 1}</Text>
              </View>

              <TextInput
                autoCorrect={false}
                blurOnSubmit={false}
                autoCapitalize="none"
                clearTextOnFocus
                keyboardAppearance="dark"
                ref={phraseRef.current[index]}
                onSubmitEditing={() => handleSubmit(index)}
                onChangeText={(text) => handleChange(text, index)}
                onFocus={() => setPhrasePosition(index)}
                style={[
                  styles.wordText,
                  index === phrase ? styles.wordTextActive : null,
                ]}
              />
            </View>
          )}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 50,
    height: '100%',
  },
  headerText: {
    color: 'white',
    fontSize: 15,
    textAlign: 'center',
    paddingBottom: 25,
  },
  wordContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#979797',
    height: 44,
    color: 'transparent',
  },
  wordContainerActive: {
    height: 66,
    backgroundColor: 'white',
    borderTopWidth: 0,
  },
  wordNumberContainer: {
    width: 44,
    alignItems: 'center',
  },
  wordNumber: {
    color: '#7C96AE',
    fontSize: 12,
    fontWeight: '600',
  },
  wordText: {
    flex: 1,
    height: '100%',
    color: '#C5D4E3',
    fontSize: 15,
    fontWeight: '600',
  },
  wordTextActive: {
    color: '#2C72FF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  emptyView: {
    height: 120,
  },
});

export default RecoveryField;
