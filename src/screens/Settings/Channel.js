import React, {useEffect} from 'react';
import {View, Text, FlatList, StyleSheet, Dimensions} from 'react-native';
import {useSelector, useDispatch} from 'react-redux';

import ChannelCell from '../../components/Cells/ChannelCell';
import WhiteButton from '../../components/Buttons/WhiteButton';
import {
  listChannels,
  listPeers,
  listPendingChannels,
} from '../../reducers/channels';
import Header from '../../components/Header';

const {width} = Dimensions.get('window');

const Channel = () => {
  const dispatch = useDispatch();
  const {channels} = useSelector((state) => state.channels);

  useEffect(() => {
    dispatch(listChannels());
    dispatch(listPeers());
    dispatch(listPendingChannels());
  }, [dispatch]);

  const list = (
    <FlatList
      pagingEnabled
      horizontal
      decelerationRate={0}
      snapToInterval={width - 40}
      snapToAlignment="center"
      showsHorizontalScrollIndicator={false}
      contentInset={{
        top: 0,
        left: 20,
        bottom: 0,
        right: 20,
      }}
      data={channels}
      renderItem={({item}) => <ChannelCell item={item} />}
      keyExtractor={(item) => item.remotePubkey}
    />
  );

  return (
    <View style={styles.container}>
      <Header />
      {!channels || channels.length === 0 ? (
        <Text>No channels here.</Text>
      ) : (
        list
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FCFEFF',
    flex: 1,
  },
  headerContainer: {
    height: 120,
  },
  headerRight: {
    paddingRight: 18,
  },
});

Channel.navigationOptions = ({navigation}) => {
  return {
    headerTitle: 'Channels',
    headerRight: () => (
      <View style={styles.headerRight}>
        <WhiteButton
          value="Open"
          small={true}
          onPress={() => navigation.navigate('OpenChannel')}
          active={true}
        />
      </View>
    ),
  };
};

export default Channel;
