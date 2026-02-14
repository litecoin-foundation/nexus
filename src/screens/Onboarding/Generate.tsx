import React, {
  useState,
  useRef,
  useLayoutEffect,
  useContext,
  useMemo,
} from 'react';
import {View, Text, StyleSheet, Image, Platform} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {createSelector} from '@reduxjs/toolkit';
import {StackNavigationProp} from '@react-navigation/stack';
import {useTranslation} from 'react-i18next';

import SeedView from '../../components/SeedView';
import WhiteButton from '../../components/Buttons/WhiteButton';
import Dots from '../../components/Dots';
import HeaderButton from '../../components/Buttons/HeaderButton';
import OnboardingHeader from '../../components/OnboardingHeader';
import TranslateText from '../../components/TranslateText';
import CustomCarousel, {
  CustomCarouselRef,
} from '../../components/CustomCarousel';
import {useAppSelector} from '../../store/hooks';
import chunk from '../../utils/chunk';

import CustomSafeAreaView from '../../components/CustomSafeAreaView';
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

  const {t} = useTranslation('onboarding');

  const carousel = useRef<CustomCarouselRef>(null);

  const seedSelector = createSelector(
    state => state.onboarding.generatedSeed,
    seedArray => chunk(seedArray, 4),
  );
  const seed = useAppSelector(state => seedSelector(state));
  const [activePage, setActivePage] = useState(0);

  const headerLeftButton = useMemo(
    () => (
      <HeaderButton
        onPress={() => navigation.goBack()}
        imageSource={require('../../assets/images/back-icon.png')}
        leftPadding
      />
    ),
    [navigation],
  );

  const headerTitle = useMemo(
    () => (
      <TranslateText
        textKey="seed_phrase"
        domain="onboarding"
        textStyle={styles.headerTitle}
        maxSizeInPixels={SCREEN_HEIGHT * 0.022}
      />
    ),
    [styles, SCREEN_HEIGHT],
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTransparent: true,
      headerTitleAlign: 'left',
      headerTitleContainerStyle: {
        left: 7,
      },
      headerTintColor: 'white',
      headerLeft: () => headerLeftButton,
      headerTitle: () => headerTitle,
      headerLeftContainerStyle:
        Platform.OS === 'ios' && SCREEN_WIDTH >= 414 ? {marginStart: -5} : null,
      headerRightContainerStyle:
        Platform.OS === 'ios' && SCREEN_WIDTH >= 414 ? {marginEnd: -5} : null,
    });
  }, [navigation, headerLeftButton, headerTitle, SCREEN_WIDTH]);

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

      <View style={styles.bottomContainer}>
        <CustomSafeAreaView styles={styles.safeArea} edges={['bottom']}>
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

          <WhiteButton
            textKey={
              activePage === seed.length - 1
                ? 'confirm_written'
                : 'scroll_right'
            }
            textDomain="onboarding"
            onPress={() => handlePress()}
            small={false}
            active={true}
          />
        </CustomSafeAreaView>
      </View>
    </LinearGradient>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    gradient: {
      flex: 1,
    },
    safeArea: {
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
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: 30,
      paddingBottom: screenHeight * 0.02,
      zIndex: 10,
      backgroundColor: 'transparent',
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
    headerTitle: {
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: 'bold',
      color: 'white',
      fontSize: screenHeight * 0.026,
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
