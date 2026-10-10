import React from 'react';
import {StyleSheet, View} from 'react-native';
import {NavigatorScreenParams, RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import type {Utxo} from 'react-native-nitro-lndltc';

import SendConfirmation from '../../components/SendConfirmation';
import ScreenHeader, {
  useScreenHeaderArrival,
  useScreenHeaderLayout,
} from '../../components/ScreenHeader';
import {useAppSelector} from '../../store/hooks';
import {MainStackParamList} from '../../navigation/types';

type RootStackParamList = {
  ConfirmSend: {
    sendAll?: boolean;
    selectedUtxos?: Utxo[];
  };
  SuccessSend: {
    txid: string;
    amount: number;
    toAddress: string;
  };
  Main: NavigatorScreenParams<MainStackParamList>;
};

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'ConfirmSend'>;
  route: RouteProp<RootStackParamList, 'ConfirmSend'>;
}

const ConfirmSend: React.FC<Props> = props => {
  const {navigation, route} = props;

  const {rects, paddingHorizontal} = useScreenHeaderLayout();
  const headerFadeStyle = useScreenHeaderArrival();

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
    <View style={styles.container}>
      <SendConfirmation
        toAddress={toAddress}
        toDomain={toDomain}
        amount={amount}
        fiatAmount={fiatAmount}
        label={label}
        sendSuccessHandler={txid =>
          navigation.navigate('SuccessSend', {txid, amount, toAddress})
        }
        sendAll={sendAll}
        coinSelectionUtxos={coinSelectionUtxos}
      />
      <ScreenHeader
        rects={rects}
        paddingHorizontal={paddingHorizontal}
        rightTextKey="cancel"
        rightTextDomain="buyTab"
        onRightPress={() =>
          navigation.popTo('Main', {
            screen: 'MainScreen',
            params: {isInitial: true},
          })
        }
        fadeStyle={headerFadeStyle}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default ConfirmSend;
