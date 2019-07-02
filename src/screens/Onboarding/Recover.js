import React, { createRef, useRef, useEffect, useState } from 'react';
import { View, Text, TextInput, FlatList, SafeAreaView, KeyboardAvoidingView } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';
import { useDispatch } from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';

import { recoverSeed } from '../../reducers/onboarding';

const Recover = () => {
  const dispatch = useDispatch();
  const { navigate } = useNavigation();
  const n = [...Array(24).keys()];
  const [phrase, setPhrasePosition] = useState(0);
  const phraseRef = useRef(n.map(() => createRef()));
  const [seed, setSeed] = useState([]);

  useEffect(() => {
    phraseRef.current[phrase].current.focus();
  });

  const handleSubmit = async index => {
    if (index === 23) {
      attemptLogin();
      return;
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

  const attemptLogin = () => {
    dispatch(recoverSeed(seed));
    navigate('Pin');
  };

  return (
    <LinearGradient colors={['#7E58FF', '#3649DF', '#003DB3']}>
      <SafeAreaView>
        <KeyboardAvoidingView behavior="height">
          <View style={{ paddingTop: 50, height: '100%' }}>
            <Text style={{ color: 'white', fontSize: 15, textAlign: 'center', paddingBottom: 25 }}>
              Enter your paper-key words below.
            </Text>
            <FlatList
              data={n}
              renderItem={({ item, index }) => (
                <View
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderTopWidth: 1,
                    borderColor: '#979797',
                    height: 44,
                    color: 'transparent'
                  }}
                >
                  <Text style={{ color: '#7C96AE' }}>{index + 1}</Text>
                  <TextInput
                    autoCorrect={false}
                    blurOnSubmit={false}
                    autoCapitalize="none"
                    clearTextOnFocus
                    keyboardAppearance="dark"
                    ref={phraseRef.current[index]}
                    onSubmitEditing={() => handleSubmit(index)}
                    onChangeText={text => handleChange(text, index)}
                    style={{ flex: 1, height: '100%' }}
                  />
                </View>
              )}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

Recover.navigationOptions = {
  headerTitle: 'Login',
  headerTitleStyle: {
    fontWeight: 'bold',
    color: 'white'
  },
  headerTransparent: true,
  headerBackTitle: null
};

export default Recover;
