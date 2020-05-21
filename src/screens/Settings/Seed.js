import React, {useEffect} from 'react';
import {View, StyleSheet, Text, SafeAreaView} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useDispatch, useSelector} from 'react-redux';

import {updateLastViewSeed} from '../../reducers/settings';
import {formatDate, formatTime} from '../../lib/utils/date';

const Seed = () => {
  const dispatch = useDispatch();
  const seedArray = useSelector((state) => state.onboarding.seed);
  const lastViewSeed = useSelector((state) => state.settings.lastViewSeed);
  const formatedTime =
    lastViewSeed !== null
      ? `${formatDate(lastViewSeed)}, ${formatTime(lastViewSeed)}`
      : 'Never';
  const n = [...Array(12).keys()];

  useEffect(() => {
    dispatch(updateLastViewSeed());
  }, [dispatch]);

  const words = n.map((val, index) => {
    return (
      <View style={styles.wordContainer}>
        <View style={styles.wordSubContainer}>
          <Text style={[styles.indexText, {paddingLeft: 37 / 2}]}>{index}</Text>
          <Text style={styles.word}>{seedArray[index]}</Text>
        </View>
        <View style={styles.wordSubContainer}>
          <Text style={styles.indexText}>{index + 12}</Text>
          <Text style={styles.word}>{seedArray[index + 12]}</Text>
        </View>
      </View>
    );
  });

  return (
    <LinearGradient colors={['#FF415E', '#FF9052']} style={styles.container}>
      <SafeAreaView />
      <View style={styles.textContainer}>
        <Text style={styles.descriptionText}>
          Last time accessed: {formatedTime}
        </Text>
      </View>
      {words}
      <SafeAreaView />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
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
    color: 'white',
    fontSize: 15,
    letterSpacing: -0.24,
    textAlign: 'center',
  },
});

Seed.navigationOptions = () => {
  return {
    headerTitle: 'View Paper Key',
    headerTitleStyle: {
      fontWeight: 'bold',
      color: 'white',
    },
    headerTransparent: true,
    headerBackTitleVisible: false,
    headerTintColor: 'white',
  };
};

export default Seed;
