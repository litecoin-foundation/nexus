import React, {Component} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import {connect} from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';

import ChannelCell from '../../components/ChannelCell';
import WhiteButton from '../../components/WhiteButton';
import {
  listChannels,
  listPeers,
  listPendingChannels,
} from '../../reducers/channels';

const {width} = Dimensions.get('window');

export class Channel extends Component {
  static navigationOptions = ({navigation}) => {
    return {
      headerTitle: 'Channels',
      headerRight: (
        <WhiteButton
          value="Open"
          onPress={() => navigation.navigate('OpenChannel')}
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

  async componentDidMount() {
    const {listChannels, listPeers, listPendingChannels} = this.props;
    await listChannels();
    await listPeers();
    await listPendingChannels();
  }

  render() {
    const {channels} = this.props;
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
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FCFEFF',
  },
  headerContainer: {
    height: 120,
  },
});

const mapStateToProps = state => ({
  channels: state.channels.channels,
});

const mapDispatchToProps = {
  listChannels,
  listPeers,
  listPendingChannels,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Channel);
