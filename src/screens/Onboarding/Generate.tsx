import React, {useState, useRef} from 'react';
import {View, Text, Dimensions, StyleSheet, Image} from 'react-native';
import Carousel, {ICarouselInstance} from 'react-native-reanimated-carousel';
import LinearGradient from 'react-native-linear-gradient';
import {createSelector} from '@reduxjs/toolkit';
import {HeaderBackButton} from '@react-navigation/elements';
import {StackNavigationProp} from '@react-navigation/stack';

import {useAppSelector} from '../../store/hooks';
import SeedView from '../../components/SeedView';
import OnboardingHeader from '../../components/OnboardingHeader';
import WhiteButton from '../../components/Buttons/WhiteButton';
import chunk from '../../lib/utils/chunk';
import Dots from '../../components/Dots';

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
      <OnboardingHeader description="Please write down your paper-key and place it somewhere secure. " />
      <LinearGradient colors={['#544FE6', '#003DB3']} style={styles.header}>
        <View style={styles.seedContainer}>
          {!seed ? <Text>Loading...</Text> : list}
        </View>

        <View
          style={{
            alignSelf: 'center',
            position: 'absolute',
            bottom: 0,
            paddingBottom: 180,
          }}>
          <Dots
            dotsLength={seed.length}
            activeDotIndex={activePage}
            dashLineEnabled={false}
          />
        </View>

        <View style={styles.bottomContainer}>
          <View style={styles.bottomTextContainer}>
            <Image
              style={styles.image}
              source={require('../../assets/images/attention.png')}
            />
            <Text style={styles.warningText}>
              Without these words you won't be able to access your wallet!
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
    paddingTop: 60,
  },
  carouselItem: {
    alignItems: 'center',
  },
  warningText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 15,
  },
  bottomContainer: {
    alignSelf: 'center',
    position: 'absolute',
    bottom: 0,
    paddingBottom: 40,
  },
  bottomTextContainer: {
    flexDirection: 'row',
    width: 335,
    paddingBottom: 19,
    alignItems: 'baseline',
  },
  image: {
    marginRight: 18,
  },
});

Generate.navigationOptions = ({navigation}) => {
  return {
    headerTitle: 'Paper Key',
    headerLeft: () => (
      <HeaderBackButton
        tintColor="white"
        labelVisible={false}
        onPress={() => navigation.goBack()}
      />
    ),
  };
};

export default Generate;
