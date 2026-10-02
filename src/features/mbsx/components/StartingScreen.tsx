import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {useAppSelector} from '../../../store/hooks';
import {colors} from '../theme';
import BasicSwapMark from './BasicSwapMark';

const STEP_TEXT: Record<string, string> = {
  key: 'Deriving the swap key',
  config: 'Loading settings',
  database: 'Checking the database',
  swaps: 'Resuming swaps',
  block_index: 'Loading block headers',
  anchors: 'Checking chain anchors',
  servers: 'Connecting to servers',
  bridge: 'Connecting to the swap server',
};

type Props = {onRetry: () => void};

const StartingScreen: React.FC<Props> = ({onRetry}) => {
  const running = useAppSelector(state => state.mbsx.running);
  const error = useAppSelector(state => state.mbsx.error);
  const step = useAppSelector(state => state.mbsx.startupStep);

  if (running && step !== 'bridge') {
    return null;
  }

  return (
    <View style={styles.screen} testID="mbsx-starting">
      <View style={styles.logo}>
        <BasicSwapMark width={168} />
      </View>
      {error ? (
        <>
          <Text style={styles.title}>Swaps did not start</Text>
          <Text style={styles.error}>{error}</Text>
          <TouchableOpacity
            testID="mbsx-starting-retry"
            accessibilityRole="button"
            onPress={onRetry}>
            <Text style={styles.retry}>Retry</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.title}>Starting BasicSwap</Text>
          {step ? (
            <Text style={styles.step} testID="mbsx-starting-step">
              {STEP_TEXT[step] ?? step}
            </Text>
          ) : null}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.page,
    paddingHorizontal: 24,
  },
  logo: {
    marginBottom: 28,
  },
  title: {
    marginTop: 16,
    color: colors.text,
    fontFamily: 'Satoshi Variable',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  step: {
    marginTop: 6,
    color: colors.textSecondary,
    fontFamily: 'Satoshi Variable',
    fontSize: 14,
    textAlign: 'center',
  },
  error: {
    marginTop: 8,
    color: colors.danger,
    fontFamily: 'Satoshi Variable',
    fontSize: 14,
    textAlign: 'center',
  },
  retry: {
    marginTop: 16,
    color: colors.primary,
    fontFamily: 'Satoshi Variable',
    fontSize: 15,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});

export default StartingScreen;
