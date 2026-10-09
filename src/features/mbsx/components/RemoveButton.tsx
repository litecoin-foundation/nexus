import React, {useContext, useState} from 'react';
import {Alert, Text, TouchableOpacity, View} from 'react-native';

import {ScreenSizeContext} from '../../../context/screenSize';
import {getMbsxStyles} from '../theme';

type Props = {
  testID: string;
  label: string;
  confirm: string;
  confirmLabel?: string;
  // Asked after confirm, when set.
  confirmAgain?: string;
  disabled?: boolean;
  // Resolves with what to show afterwards; a bulk removal reports its count so
  // the button can say nothing matched rather than looking as if it failed.
  onConfirm: () => Promise<string>;
};

// Removal purges the rows, so there is nothing to undo it with.
const RemoveButton: React.FC<Props> = ({
  testID,
  label,
  confirm,
  confirmLabel = 'Remove',
  confirmAgain,
  disabled,
  onConfirm,
}) => {
  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);
  const styles = getMbsxStyles(SCREEN_HEIGHT);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  const run = async () => {
    setBusy(true);
    setError('');
    setStatus('');
    try {
      setStatus(await onConfirm());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const askThen = (text: string, onPress: () => void) =>
    Alert.alert(label, text, [
      {text: 'Cancel', style: 'cancel'},
      {text: confirmLabel, style: 'destructive', onPress},
    ]);
  const ask = () =>
    askThen(confirm, confirmAgain ? () => askThen(confirmAgain, run) : run);

  return (
    <View>
      <TouchableOpacity
        testID={testID}
        style={[
          styles.buttonSecondary,
          disabled || busy ? styles.buttonDisabled : null,
        ]}
        disabled={disabled || busy}
        onPress={ask}>
        <Text style={styles.buttonSecondaryText}>
          {busy ? 'Removing…' : label}
        </Text>
      </TouchableOpacity>
      {error !== '' ? (
        <Text testID={`${testID}-error`} style={styles.error}>
          {error}
        </Text>
      ) : null}
      {status !== '' ? <Text style={styles.status}>{status}</Text> : null}
    </View>
  );
};

export default RemoveButton;
