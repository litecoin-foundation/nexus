import React, {useEffect} from 'react';
import {StyleSheet, View, SafeAreaView} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import Card from '../../components/Card';
import WhiteButton from '../../components/Buttons/WhiteButton';
import {StackNavigationProp} from '@react-navigation/stack';
import {RouteProp} from '@react-navigation/native';
import {sweepWIF} from '../../lib/utils/sweep';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {getAddress} from '../../reducers/address';

type RootStackParamList = {
  Import: {
    scanData?: string;
  };
  Scan: {returnRoute: string};
};

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'Import'>;
  route: RouteProp<RootStackParamList, 'Import'>;
}

const Import: React.FC<Props> = props => {
  const {navigation, route} = props;
  const dispatch = useAppDispatch();
  const {address} = useAppSelector(state => state.address);

  useEffect(() => {
    dispatch(getAddress());
  }, [dispatch]);

  // handle scanned QR code
  useEffect(() => {
    if (route.params?.scanData) {
      console.warn(route.params?.scanData);
      sweepWIF(route.params.scanData, address);
    }
  }, [address, route.params?.scanData]);

  return (
    <LinearGradient colors={['#544FE6', '#1c44b4']} style={styles.container}>
      <SafeAreaView />

      <Card
        titleText="Import Private Key"
        descriptionText={
          'Importing a Litecoin private key transfers all the Litecoin from that wallet into Plasma.\n\nYou will no longer be able to access Litecoin using this private key.'
        }
        imageSource={require('../../assets/images/qr-frame.png')}
      />

      <View>
        <WhiteButton
          value="Scan Private Key"
          small={false}
          active={true}
          onPress={() => {
            // navigation.navigate('Scan', {returnRoute: 'Import'});
            sweepWIF(
              'T9AGGdbPB8awSweFqjnmhTnLLLwfoZvDgqvZq74S3QqnudmGUfvg',
              address,
            );
          }}
        />
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
});

export default Import;
