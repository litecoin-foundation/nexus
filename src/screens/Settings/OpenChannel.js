import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, FlatList} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';

import Header from '../../components/Header';
import InputField from '../../components/InputField';
import BlueButton from '../../components/Buttons/BlueButton';
import WhiteRectButton from '../../components/Buttons/WhiteRectButton';
import ChannelSearchCell from '../../components/Cells/ChannelSearchCell';
import OpenChannelModal from '../../components/Modals/OpenChannelModal';
import {
  connectToPeer,
  getDescribeGraph,
  searchGraph,
} from '../../reducers/channels';

const OpenChannel = () => {
  const dispatch = useDispatch();
  const [search, setPubkey] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);

  const filterByAlias = useSelector((state) => searchGraph(state));

  useEffect(() => {
    dispatch(getDescribeGraph());
  }, [dispatch]);

  const handleConfirm = async () => {
    await dispatch(connectToPeer(search));
  };

  return (
    <View style={styles.container}>
      <Header />
      <View style={styles.titleTextContainer}>
        <Text style={styles.text}>SEARCH FOR NODE</Text>
      </View>

      <View style={styles.inputContainer}>
        <InputField
          value={search}
          onChangeText={(input) => setPubkey(input)}
          placeholder="pubKey@ip"
        />
      </View>

      <View style={styles.dividerContainer}>
        <View style={styles.divider} />
        <View style={styles.orText}>
          <Text style={styles.text}>OR</Text>
        </View>
        <View style={styles.divider} />
      </View>

      {search !== '' ? (
        <View style={styles.channelSearchContainer}>
          <FlatList
            data={filterByAlias(search)}
            extraData={filterByAlias(search)}
            renderItem={({item}) => (
              <ChannelSearchCell
                data={item}
                keyExtractor={(item) => item.pubKey}
              />
            )}
          />
        </View>
      ) : (
        <View style={styles.buttonContainer}>
          <WhiteRectButton
            onPress={() => console.log('')}
            title="Paste"
            imageSource={require('../../assets/images/paste.png')}
          />

          <WhiteRectButton
            onPress={() => console.log('')}
            title="Scan"
            imageSource={require('../../assets/images/qrcode.png')}
          />
        </View>
      )}

      <View style={styles.bottomButtomContainer}>
        <BlueButton
          value="Open Channel"
          onPress={() => setIsModalVisible(true)}
        />
      </View>

      <OpenChannelModal
        close={() => setIsModalVisible(false)}
        isVisible={isModalVisible}
        handleConfirm={() => handleConfirm()}
        onChange={(input) => console.log(input)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgb(245,249,252)',
    flex: 1,
  },
  bottomButtomContainer: {
    height: 100,
    width: '100%',
    bottom: 0,
    position: 'absolute',
    alignItems: 'center',
  },
  inputContainer: {
    paddingLeft: 17,
    paddingRight: 17,
    paddingTop: 10,
  },
  dividerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'baseline',
    paddingHorizontal: 20,
  },
  titleTextContainer: {
    paddingLeft: 15,
    paddingBottom: 5,
    paddingTop: 30,
  },
  buttonContainer: {
    flex: 1,
    paddingTop: 15,
  },
  channelSearchContainer: {
    paddingTop: 15,
  },
  footerComponent: {
    marginBottom: 100,
  },
  divider: {
    height: 1,
    borderTopColor: 'rgb(217,218,220)',
    borderTopWidth: 1,
    flex: 2,
    paddingBottom: 3,
  },
  orText: {
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingTop: 20,
  },
  text: {
    color: '#7C96AE',
    opacity: 0.9,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.28,
  },
});

OpenChannel.navigationOptions = () => {
  return {
    headerTitle: 'Open Channel',
  };
};

export default OpenChannel;
