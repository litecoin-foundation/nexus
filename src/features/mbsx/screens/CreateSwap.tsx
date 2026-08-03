import React, {useContext, useState} from 'react';
import {Text, TextInput, TouchableOpacity, View} from 'react-native';

import {ScreenSizeContext} from '../../../context/screenSize';
import CoinSelector from '../components/CoinSelector';
import MessageList from '../components/MessageList';
import {getPrevouts, isRunning, requestSwap} from '../adapter';
import {getMbsxStyles} from '../theme';

// Nexus funds every swap from its own wallet, so the sending side is fixed.
const COIN_FROM = 'LTC';

const CreateSwap: React.FC = () => {
  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);
  const styles = getMbsxStyles(SCREEN_HEIGHT);

  const [coinTo, setCoinTo] = useState('');
  const [addressTo, setAddressTo] = useState('');
  const [amountFrom, setAmountFrom] = useState('');
  const [amountTo, setAmountTo] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  const submit = async () => {
    setResult('');
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
      const amountFromSats = Number(amountFrom);
      if (!Number.isSafeInteger(amountFromSats) || amountFromSats <= 0) {
        throw new Error('Invalid amount to send');
      }
      const amountToSats = Number(amountTo);
      if (!Number.isSafeInteger(amountToSats) || amountToSats <= 0) {
        throw new Error('Invalid amount to receive');
      }
      const outputs = getPrevouts(COIN_FROM);
      if (!outputs || outputs.length === 0) {
        throw new Error(`No funding outputs available for ${COIN_FROM}`);
      }

      const rv = await requestSwap({
        coin_from: COIN_FROM,
        coin_to: coinTo,
        amount_from: amountFromSats,
        amount_to: amountToSats,
        address_to: addressTo,
        outputs,
      });
      if (rv.error) {
        throw new Error(rv.error);
      }
      setError('');
      setResult(`Request sent: ${rv.request_id}`);
    } catch (e) {
      setError((e as Error).message);
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
        <Text style={styles.inputLabel}>Amount to receive</Text>
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
        <TouchableOpacity style={styles.button} onPress={submit}>
          <Text style={styles.buttonText}>Request swap</Text>
        </TouchableOpacity>
        {error !== '' ? <Text style={styles.error}>{error}</Text> : null}
        {result !== '' ? <Text style={styles.status}>{result}</Text> : null}
      </View>
      <MessageList style={styles.messages} />
    </View>
  );
};

export default CreateSwap;
