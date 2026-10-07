import React, {useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';

import {useAppDispatch, useAppSelector} from '../../../store/hooks';
import {getInfo, isRunning, reconnect} from '../adapter';
import {setConnected, setError, setRunning} from '../mbsxSlice';
import {colors} from '../theme';

const BridgeStatus: React.FC = () => {
  const dispatch = useAppDispatch();
  const running = useAppSelector(state => state.mbsx.running);
  const connected = useAppSelector(state => state.mbsx.connected);
  const startupStep = useAppSelector(state => state.mbsx.startupStep);
  const [retrying, setRetrying] = useState(false);

  // A stopped core is an idle section, not a server that is unreachable.
  if (!running || connected || startupStep === 'bridge') {
    return null;
  }

  const retry = async () => {
    setRetrying(true);
    dispatch(setError(null));
    try {
      await reconnect();
      dispatch(setConnected(getInfo()?.connected === true));
    } catch (e) {
      dispatch(setError((e as Error).message));
    } finally {
      dispatch(setRunning(isRunning()));
      setRetrying(false);
    }
  };

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>Not connected</Text>
      <TouchableOpacity
        testID="mbsx-bridge-retry"
        accessibilityRole="button"
        accessibilityLabel="Retry"
        disabled={retrying}
        onPress={retry}>
        <Text style={[styles.retry, retrying ? styles.retryBusy : null]}>
          {retrying ? '(retrying…)' : '(retry)'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.warning,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  text: {
    color: colors.white,
    fontFamily: 'Satoshi Variable',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  retry: {
    marginLeft: 4,
    color: colors.white,
    fontFamily: 'Satoshi Variable',
    fontSize: 13,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  retryBusy: {
    opacity: 0.6,
    textDecorationLine: 'none',
  },
});

export default BridgeStatus;
