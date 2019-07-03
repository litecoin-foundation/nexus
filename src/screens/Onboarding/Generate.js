import React, { useEffect, Fragment, useState, createRef } from 'react';
import { View, Text, Button, Dimensions } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from 'react-navigation-hooks';
import Carousel, { Pagination } from 'react-native-snap-carousel';
import LinearGradient from 'react-native-linear-gradient';
import { createSelector } from 'reselect';

import chunk from '../../lib/utils/chunk';
import SeedView from '../../components/SeedView';
import OnboardingHeader from '../../components/OnboardingHeader';
import { getSeed } from '../../reducers/onboarding';

const { width } = Dimensions.get('window');

const Generate = () => {
  const carousel = createRef();
  const dispatch = useDispatch();
  const { navigate } = useNavigation();

  const seedSelector = createSelector(
    state => state.onboarding.seed,
    seedArray => chunk(seedArray, 4)
  );
  const seed = useSelector(state => seedSelector(state));

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
        onSnapToItem={index => setActivePage(index)}
        data={seed}
        ref={carousel}
        containerCustomStyle={{ flexGrow: 0 }}
        renderItem={({ item, index }) => (
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
      navigate('Verify');
      return;
    }

    carousel.current.snapToNext();
  };

  return (
    <View style={{ flex: 1 }}>
      <OnboardingHeader
        title="Paper Key"
        description="Please write down your paper-key and place it somewhere secure. "
      />
      <LinearGradient colors={['#544FE6', '#003DB3']} style={{ height: '100%' }}>
        {!seed ? <Text>Loading...</Text> : list}
        <Button
          title={activePage === 5 ? 'I have written it down' : 'Scroll Right'}
          onPress={() => handlePress()}
        />
      </LinearGradient>
    </View>
  );
};

Generate.navigationOptions = {
  headerTransparent: true,
  headerBackTitle: null
};

export default Generate;
