import React, {useState, useEffect} from 'react';
import {StyleSheet, Text, View, FlatList} from 'react-native';
import {StackScreenProps} from '@react-navigation/stack';

import Header from '../../components/Header';
import InputField from '../../components/InputField';
import WhiteRectButton from '../../components/Buttons/WhiteRectButton';
import ChannelSearchCell from '../../components/Cells/ChannelSearchCell';
import OpenChannelModal from '../../components/Modals/OpenChannelModal';
import {
  connectToPeer,
  getDescribeGraph,
  searchGraph,
} from '../../reducers/channels';
import {useAppDispatch, useAppSelector} from '../../store/hooks';

type RootStackParamList = {
  OpenChannel: {
    scanData: string | undefined;
  };
  Scan: {
    returnRoute: string;
  };
};

type Props = StackScreenProps<RootStackParamList, 'OpenChannel'>;

const OpenChannel: React.FC<Props> = ({navigation, route}) => {
  const dispatch = useAppDispatch();
  const [search, setPubkey] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);

  const filterByAlias = useAppSelector(state => searchGraph(state));

  useEffect(() => {
    dispatch(getDescribeGraph());
  }, [dispatch]);

  useEffect(() => {
    const handleScanCallback = async (data: string) => {
      // TODO: pubkey validation required
      setPubkey(data);
      await dispatch(connectToPeer(search));
    };

    if (route.params?.scanData) {
      handleScanCallback(route.params?.scanData);
    }
  }, [dispatch, route.params?.scanData, search]);

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
          onChangeText={(input: string) => setPubkey(input)}
          placeholder="pubKey@ip"
        />
      </View>

      <View style={styles.dividerContainer}>
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
                onPress={() => console.log('create channel pressed')}
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
            onPress={() =>
              navigation.navigate('Scan', {returnRoute: 'OpenChannel'})
            }
            title="Scan"
            imageSource={require('../../assets/images/qrcode.png')}
          />
        </View>
      )}

      <OpenChannelModal
        close={() => setIsModalVisible(false)}
        isVisible={isModalVisible}
        handleConfirm={() => handleConfirm()}
        onChange={() => console.log('open channel modal change')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgb(245,249,252)',
    flex: 1,
  },
  inputContainer: {
    paddingLeft: 17,
    paddingRight: 17,
    paddingTop: 10,
  },
  dividerContainer: {
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  divider: {
    height: 1,
    borderTopColor: 'rgba(151,151,151,0.3)',
    borderTopWidth: 1,
    flex: 1,
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

export default OpenChannel;
