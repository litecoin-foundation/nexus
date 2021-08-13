import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useSelector} from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';
import {HeaderBackButton} from '@react-navigation/elements';

import OnboardingHeader from '../../components/OnboardingHeader';
import WhiteButton from '../../components/Buttons/WhiteButton';
import WhiteClearButton from '../../components/Buttons/WhiteClearButton';
import {randomShuffle} from '../../lib/utils';
import {getBIP39Word} from '../../lib/utils/bip39';

const Verify = (props) => {
  const seed = useSelector((state) => state.onboarding.seed);
  const [multiplier, setMultiplier] = useState(1);
  const [selected, setSelectedIndex] = useState(null);

  const [scrambled, setScrambledArray] = useState([]);

  const handlePress = async () => {
    if (multiplier === 8) {
      props.navigation.navigate('ChannelBackup');
      return;
    }
    setMultiplier(multiplier + 1);
    setSelectedIndex(null);
  };

  const handleSelection = async (word, index) => {
    if (word === seed[3 * multiplier - 2]) {
      setSelectedIndex(index);
    } else {
      setSelectedIndex(null);
      alert('incorrect');
    }
  };

  useEffect(() => {
    for (let i = 1; i < 9; i++) {
      const challengeArray = randomShuffle([
        seed[3 * i - 2],
        getBIP39Word(),
        getBIP39Word(),
        getBIP39Word(),
      ]);

      setScrambledArray((arrayItems) => [...arrayItems, ...challengeArray]);
    }
  }, [seed]);

  return (
    <View style={styles.container}>
      <OnboardingHeader
        description={`Select word #${
          3 * multiplier - 1
        } to verify your paper-key`}>
        <View style={styles.optionsContainer}>
          <View style={styles.optionSubContainer}>
            <Text style={styles.optionText}>{seed[3 * multiplier - 3]}</Text>
            <Text style={styles.optionValueText}>#{3 * multiplier - 2}</Text>
          </View>
          <View style={styles.optionSubContainer}>
            <View style={styles.optionBox} />
            <Text style={styles.optionValueTextActual}>
              #{3 * multiplier - 1}
            </Text>
          </View>
          <View style={styles.optionSubContainer}>
            <Text style={styles.optionText}>{seed[3 * multiplier - 1]}</Text>
            <Text style={styles.optionValueText}>#{3 * multiplier}</Text>
          </View>
        </View>
      </OnboardingHeader>

      <LinearGradient
        colors={['#544FE6', '#003DB3']}
        style={styles.gradientContainer}>
        <View style={styles.buttonContainer}>
          <WhiteClearButton
            value={scrambled[4 * multiplier - 4]}
            onPress={() => handleSelection(scrambled[4 * multiplier - 4], 0)}
            selected={selected === 0 ? true : false}
          />
          <WhiteClearButton
            value={scrambled[4 * multiplier - 3]}
            onPress={() => handleSelection(scrambled[4 * multiplier - 3], 1)}
            selected={selected === 1 ? true : false}
          />
          <WhiteClearButton
            value={scrambled[4 * multiplier - 2]}
            onPress={() => handleSelection(scrambled[4 * multiplier - 2], 2)}
            selected={selected === 2 ? true : false}
          />
          <WhiteClearButton
            value={scrambled[4 * multiplier - 1]}
            onPress={() => handleSelection(scrambled[4 * multiplier - 1], 3)}
            selected={selected === 3 ? true : false}
          />
        </View>

        <View style={styles.bottomContainer}>
          <WhiteButton
            disabled={selected === null ? true : false}
            value="Continue"
            onPress={() => handlePress()}
            small={false}
            active={true}
          />
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientContainer: {
    flex: 1,
  },
  optionsContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  optionBox: {
    height: 30,
    width: 80,
    backgroundColor: 'white',
    borderRadius: 9,
    shadowColor: 'black',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    shadowOffset: {
      height: 0,
      width: 0,
    },
    marginBottom: 5,
  },
  optionSubContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingLeft: 4,
    paddingRight: 4,
  },
  bottomContainer: {
    alignSelf: 'center',
    position: 'absolute',
    bottom: 0,
    paddingBottom: 40,
  },
  optionText: {
    fontSize: 18,
    color: 'white',
    height: 40,
    paddingTop: 10,
  },
  buttonContainer: {
    alignItems: 'center',
  },
  optionValueText: {
    color: 'white',
    opacity: 0.2,
    fontSize: 15,
  },
  optionValueTextActual: {
    color: 'white',
    opacity: 0.5,
    fontSize: 15,
  },
});

Verify.navigationOptions = ({navigation}) => {
  return {
    headerTitle: 'Verify Paper Key',
    headerLeft: () => (
      <HeaderBackButton
        tintColor="white"
        labelVisible={false}
        onPress={() => navigation.goBack()}
      />
    ),
  };
};

export default Verify;
