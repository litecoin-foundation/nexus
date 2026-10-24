import React, {useState, useRef, useContext} from 'react';
import {View, Text, StyleSheet, Image} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {createSelector} from '@reduxjs/toolkit';
import {StackNavigationProp} from '@react-navigation/stack';
import {useTranslation} from 'react-i18next';

import SeedView from '../../components/SeedView';
import WhiteButtonV2 from '../../components/ButtonsV2/WhiteButtonV2';
import {useFixedBottomStyle} from '../../components/ButtonsV2/fixedBottomStyle';
import Dots from '../../components/Dots';
import OnboardingHeader from '../../components/OnboardingHeader';
import ScreenHeader, {
  useScreenHeaderArrival,
  useScreenHeaderLayout,
} from '../../components/ScreenHeader';
import TranslateText from '../../components/TranslateText';
import CustomCarousel, {
  CustomCarouselRef,
} from '../../components/CustomCarousel';
import {useAppSelector} from '../../store/hooks';
import chunk from '../../utils/chunk';

import {ScreenSizeContext} from '../../context/screenSize';

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
  const {rects, paddingHorizontal} = useScreenHeaderLayout();
  const headerFadeStyle = useScreenHeaderArrival();
  const fixedBottomStyle = useFixedBottomStyle();

  const {t} = useTranslation('onboarding');

  const carousel = useRef<CustomCarouselRef>(null);

  const seedSelector = createSelector(
    state => state.onboarding.generatedSeed,
    seedArray => chunk(seedArray, 4),
  );
  const seed = useAppSelector(state => seedSelector(state));
  const [activePage, setActivePage] = useState(0);

  const list = (
    <CustomCarousel
      width={SCREEN_WIDTH}
      height={SCREEN_HEIGHT * 0.4}
      onSnapToItem={index => setActivePage(index)}
      data={seed}
      ref={carousel}
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
    if (activePage === seed.length - 1) {
      navigation.navigate('Verify');
      return;
    }

    carousel.current?.next();
  };

  return (
    <LinearGradient colors={['#1162E6', '#0F55C7']} style={styles.gradient}>
      <OnboardingHeader
        description={
          t('seed_phrase_description') + '\n\n' + t('seed_phrase_description_2')
        }
        thin
      />

      <View style={styles.seedContainer}>
        {!seed ? <Text>Loading...</Text> : list}
      </View>

      <View style={styles.dotContainer}>
        <Dots dotsLength={seed.length} activeDotIndex={activePage} />
      </View>

      <View style={[fixedBottomStyle, styles.bottomContainer]}>
        <View style={styles.bottomTextContainer}>
          <View style={styles.imageContainer}>
            <Image
              style={styles.image}
              source={require('../../assets/images/attention.png')}
            />
          </View>

          <TranslateText
            textKey="seed_warning"
            domain="onboarding"
            textStyle={styles.warningText}
            maxSizeInPixels={SCREEN_HEIGHT * 0.013}
            numberOfLines={2}
          />
        </View>

        <WhiteButtonV2
          textKey={
            activePage === seed.length - 1 ? 'confirm_written' : 'scroll_right'
          }
          textDomain="onboarding"
          onPress={() => handlePress()}
        />
      </View>

      <ScreenHeader
        rects={rects}
        paddingHorizontal={paddingHorizontal}
        titleKey="seed_phrase"
        titleDomain="onboarding"
        fadeStyle={headerFadeStyle}
      />
    </LinearGradient>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    gradient: {
      flex: 1,
    },
    seedContainer: {
      height: screenHeight * 0.4,
      position: 'absolute',
      bottom: screenHeight * 0.25,
      width: screenWidth,
    },
    carouselItem: {
      gap: screenHeight * 0.024,
      width: screenWidth,
      height: screenHeight * 0.4,
      justifyContent: 'center',
      alignItems: 'center',
    },
    bottomContainer: {
      zIndex: 10,
    },
    bottomTextContainer: {
      width: '100%',
      height: screenHeight * 0.04,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: screenHeight * 0.02,
    },
    warningText: {
      flexBasis: '85%',
      color: 'rgba(255, 255, 255, 0.6)',
      fontSize: screenHeight * 0.012,
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: 'bold',
    },
    imageContainer: {
      flexBasis: '15%',
      marginTop: 3,
    },
    image: {
      width: screenWidth * 0.08,
      objectFit: 'contain',
    },
    dotContainer: {
      position: 'absolute',
      bottom: screenHeight * 0.22,
      alignSelf: 'center',
      zIndex: 10,
      left: 0,
      right: 0,
      alignItems: 'center',
    },
  });

export default Generate;
