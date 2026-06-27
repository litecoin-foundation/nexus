import React, {createRef, useRef, useEffect, useState, useContext} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Keyboard,
  InteractionManager,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import WhiteButton from '../components/Buttons/WhiteButton';
import {
  checkBIP39Word,
  checkLitewalletBIP39Word,
  getBIP39Suggestions,
} from '../utils/bip39/';
import {checkSeedChecksum} from '../utils/aezeed';

import TranslateText from '../components/TranslateText';
import {ScreenSizeContext} from '../context/screenSize';

interface Props {
  handleLogin: (seed: string[]) => void;
  headerText: string;
  isLitewalletRecovery: boolean;
  handleLWRecovery?: (seed: string[]) => void;
  // returns whether the screen is currently focused; used to avoid validating
  // (and alerting) when the user is navigating away from the recovery screen
  isScreenFocused?: () => boolean;
}

const RecoveryField: React.FC<Props> = props => {
  const {
    handleLogin,
    headerText,
    isLitewalletRecovery,
    handleLWRecovery,
    isScreenFocused,
  } = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const insets = useSafeAreaInsets();
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const {t} = useTranslation('onboarding');

  const n = isLitewalletRecovery
    ? [...Array(12).keys()]
    : [...Array(24).keys()];

  const [phrase, setPhrasePosition] = useState(0);
  const [seed, setSeed] = useState<string[]>([]);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const phraseRef = useRef(n.map(() => createRef<TextInput>()));
  const listRef = useRef<FlatList>(null);

  const didInitialFocus = useRef(false);

  useEffect(() => {
    // defer the very first focus until the screen-push animation finishes,
    // otherwise opening the keyboard mid-transition makes it flicker.
    // subsequent focus changes happen with the keyboard already up, so focus
    // immediately to avoid any lag between fields.
    if (!didInitialFocus.current) {
      didInitialFocus.current = true;
      const task = InteractionManager.runAfterInteractions(() => {
        phraseRef.current[phrase]?.current?.focus();
      });
      return () => task.cancel();
    }

    phraseRef.current[phrase]?.current?.focus();
  }, [phrase]);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      e => setKeyboardHeight(e.endCoordinates.height),
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const suggestions = getBIP39Suggestions(
    seed[phrase] ?? '',
    isLitewalletRecovery,
    3,
  );

  const handleSubmit = async (index: number, seedArr: string[] = seed) => {
    const isValidWord = isLitewalletRecovery
      ? checkLitewalletBIP39Word(seedArr[index])
      : checkBIP39Word(seedArr[index]);

    if (!isValidWord) {
      await Alert.alert(
        t('invalid_word'),
        t('invalid_description'),
        [
          {
            text: t('try_again'),
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
        await handleLWRecovery(seedArr);

        // reset seed list inputs in state and ui
        setSeed([]);
        for (let i = 0; i < 12; i++) {
          phraseRef.current[i]?.current?.clear();
        }
        return;
      }
    } else {
      if (index === 23) {
        try {
          await checkSeedChecksum(seedArr);
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
        await handleLogin(seedArr);

        // reset seed list inputs in state and ui
        setSeed([]);
        for (let i = 0; i < 24; i++) {
          phraseRef.current[i]?.current?.clear();
        }
        return;
      }
    }

    if (index >= 1) {
      listRef.current?.scrollToIndex({index: index});
    }

    setPhrasePosition(phrase + 1);
  };

  const handleBlur = (index: number) => {
    // don't validate/alert when leaving the recovery screen
    if (isScreenFocused && !isScreenFocused()) {
      return;
    }

    const word = seed[index];
    if (!word || word.trim() === '') {
      return;
    }

    const isValidWord = isLitewalletRecovery
      ? checkLitewalletBIP39Word(word)
      : checkBIP39Word(word);

    if (!isValidWord) {
      Alert.alert(
        t('invalid_word'),
        t('invalid_description'),
        [
          {
            // force focus back to the invalid word once the alert is dismissed
            text: t('try_again'),
            onPress: () => {
              setPhrasePosition(index);
              phraseRef.current[index]?.current?.focus();
            },
            style: undefined,
          },
        ],
        {cancelable: false},
      );
    }
  };

  const handleChange = (input: string, index: number) => {
    if (index !== phrase) {
      setPhrasePosition(index);
    }

    const arr = [...seed];
    // NOTE: seems like lnd accepts seed without normalization
    // arr[index] = input.normalize('NFD');
    arr[index] = input.trim();
    setSeed(arr);
  };

  const handleSuggestionPress = (word: string) => {
    const index = phrase;
    const arr = [...seed];
    arr[index] = word;
    setSeed(arr);
    // pass the updated array directly since setSeed hasn't flushed yet
    handleSubmit(index, arr);
  };

  const handleContinue = async () => {
    const lastIndex = isLitewalletRecovery ? 11 : 23;

    // Validate all words first
    for (let i = 0; i <= lastIndex; i++) {
      const isValidWord = isLitewalletRecovery
        ? checkLitewalletBIP39Word(seed[i])
        : checkBIP39Word(seed[i]);

      if (!isValidWord) {
        await Alert.alert(
          t('invalid_word'),
          t('invalid_description'),
          [
            {
              text: t('try_again'),
              onPress: undefined,
              style: undefined,
            },
          ],
          {cancelable: false},
        );
        return;
      }
    }

    // Check seed checksum for 24-word seed
    if (!isLitewalletRecovery) {
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
    }

    // Submit the seed
    if (isLitewalletRecovery && handleLWRecovery !== undefined) {
      await handleLWRecovery(seed);
    } else {
      await handleLogin(seed);
    }

    // reset seed list inputs in state and ui
    setSeed([]);
    const resetCount = isLitewalletRecovery ? 12 : 24;
    for (let i = 0; i < resetCount; i++) {
      phraseRef.current[i]?.current?.clear();
    }
  };

  const isAllWordsFilled = () => {
    const requiredLength = isLitewalletRecovery ? 12 : 24;
    if (seed.length < requiredLength) return false;

    for (let i = 0; i < requiredLength; i++) {
      if (!seed[i] || seed[i].trim() === '') {
        return false;
      }
    }
    return true;
  };

  return (
    // NOTE: KeyboardAvoidingView in combination with FlatList behave horribly so it's disabled for now
    <KeyboardAvoidingView
      enabled={false}
      behavior={Platform.OS === 'android' ? 'height' : 'padding'}>
      <View style={styles.container}>
        <TranslateText
          textValue={headerText}
          textStyle={styles.headerText}
          maxSizeInPixels={SCREEN_HEIGHT * 0.017}
        />
        <FlatList
          data={n}
          ref={listRef}
          keyExtractor={item => item.toString()}
          ListFooterComponent={
            <View style={styles.footerContainer}>
              <View style={styles.buttonContainer}>
                <WhiteButton
                  value="Continue"
                  disabled={!isAllWordsFilled()}
                  onPress={handleContinue}
                  small={false}
                  active={true}
                />
              </View>
              <View style={styles.emptyView} />
            </View>
          }
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
                autoCapitalize="none"
                autoComplete="off"
                submitBehavior="submit"
                keyboardAppearance="dark"
                value={seed[index] ?? ''}
                ref={phraseRef.current[index]}
                onSubmitEditing={() => handleSubmit(index)}
                onChangeText={text => handleChange(text, index)}
                onFocus={() => setPhrasePosition(index)}
                onBlur={() => handleBlur(index)}
                style={[
                  styles.wordText,
                  index === phrase ? styles.wordTextActive : null,
                ]}
              />
            </View>
          )}
        />

        {keyboardHeight > 0 && suggestions.length > 0 ? (
          <View
            style={[
              styles.suggestionBar,
              {bottom: keyboardHeight - insets.bottom},
            ]}>
            {suggestions.map(word => (
              <TouchableOpacity
                key={word}
                style={styles.suggestionButton}
                onPress={() => handleSuggestionPress(word)}>
                <Text style={styles.suggestionText} numberOfLines={1}>
                  {word}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
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
      // screenHeight * 0.002 is approx font diff offset
      paddingHorizontal: screenWidth * 0.15 + screenHeight * 0.002,
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
      // NOTE: this gap is used to offset the keyboard, since KeyboardAvoidingView isn't working properly
      height: screenHeight * 0.4,
    },
    footerContainer: {
      width: '100%',
    },
    buttonContainer: {
      paddingHorizontal: 30,
      paddingTop: screenHeight * 0.03,
      paddingBottom: screenHeight * 0.02,
    },
    suggestionBar: {
      position: 'absolute',
      left: 0,
      right: 0,
      flexDirection: 'row',
      gap: 10,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 10,
    },
    suggestionButton: {
      flex: 1,
      maxWidth: '33%',
      height: screenHeight * 0.04,
      backgroundColor: 'white',
      borderRadius: screenHeight * 0.02,
      paddingVertical: 10,
      paddingHorizontal: 5,
      alignItems: 'center',
      justifyContent: 'center',
    },
    suggestionText: {
      color: '#2C72FF',
      fontSize: 16,
      fontWeight: '600',
    },
  });

export default RecoveryField;
