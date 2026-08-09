import React, {useContext, useState} from 'react';
import {Text, TextInput, TouchableOpacity, View} from 'react-native';
import {AddressType, newAddress} from 'react-native-nitro-lndltc';
import {DrawerScreenProps} from '@react-navigation/drawer';

import {ScreenSizeContext} from '../../../context/screenSize';
import {useAppSelector} from '../../../store/hooks';
import {
  isHwWalletSelectedSelector,
  selectedAccountNamesSelector,
} from '../../../reducers/wallets';
import CoinSelector from '../components/CoinSelector';
import MessageList from '../components/MessageList';
import {
  isRunning,
  parseAmount,
  recordLeases,
  releasePrevouts,
  requestSwap,
  selectAndLeasePrevouts,
  serialisePrevout,
} from '../adapter';
import {getMbsxStyles} from '../theme';
import type {MbsxDrawerParamList} from '../types';

type Props = DrawerScreenProps<MbsxDrawerParamList, 'CreateSwap'>;

// Nexus funds every swap from its own wallet, so the sending side is fixed.
const COIN_FROM = 'LTC';

// Below this lnd will not build an output at all, and the failure surfaces from
// FundPsbt as a dust error rather than as anything about the amount.
const DUST_LIMIT = 294n;

const CreateSwap: React.FC<Props> = ({navigation}) => {
  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);
  const styles = getMbsxStyles(SCREEN_HEIGHT);

  const [coinTo, setCoinTo] = useState('');
  const [addressTo, setAddressTo] = useState('');
  const [amountFrom, setAmountFrom] = useState('');
  const [amountTo, setAmountTo] = useState('');
  const [requestId, setRequestId] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const isHwWallet = useAppSelector(isHwWalletSelectedSelector);
  const {ltcAccount} = useAppSelector(selectedAccountNamesSelector);

  const submit = async () => {
    setRequestId('');
    setBusy(true);
    try {
      if (!isRunning()) {
        throw new Error('Swaps are not running');
      }
      if (!coinTo) {
        throw new Error('Select a coin to receive');
      }
      if (!addressTo) {
        throw new Error('Missing receive address');
      }
      // Amounts are entered in whole coins; the module holds the only conversion.
      let amountFromSats: bigint;
      try {
        amountFromSats = parseAmount(COIN_FROM, amountFrom);
      } catch {
        throw new Error('Invalid amount to send');
      }
      if (amountFromSats < DUST_LIMIT) {
        throw new Error('Amount to send is too small to spend');
      }
      // Parsed only to reject it here: the module is sent the string. Leasing
      // coins and then failing on the receive amount would strand them.
      try {
        parseAmount(coinTo, amountTo);
      } catch {
        throw new Error('Invalid amount to receive');
      }
      // Change and, if the swap fails, the whole refund come back here rather
      // than to a module key, so it is one of ours.
      const change = await newAddress({
        type: AddressType.UNUSED_WITNESS_PUBKEY_HASH,
        account: ltcAccount,
      });
      if (!change?.address) {
        throw new Error('Could not get a change address');
      }

      const prevouts = await selectAndLeasePrevouts(
        amountFromSats,
        change.address,
        isHwWallet,
        ltcAccount,
      );

      let rv;
      try {
        rv = await requestSwap({
          coin_from: COIN_FROM,
          coin_to: coinTo,
          amount_from: amountFrom,
          amount_to: amountTo,
          address_to: addressTo,
          change_address: change.address,
          outputs: prevouts.map(serialisePrevout),
        });
      } catch (e) {
        // The coins are locked and nothing is tracking them yet.
        await releasePrevouts(prevouts);
        throw e;
      }
      if (rv.error) {
        await releasePrevouts(prevouts);
        throw new Error(rv.error);
      }

      recordLeases(rv.request_id, prevouts);
      setError('');
      setRequestId(rv.request_id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.scroll}>
        <CoinSelector label="Receive" value={coinTo} onChange={setCoinTo} />
        <Text style={styles.inputLabel}>Receive address</Text>
        <TextInput
          style={styles.input}
          placeholder="Address"
          value={addressTo}
          onChangeText={setAddressTo}
          autoCapitalize="none"
        />
        <Text style={styles.inputLabel}>
          {coinTo ? `Amount to receive (${coinTo})` : 'Amount to receive'}
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Amount"
          value={amountTo}
          onChangeText={setAmountTo}
          keyboardType="numeric"
        />
        <Text style={styles.inputLabel}>{`Amount to send (${COIN_FROM})`}</Text>
        <TextInput
          style={styles.input}
          placeholder="Amount"
          value={amountFrom}
          onChangeText={setAmountFrom}
          keyboardType="numeric"
        />
        {/* Coins are leased before the request is sent, so a second submit
            would lock a second set of them. */}
        <TouchableOpacity
          style={styles.button}
          onPress={submit}
          disabled={busy}>
          <Text style={styles.buttonText}>
            {busy ? 'Requesting…' : 'Request swap'}
          </Text>
        </TouchableOpacity>
        {error !== '' ? <Text style={styles.error}>{error}</Text> : null}
        {requestId !== '' ? (
          <TouchableOpacity
            onPress={() => navigation.navigate('RequestDetail', {requestId})}>
            <Text style={styles.link}>{`Request sent: ${requestId}`}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <MessageList style={styles.messages} />
    </View>
  );
};

export default CreateSwap;
