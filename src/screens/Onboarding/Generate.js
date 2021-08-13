import React, {useEffect, Fragment, useState, createRef} from 'react';
import {View, Text, Dimensions, StyleSheet, Image} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import Carousel, {Pagination} from 'react-native-snap-carousel';
import LinearGradient from 'react-native-linear-gradient';
import {createSelector} from 'reselect';
import {HeaderBackButton} from '@react-navigation/elements';

import SeedView from '../../components/SeedView';
import OnboardingHeader from '../../components/OnboardingHeader';
import WhiteButton from '../../components/Buttons/WhiteButton';
import {getSeed} from '../../reducers/onboarding';
import chunk from '../../lib/utils/chunk';

const {width} = Dimensions.get('window');

const Generate = (props) => {
  const carousel = createRef();
  const dispatch = useDispatch();

  const seedSelector = createSelector(
    (state) => state.onboarding.seed,
    (seedArray) => chunk(seedArray, 4),
  );
  const seed = useSelector((state) => seedSelector(state));

  const [activePage, setActivePage] = useState(0);

  useEffect(() => {
    dispatch(getSeed());
  }, [dispatch]);

  const list = (
    <Fragment>
      <Carousel
        inactiveSlideScale={1}
        inactiveSlideOpacity={0.9}
        sliderWidth={width}
        itemWidth={350}
        onSnapToItem={(index) => setActivePage(index)}
        data={seed}
        ref={carousel}
        containerCustomStyle={styles.carousel}
        renderItem={({item, index}) => (
          <View>
            <SeedView index={4 * (index + 1) - 3} value={item[0]} />
            <SeedView index={4 * (index + 1) - 2} value={item[1]} />
            <SeedView index={4 * (index + 1) - 1} value={item[2]} />
            <SeedView index={4 * (index + 1)} value={item[3]} />
          </View>
        )}
      />
      <Pagination
        dotsLength={seed.length}
        dotColor="white"
        inactiveDotColor="white"
        inactiveDotScale={1}
        activeDotIndex={activePage}
      />
    </Fragment>
  );

  const handlePress = () => {
    if (activePage === 5) {
      props.navigation.navigate('Verify');
      return;
    }

    carousel.current.snapToNext();
  };

  return (
    <View style={styles.container}>
      <OnboardingHeader description="Please write down your paper-key and place it somewhere secure. " />
      <LinearGradient colors={['#544FE6', '#003DB3']} style={styles.header}>
        {!seed ? <Text>Loading...</Text> : list}
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
  carousel: {
    flexGrow: 0,
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
