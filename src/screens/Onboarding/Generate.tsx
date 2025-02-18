import React, {useState, useRef, useLayoutEffect, useContext} from 'react';
import {View, Text, StyleSheet, Image, Platform} from 'react-native';
import Carousel, {ICarouselInstance} from 'react-native-reanimated-carousel';
import LinearGradient from 'react-native-linear-gradient';
import {createSelector} from '@reduxjs/toolkit';
import {StackNavigationProp} from '@react-navigation/stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import SeedView from '../../components/SeedView';
import WhiteButton from '../../components/Buttons/WhiteButton';
import Dots from '../../components/Dots';
import HeaderButton from '../../components/Buttons/HeaderButton';
import OnboardingHeader from '../../components/OnboardingHeader';
import TranslateText from '../../components/TranslateText';
import {useAppSelector} from '../../store/hooks';
import chunk from '../../lib/utils/chunk';

import {ScreenSizeContext} from '../../context/screenSize';
import {useTranslation} from 'react-i18next';

type RootStackParamList = {
  Generate: undefined;
  Verify: undefined;
};

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'Generate'>;
}

const Generate: React.FC<Props> = props => {
  const {navigation} = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const {t} = useTranslation('onboarding');

  const carousel = useRef<ICarouselInstance>(null);
  const insets = useSafeAreaInsets();

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
      headerTitle: () => (
        <TranslateText
          textKey="seed_phrase"
          domain="onboarding"
          textStyle={styles.headerTitle}
        />
      ),
    });
  }, [navigation]);

  const list = (
    <Carousel
      loop={false}
      width={SCREEN_WIDTH}
      onSnapToItem={index => setActivePage(index)}
      data={seed}
      ref={carousel}
      mode="parallax"
      modeConfig={{
        parallaxScrollingScale: 1,
        parallaxScrollingOffset: SCREEN_WIDTH * 0.16,
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
    <LinearGradient
      colors={['#1162E6', '#0F55C7']}
      style={[
        styles.header,
        Platform.OS === 'android' ? {paddingTop: insets.top} : null,
      ]}>
      <OnboardingHeader
        description={
          t('seed_phrase_description') + '\n\n' + t('seed_phrase_description_2')
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
          <TranslateText
            textKey="seed_warning"
            domain="onboarding"
            textStyle={styles.warningText}
          />
        </View>

        <WhiteButton
          textKey={activePage === 5 ? 'confirm_written' : 'scroll_right'}
          textDomain="onboarding"
          onPress={() => handlePress()}
          small={false}
          active={true}
        />
      </View>
    </LinearGradient>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flex: 1,
    },
    seedContainer: {
      height: screenHeight * 0.4,
      position: 'absolute',
      bottom: screenHeight * 0.25,
    },
    carouselItem: {
      gap: screenHeight * 0.024,
      paddingLeft: 30,
    },
    bottomContainer: {
      position: 'absolute',
      bottom: 0,
      width: '100%',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 15,
      paddingHorizontal: 30,
      paddingBottom: 50,
    },
    bottomTextContainer: {
      position: 'absolute',
      bottom: screenHeight * 0.18,
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
    },
    warningText: {
      flex: 1,
      color: 'rgba(255, 255, 255, 0.6)',
      fontSize: screenHeight * 0.012,
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: 'bold',
    },
    image: {
      width: screenWidth * 0.08,
      alignSelf: 'center',
      objectFit: 'contain',
      marginRight: screenWidth * 0.04,
    },
    headerTitle: {
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: 'bold',
      color: 'white',
      fontSize: screenHeight * 0.026,
    },
    dotContainer: {
      position: 'absolute',
      bottom: screenHeight * 0.25,
      alignSelf: 'center',
    },
  });

export default Generate;
