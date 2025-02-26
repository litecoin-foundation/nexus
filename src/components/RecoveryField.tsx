import React, {createRef, useRef, useEffect, useState, useContext} from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';

import {checkBIP39Word} from '../lib/utils/bip39';
import {checkSeedChecksum} from '../lib/utils/aezeed';

import {ScreenSizeContext} from '../context/screenSize';

interface Props {
  handleLogin: (seed: string[]) => void;
  headerText: string;
  isLitewalletRecovery: boolean;
  handleLWRecovery?: (seed: string[]) => void;
}

const RecoveryField: React.FC<Props> = props => {
  const {handleLogin, headerText, isLitewalletRecovery, handleLWRecovery} =
    props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const n = isLitewalletRecovery
    ? [...Array(12).keys()]
    : [...Array(24).keys()];

  const [phrase, setPhrasePosition] = useState(0);
  const [seed, setSeed] = useState<string[]>([]);
  const phraseRef = useRef(n.map(() => createRef<TextInput>()));
  const listRef = useRef<FlatList>();

  useEffect(() => {
    phraseRef.current[phrase].current!.focus();
  });

  const handleSubmit = async (index: number) => {
    if (checkBIP39Word(seed[index]) === false) {
      await Alert.alert(
        'Invalid Word',
        'This word is not valid - check your spelling and try again.',
        [
          {
            text: 'Try Again',
            onPress: undefined,
            style: undefined,
          },
        ],
        {cancelable: false},
      );
      return;
    }

    if (isLitewalletRecovery && handleLWRecovery !== undefined) {
      if (index === 11) {
        await handleLWRecovery(seed);

        // reset seed list inputs in state and ui
        setSeed([]);
        for (let i = 0; i < 24; i++) {
          phraseRef.current[i].current!.clear();
        }
        return;
      }
    } else {
      if (index === 23) {
        try {
          await checkSeedChecksum(seed);
        } catch (error) {
          await Alert.alert(
            'Incorrect Paper-Key',
            String(error),
            [
              {
                text: 'Try Again',
                onPress: undefined,
                style: 'cancel',
              },
            ],
            {cancelable: false},
          );
          return;
        }
        await handleLogin(seed);

        // reset seed list inputs in state and ui
        setSeed([]);
        for (let i = 0; i < 24; i++) {
          phraseRef.current[i].current!.clear();
        }
        return;
      }
    }

    if (index >= 1) {
      listRef.current!.scrollToIndex({index: index});
    }

    setPhrasePosition(phrase + 1);
  };

  const handleChange = (input: string, index: number) => {
    if (index !== phrase) {
      setPhrasePosition(index);
    }

    const arr = [...seed];
    arr[index] = input;
    setSeed(arr);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'android' ? 'height' : 'padding'}>
      <View style={styles.container}>
        <Text style={styles.headerText}>{headerText}</Text>
        <FlatList
          data={n}
          ref={listRef}
          keyExtractor={item => item.toString()}
          ListFooterComponent={<View style={styles.emptyView} />}
          renderItem={({index}) => (
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
                autoComplete="off"
                clearTextOnFocus
                keyboardAppearance="dark"
                ref={phraseRef.current[index]}
                onSubmitEditing={() => handleSubmit(index)}
                onChangeText={text => handleChange(text, index)}
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

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      paddingTop: screenHeight * 0.055,
      height: '100%',
    },
    headerText: {
      color: 'white',
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '600',
      fontSize: screenHeight * 0.015,
      // screenHeight * 0.0022 is approx font diff offset
      paddingLeft: screenWidth * 0.15 + screenHeight * 0.002,
      paddingBottom: screenHeight * 0.03,
    },
    wordContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      borderTopWidth: 1,
      borderColor: '#E8E8E8',
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
    wordTextInactive: {
      color: '#C5D4E3',
      fontSize: 15,
      fontWeight: '600',
    },
    emptyView: {
      height: 120,
    },
  });

export default RecoveryField;
