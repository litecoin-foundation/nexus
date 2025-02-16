import React, {useEffect} from 'react';
import {Alert, StyleSheet, View} from 'react-native';
import {useDispatch} from 'react-redux';

import HeaderButton from '../../components/Buttons/HeaderButton';
import Header from '../../components/Header';
import {useAppSelector} from '../../store/hooks';
import {getAddress} from '../../reducers/address';
import {getSignedSellUrl} from '../../reducers/buy';
import {useNavigation} from '@react-navigation/native';

import TranslateText from '../../components/TranslateText';

interface Props {}

const ConfirmSell: React.FC<Props> = props => {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const {amount} = useAppSelector(state => state.input);
  const {address} = useAppSelector(state => state.address);

  const openSellWidget = async () => {
    try {
      // await is important!
      const url = await dispatch(getSignedSellUrl(address, amount));

      if (typeof url === 'string') {
        navigation.navigate('WebPage', {uri: url});
      } else {
        console.log(url);
        Alert.alert("Something's wrong!", `${url}`);
      }
    } catch (error) {
      Alert.alert("Something's wrong!", `err: ${error}`);
    }
  };

  useEffect(() => {
    dispatch(getAddress(false));
    openSellWidget();
  }, [dispatch]);

  return (
    <View style={styles.container}>
      <Header />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export const ConfirmSellNavigationOptions = navigation => {
  return {
    headerTitle: () => (
      <TranslateText
        textKey={'sell_litecoin'}
        domain={'sellTab'}
        numberOfLines={1}
      />
    ),
    headerTitleAlign: 'left',
    headerTransparent: true,
    headerTintColor: 'white',
    headerLeft: () => (
      <HeaderButton
        onPress={() => navigation.goBack()}
        imageSource={require('../../assets/images/back-icon.png')}
      />
    ),
  };
};

export default ConfirmSell;
