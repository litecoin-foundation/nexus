import React from 'react';
import {StackNavigationProp} from '@react-navigation/stack';

import HeaderButton from '../../components/Buttons/HeaderButton';
import SendConfirmation from '../../components/SendConfirmation';
import {useAppSelector} from '../../store/hooks';

type RootStackParamList = {
  ConfirmSend: undefined;
  SuccessSend: {
    txid: string;
  };
};

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'ConfirmSend'>;
}

const ConfirmSend: React.FC<Props> = props => {
  const {navigation} = props;

  const amount = useAppSelector(state => state.input.send.amount);
  const fiatAmount = useAppSelector(state => state.input.fiatAmount);
  const toAddress = useAppSelector(state => state.input.send.toAddress);
  const label = useAppSelector(state => state.input.send.label);

  return (
    <SendConfirmation
      toAddress={toAddress}
      amount={amount}
      fiatAmount={fiatAmount}
      label={label}
      sendSuccessHandler={txid => navigation.navigate('SuccessSend', {txid})}
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
