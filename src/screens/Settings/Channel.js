import React, {useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import {useSelector, useDispatch} from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';

import ChannelCell from '../../components/Cells/ChannelCell';
import WhiteButton from '../../components/Buttons/WhiteButton';
import {
  listChannels,
  listPeers,
  listPendingChannels,
} from '../../reducers/channels';

const {width} = Dimensions.get('window');

const Channel = () => {
  const dispatch = useDispatch();
  const channels = useSelector(state => state.channels.channels);

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
      keyExtractor={item => item.remotePubkey}
    />
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#5A4FE7', '#2C44C8']}
        style={styles.headerContainer}>
        <SafeAreaView />
      </LinearGradient>
      {!channels ? <Text>No channels here.</Text> : list}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FCFEFF',
  },
  headerContainer: {
    height: 120,
  },
});

Channel.navigationOptions = ({navigation}) => {
  return {
    headerTitle: 'Channels',
    headerRight: (
      <WhiteButton
        value="Open"
        small={true}
        onPress={() => navigation.navigate('OpenChannel')}
        active={true}
      />
    ),
    headerTitleStyle: {
      fontWeight: 'bold',
      color: 'white',
    },
    headerTransparent: true,
    headerBackTitle: null,
  };
};

export default Channel;
