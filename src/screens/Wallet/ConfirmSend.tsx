import React, {useContext} from 'react';
import {Platform} from 'react-native';
import {RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {Utxo} from 'react-native-turbo-lndltc/protos/lightning_pb';

import HeaderButton from '../../components/Buttons/HeaderButton';
import SendConfirmation from '../../components/SendConfirmation';
import {useAppSelector} from '../../store/hooks';

import {ScreenSizeContext} from '../../context/screenSize';

type RootStackParamList = {
  ConfirmSend: {
    sendAll?: boolean;
    selectedUtxos?: Utxo[];
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
  const coinSelectionUtxos =
    route.params.selectedUtxos === undefined ||
    route.params.selectedUtxos!.length < 1
      ? null
      : route.params.selectedUtxos!;

  return (
    <SendConfirmation
      toAddress={toAddress}
      toDomain={toDomain}
      amount={amount}
      fiatAmount={fiatAmount}
      label={label}
      sendSuccessHandler={txid => navigation.navigate('SuccessSend', {txid})}
      sendAll={sendAll}
      coinSelectionUtxos={coinSelectionUtxos}
    />
  );
};

export const ConfirmSendNavigationOptions = (navigation: any) => {
  const {width: SCREEN_WIDTH} = useContext(ScreenSizeContext);

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
        leftPadding
      />
    ),
    headerRight: () => (
      <HeaderButton
        textKey="cancel"
        textDomain="buyTab"
        onPress={() => navigation.navigate('Main', {isInitial: true})}
        rightPadding
      />
    ),
    headerLeftContainerStyle:
      Platform.OS === 'ios' && SCREEN_WIDTH >= 414 ? {marginStart: -5} : null,
    headerRightContainerStyle:
      Platform.OS === 'ios' && SCREEN_WIDTH >= 414 ? {marginEnd: -5} : null,
  };
};

export default ConfirmSend;
