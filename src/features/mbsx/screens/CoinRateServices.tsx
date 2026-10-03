import React, {useContext, useEffect, useState} from 'react';
import {
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type {DrawerScreenProps} from '@react-navigation/drawer';

import {ScreenSizeContext} from '../../../context/screenSize';
import {useAppSelector} from '../../../store/hooks';
import {getNetwork} from '../network';
import {
  RATE_SOURCES,
  SOURCE_NAMES,
  readRateServices,
  refreshRates,
  writeRateServices,
} from '../rates';
import type {RateServices, RateSource, SourceResult} from '../rates';
import {useUnsavedDraftGuard} from '../settingsDraft';
import {getMbsxStyles} from '../theme';
import type {MbsxDrawerParamList} from '../types';

type Props = DrawerScreenProps<MbsxDrawerParamList, 'CoinRateServices'>;

const PLANS: RateServices['coingecko']['plan'][] = ['demo', 'pro'];

// Outlives the page, as the settings draft outlives the section
let unsaved: RateServices | null = null;

const time = (at: number) => new Date(at * 1000).toLocaleTimeString();

const resultText = (result: SourceResult | undefined): string => {
  if (!result) {
    return 'Not asked yet';
  }
  switch (result.kind) {
    case 'ok':
      return result.coins.length > 0
        ? `${result.coins.join(', ')} at ${time(result.at)}`
        : `No rates at ${time(result.at)}`;
    case 'limited':
      return `Rate limited until ${time(result.until)}`;
    case 'failed':
      return `Failed at ${time(result.at)}: ${result.message}`;
  }
};

const CoinRateServices: React.FC<Props> = () => {
  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);
  const styles = getMbsxStyles(SCREEN_HEIGHT);
  const results = useAppSelector(state => state.mbsx.rateResults);
  const [saved, setSaved] = useState<RateServices | null>(null);
  const [draft, setDraftState] = useState<RateServices | null>(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let live = true;
    readRateServices().then(stored => {
      if (live) {
        setSaved(stored);
        setDraftState(unsaved ?? stored);
      }
    });
    return () => {
      live = false;
    };
  }, []);

  const dirty =
    saved !== null &&
    draft !== null &&
    JSON.stringify(draft) !== JSON.stringify(saved);

  useUnsavedDraftGuard(dirty, 'CoinRateServices', () => {
    unsaved = null;
    setDraftState(saved);
  });

  const edit = (update: (prev: RateServices) => RateServices) => {
    setStatus('');
    setDraftState(prev => {
      if (!prev) {
        return prev;
      }
      unsaved = update(prev);
      return unsaved;
    });
  };

  const save = async () => {
    if (!draft) {
      return;
    }
    setError('');
    setSaving(true);
    try {
      await writeRateServices(draft);
      setSaved(draft);
      unsaved = null;
      setStatus('Saved');
      refreshRates();
    } catch (e) {
      setError(`Could not save: ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  if (!draft || !saved) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>Loading…</Text>
      </View>
    );
  }

  const sourceStatus = (source: RateSource) => (
    <Text testID={`mbsx-rates-status-${source}`} style={styles.value}>
      {saved.enabled ? resultText(results[source]) : 'Off'}
    </Text>
  );

  const keyField = (
    source: 'coingecko' | 'coinpaprika',
    key: string,
    setKey: (value: string) => void,
  ) => (
    <>
      <TextInput
        testID={`mbsx-rates-${source}-key`}
        style={styles.input}
        value={key}
        placeholder="API key (optional)"
        onChangeText={setKey}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
      />
      {key !== '' ? (
        <TouchableOpacity
          testID={`mbsx-rates-${source}-remove`}
          style={styles.buttonSecondary}
          onPress={() => setKey('')}>
          <Text style={styles.buttonSecondaryText}>Remove key</Text>
        </TouchableOpacity>
      ) : null}
    </>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.section}>Coin Rate Services</Text>
        {getNetwork() === 'regtest' ? (
          <Text testID="mbsx-rates-regtest" style={styles.rowMessage}>
            Regtest uses the swap server's prices; nothing is fetched.
          </Text>
        ) : null}
        <View style={styles.row}>
          <Text style={styles.label}>Fetch coin rates</Text>
          <Switch
            testID="mbsx-rates-enabled"
            value={draft.enabled}
            onValueChange={enabled => edit(prev => ({...prev, enabled}))}
          />
        </View>
        <Text style={styles.rowMessage}>
          {draft.enabled
            ? `Offers and amounts are checked against ${RATE_SOURCES.map(
                source => SOURCE_NAMES[source],
              ).join(', ')}, in that order.`
            : "Off, the swap server's prices are used without a check."}
        </Text>

        <Text style={styles.section}>{SOURCE_NAMES.coingecko}</Text>
        {sourceStatus('coingecko')}
        <Text style={styles.inputLabel}>Plan</Text>
        <View style={styles.modeRow}>
          {PLANS.map(plan => {
            const active = draft.coingecko.plan === plan;
            return (
              <TouchableOpacity
                key={plan}
                testID={`mbsx-rates-coingecko-${plan}`}
                style={[
                  styles.modeOption,
                  active ? styles.modeOptionActive : null,
                ]}
                onPress={() =>
                  edit(prev => ({
                    ...prev,
                    coingecko: {...prev.coingecko, plan},
                  }))
                }>
                <Text
                  style={[
                    styles.modeText,
                    active ? styles.modeTextActive : null,
                  ]}>
                  {plan}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {keyField('coingecko', draft.coingecko.key, key =>
          edit(prev => ({...prev, coingecko: {...prev.coingecko, key}})),
        )}

        <Text style={styles.section}>{SOURCE_NAMES.coinpaprika}</Text>
        {sourceStatus('coinpaprika')}
        {keyField('coinpaprika', draft.coinpaprika.key, key =>
          edit(prev => ({...prev, coinpaprika: {key}})),
        )}

        <Text style={styles.section}>{SOURCE_NAMES.mexc}</Text>
        {sourceStatus('mexc')}
        <Text style={styles.rowMessage}>No key needed.</Text>

        {error ? (
          <Text testID="mbsx-rates-error" style={styles.error}>
            {error}
          </Text>
        ) : null}
        {status ? (
          <Text testID="mbsx-rates-saved" style={styles.status}>
            {status}
          </Text>
        ) : null}
        {dirty ? (
          <TouchableOpacity
            testID="mbsx-rates-save"
            style={[styles.button, saving ? styles.buttonDisabled : null]}
            disabled={saving}
            onPress={save}>
            <Text style={styles.buttonText}>Save</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </View>
  );
};

export default CoinRateServices;
