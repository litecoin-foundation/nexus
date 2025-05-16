import React, {useEffect, useContext} from 'react';
import {View, StyleSheet, Text} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {v4 as uuidv4} from 'uuid';
import {SafeAreaView} from 'react-native-safe-area-context';
import {StackNavigationOptions} from '@react-navigation/stack';

import HeaderButton from '../../components/Buttons/HeaderButton';
import {updateLastViewSeed} from '../../reducers/settings';
import {formatDate, formatTime} from '../../lib/utils/date';
import {useAppDispatch, useAppSelector} from '../../store/hooks';

import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

interface Props {}

const Seed: React.FC<Props> = () => {
  const dispatch = useAppDispatch();

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const seedArray = useAppSelector(state => state.onboarding.seed);
  const lastViewSeed = useAppSelector(state => state.settings.lastViewSeed);
  const timestamp = lastViewSeed ? new Date(lastViewSeed).getTime() : 0;
  const formatedTime = timestamp
    ? `${formatDate(timestamp)}, ${formatTime(timestamp)}`
    : 'Never';
  const n = [...Array(12).keys()];

  useEffect(() => {
    return function cleanup() {
      dispatch(updateLastViewSeed());
    };
  }, [dispatch]);

  const words = n.map((val, index) => {
    return (
      <View style={styles.wordContainer} key={uuidv4()}>
        <View style={styles.wordSubContainer}>
          <Text style={[styles.indexText, {paddingLeft: 37 / 2}]}>
            {index + 1}
          </Text>
          <Text style={styles.word}>{seedArray[index]}</Text>
        </View>
        <View style={styles.wordSubContainer}>
          <Text style={styles.indexText}>{index + 13}</Text>
          <Text style={styles.word}>{seedArray[index + 12]}</Text>
        </View>
      </View>
    );
  });

  return (
    <LinearGradient colors={['#FF415E', '#FF9052']} style={styles.container}>
      <SafeAreaView />
      <View style={styles.textContainer}>
        <TranslateText
          textKey="last_time_accessed"
          domain="settingsTab"
          textStyle={styles.descriptionText}
          interpolationObj={{time: formatedTime}}
        />
      </View>
      {words}
      <SafeAreaView />
    </LinearGradient>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    word: {
      color: 'white',
      fontSize: 15,
      fontWeight: '600',
      letterSpacing: -0.35,
      lineHeight: 22,
    },
    textContainer: {
      marginTop: 50,
      paddingBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: '#ffffff30',
    },
    wordContainer: {
      flex: 1,
      borderBottomWidth: 1,
      borderBottomColor: '#ffffff30',
      justifyContent: 'space-between',
      flexDirection: 'row',
      alignItems: 'center',
    },
    wordSubContainer: {
      flex: 1,
      flexDirection: 'row',
    },
    indexText: {
      color: 'white',
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: -0.28,
      lineHeight: 22,
      textAlign: 'center',
      paddingRight: 37 / 2,
    },
    descriptionText: {
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      color: 'white',
      fontSize: 15,
      paddingLeft: 18,
      textAlign: 'left',
    },
    headerTitle: {
      color: '#fff',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.026,
      fontStyle: 'normal',
      fontWeight: '700',
    },
  });

export const SeedNavigationOptions = (
  navigation: any,
): StackNavigationOptions => {
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  return {
    headerTitle: () => (
      <TranslateText
        textKey="view_seed"
        domain="settingsTab"
        maxSizeInPixels={SCREEN_HEIGHT * 0.022}
        textStyle={styles.headerTitle}
        numberOfLines={1}
      />
    ),
    headerTitleAlign: 'left',
    headerTransparent: true,
    headerTintColor: 'white',
    headerLeft: () => (
      <HeaderButton
        onPress={() => navigation.goBack()}
        imageSource={require('../../assets/images/back-icon.png')}
      />
    ),
  };
};

export default Seed;
