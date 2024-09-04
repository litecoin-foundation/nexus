import React, {useState, useRef, useLayoutEffect} from 'react';
import {
  View,
  Text,
  Dimensions,
  StyleSheet,
  Image,
  Platform,
} from 'react-native';
import Carousel, {ICarouselInstance} from 'react-native-reanimated-carousel';
import LinearGradient from 'react-native-linear-gradient';
import {createSelector} from '@reduxjs/toolkit';
import {StackNavigationProp} from '@react-navigation/stack';

import {useAppSelector} from '../../store/hooks';
import SeedView from '../../components/SeedView';
import WhiteButton from '../../components/Buttons/WhiteButton';
import chunk from '../../lib/utils/chunk';
import Dots from '../../components/Dots';
import HeaderButton from '../../components/Buttons/HeaderButton';
import OnboardingHeader from '../../components/OnboardingHeader';

const {width} = Dimensions.get('window');

type RootStackParamList = {
  Generate: undefined;
  Verify: undefined;
};

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'Generate'>;
}

const Generate: React.FC<Props> = props => {
  const carousel = useRef<ICarouselInstance>(null);
  const {navigation} = props;

  const seedSelector = createSelector(
    state => state.onboarding.generatedSeed,
    seedArray => chunk(seedArray, 4),
  );
  const seed = useAppSelector(state => seedSelector(state));

  const [activePage, setActivePage] = useState(0);

  useLayoutEffect(() => {
    const handleBackNavigation = () => {
      navigation.goBack();
    };

    navigation.setOptions({
      headerTransparent: true,
      headerTitleAlign: 'left',
      headerTintColor: 'white',
      headerLeft: () => (
        <HeaderButton
          onPress={() => handleBackNavigation()}
          imageSource={require('../../assets/images/back-icon.png')}
        />
      ),
      headerTitle: () => <Text style={styles.headerTitle}>Seed Phrase</Text>,
    });
  }, [navigation]);

  const list = (
    <Carousel
      loop={false}
      width={width}
      onSnapToItem={index => setActivePage(index)}
      data={seed}
      ref={carousel}
      mode="parallax"
      modeConfig={{
        parallaxScrollingScale: 1,
        parallaxScrollingOffset: 70,
      }}
      renderItem={({item, index}) => (
        <View style={styles.carouselItem}>
          <SeedView index={4 * (index + 1) - 3} value={item[0]} />
          <SeedView index={4 * (index + 1) - 2} value={item[1]} />
          <SeedView index={4 * (index + 1) - 1} value={item[2]} />
          <SeedView index={4 * (index + 1)} value={item[3]} />
        </View>
      )}
    />
  );

  const handlePress = () => {
    if (activePage === 5) {
      navigation.navigate('Verify');
      return;
    }

    carousel.current?.next();
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1162E6', '#0F55C7']} style={styles.header}>
        <OnboardingHeader
          description={
            'The 24 words below is your seed phrase. \n\nYour seed phrase is your password to your Litecoin & Wallet. Write it down and place it somewhere secure!'
          }
        />
        <View style={styles.seedContainer}>
          {!seed ? <Text>Loading...</Text> : list}
        </View>

        <View style={styles.dotContainer}>
          <Dots dotsLength={seed.length} activeDotIndex={activePage} />
        </View>

        <View style={styles.bottomContainer}>
          <View style={styles.bottomTextContainer}>
            <Image
              style={styles.image}
              source={require('../../assets/images/attention.png')}
            />
            <Text style={styles.warningText}>
              WITHOUT THESE WORDS YOU WILL NOT BE ABLE TO ACCESS YOUR WALLET!
            </Text>
          </View>

          <WhiteButton
            value={activePage === 5 ? 'I have written it down' : 'Scroll Right'}
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
  header: {
    flex: 1,
  },
  seedContainer: {
    paddingTop: 24,
    height: 400,
    position: 'absolute',
    bottom: 250,
  },
  carouselItem: {
    alignItems: 'center',
    gap: 24,
  },
  warningText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    fontFamily:
      Platform.OS === 'ios'
        ? 'Satoshi Variable'
        : 'SatoshiVariable-Regular.ttf',
    fontStyle: 'normal',
    fontWeight: 'bold',
    paddingRight: 38,
  },
  bottomContainer: {
    alignSelf: 'center',
    position: 'absolute',
    bottom: 0,
    paddingBottom: 40,
  },
  bottomTextContainer: {
    flexDirection: 'row',
    width: 300,
    paddingBottom: 38,
    alignSelf: 'center',
  },
  image: {
    marginRight: 17,
    alignSelf: 'center',
  },
  headerTitle: {
    fontFamily:
      Platform.OS === 'ios'
        ? 'Satoshi Variable'
        : 'SatoshiVariable-Regular.ttf',
    fontStyle: 'normal',
    fontWeight: 'bold',
    color: 'white',
    fontSize: 26,
  },
  dotContainer: {
    alignSelf: 'center',
    position: 'absolute',
    bottom: 220,
  },
});

export default Generate;
