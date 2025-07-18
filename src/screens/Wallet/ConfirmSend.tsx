import React from 'react';
import {RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';

import HeaderButton from '../../components/Buttons/HeaderButton';
import SendConfirmation from '../../components/SendConfirmation';
import {useAppSelector} from '../../store/hooks';

type RootStackParamList = {
  ConfirmSend: {
    sendAll?: boolean;
  };
  SuccessSend: {
    txid: string;
  };
};

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'ConfirmSend'>;
  route: RouteProp<RootStackParamList, 'ConfirmSend'>;
}

const ConfirmSend: React.FC<Props> = props => {
  const {navigation, route} = props;

  const amount = useAppSelector(state => state.input!.send.amount);
  const fiatAmount = useAppSelector(state => state.input!.fiatAmount);
  const toAddress = useAppSelector(state => state.input!.send.toAddress);
  const toDomain = useAppSelector(state => state.input!.send.toDomain);
  const label = useAppSelector(state => state.input!.send.label);

  const sendAll = route.params?.sendAll || false;

  return (
    <SendConfirmation
      toAddress={toAddress}
      toDomain={toDomain}
      amount={amount}
      fiatAmount={fiatAmount}
      label={label}
      sendSuccessHandler={txid => navigation.navigate('SuccessSend', {txid})}
      sendAll={sendAll}
    />
  );
};

export const ConfirmSendNavigationOptions = (navigation: any) => {
  return {
    headerTitle: '',
    headerTransparent: true,
    headerTintColor: 'white',
    headerLeft: () => (
      <HeaderButton
        textKey="change"
        textDomain="buyTab"
        onPress={() => navigation.goBack()}
        imageSource={require('../../assets/images/back-icon.png')}
      />
    ),
    headerRight: () => (
      <HeaderButton
        textKey="cancel"
        textDomain="buyTab"
        onPress={() => navigation.navigate('Main', {isInitial: true})}
        rightPadding={true}
      />
    ),
  };
};

export default ConfirmSend;
