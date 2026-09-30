import React, {useEffect, useState} from 'react';
import {Alert, StyleSheet, Text, TouchableOpacity, View} from 'react-native';

import {useAppDispatch, useAppSelector} from '../../../store/hooks';
import {
  applyConfig,
  getInfo,
  isRunning,
  onMessage,
  readConfig,
} from '../adapter';
import {setError, setRunning} from '../mbsxSlice';
import {colors} from '../theme';

type Dispute = {ticker: string; url: string};

const readDisputes = (): Dispute[] =>
  Object.entries(getInfo()?.coins ?? {}).flatMap(([ticker, coin]) =>
    coin.anchor_dispute ? [{ticker, url: coin.anchor_dispute.url}] : [],
  );

const AnchorDispute: React.FC = () => {
  const dispatch = useAppDispatch();
  const running = useAppSelector(state => state.mbsx.running);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [disabling, setDisabling] = useState(false);

  useEffect(() => {
    if (!running) {
      setDisputes([]);
      return;
    }
    const load = () => setDisputes(readDisputes());
    load();
    const subscription = onMessage(load);
    return () => subscription.remove();
  }, [running]);

  if (disputes.length === 0) {
    return null;
  }

  const disable = async ({ticker, url}: Dispute) => {
    setDisabling(true);
    dispatch(setError(null));
    try {
      const config = await readConfig();
      const key = ticker.toLowerCase();
      if (!config?.coins[key]) {
        throw new Error(`No ${ticker} settings to change`);
      }
      await applyConfig({
        ...config,
        coins: {
          ...config.coins,
          [key]: {
            ...config.coins[key],
            electrumx: config.coins[key].electrumx.map(server =>
              server.url === url ? {...server, disabled: true} : server,
            ),
          },
        },
      });
    } catch (e) {
      dispatch(setError((e as Error).message));
    } finally {
      dispatch(setRunning(isRunning()));
      setDisputes(readDisputes());
      setDisabling(false);
    }
  };

  const confirmDisable = (dispute: Dispute) =>
    Alert.alert(
      'Disable server',
      `${dispute.url} reported a different ${dispute.ticker} block than the swap server. ` +
        'Disable it? It can be turned back on in Settings.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Disable',
          style: 'destructive',
          onPress: () => disable(dispute),
        },
      ],
    );

  return (
    <>
      {disputes.map(dispute => (
        <View key={dispute.ticker} style={styles.banner}>
          <Text style={styles.text}>
            {`${dispute.ticker} server ${dispute.url} disagrees with the swap server`}
          </Text>
          <TouchableOpacity
            testID={`mbsx-anchor-dispute-disable-${dispute.ticker}`}
            accessibilityRole="button"
            disabled={disabling}
            onPress={() => confirmDisable(dispute)}>
            <Text style={[styles.action, disabling ? styles.actionBusy : null]}>
              {disabling ? 'Disabling…' : 'Disable'}
            </Text>
          </TouchableOpacity>
        </View>
      ))}
    </>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.danger,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  text: {
    flexShrink: 1,
    color: colors.white,
    fontFamily: 'Satoshi Variable',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  action: {
    marginLeft: 12,
    color: colors.white,
    fontFamily: 'Satoshi Variable',
    fontSize: 13,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  actionBusy: {
    opacity: 0.6,
    textDecorationLine: 'none',
  },
});

export default AnchorDispute;
