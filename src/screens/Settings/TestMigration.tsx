import React, {useState, useContext, useCallback, useEffect} from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import * as RNFS from '@dr.pogodin/react-native-fs';

import Header from '../../components/Header';
import HeaderButton from '../../components/Buttons/HeaderButton';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {setLitecoinBackend} from '../../reducers/settings';
import {getItem, resetItem} from '../../utils/keychain';

import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';
import {StackNavigationOptions} from '@react-navigation/stack';

// Throwaway debug screen used to reproduce/verify the neutrino -> electrum
// migration reconcile in runElectrumMigrationIfNeeded. Remove before release.
const MIGRATION_FLAG_KEY = 'ELECTRUM_MIGRATION';

const TestMigration: React.FC = () => {
  const dispatch = useAppDispatch();

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const litecoinBackend = useAppSelector(
    state => state.settings.litecoinBackend,
  );
  const isMigrating = useAppSelector(state => state.lightning.isMigrating);

  const [flag, setFlag] = useState<string>('(loading)');
  const [confNode, setConfNode] = useState<string>('(loading)');

  const refreshState = useCallback(async () => {
    const storedFlag = await getItem(MIGRATION_FLAG_KEY);
    setFlag(storedFlag === null ? '(unset)' : storedFlag);

    try {
      const lndConfPath = `${RNFS.DocumentDirectoryPath}/lndltc/lnd.conf`;
      const conf = await RNFS.readFile(lndConfPath);
      setConfNode(conf.match(/litecoin\.node=\w+/)?.[0] ?? '(no node line)');
    } catch {
      setConfNode('(no lnd.conf yet)');
    }
  }, []);

  useEffect(() => {
    refreshState();
  }, [refreshState]);

  // Simulate the reported bug's precondition: keep the migration flag = 'true'
  // but flip the persisted backend back to neutrino. Force-quit + relaunch and
  // the reconcile should restore electrum.
  const handleDriftToNeutrino = () => {
    dispatch(setLitecoinBackend('neutrino'));
    setTimeout(() => {
      refreshState();
      Alert.alert(
        'Backend set to neutrino',
        'Flag left as-is. Fully force-quit the app now, then relaunch — it should come back up on electrum.',
      );
    }, 800);
  };

  // Clear the migration flag AND drift to neutrino so the FULL migration
  // re-runs on next launch (deletes wallet.db -> recovers from seed).
  const handleResetMigration = () => {
    Alert.alert(
      'Reset migration?',
      'This clears the migration flag and sets neutrino, so the full migration (with a recovery rescan) re-runs on next launch. Make sure your seed is backed up.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetItem(MIGRATION_FLAG_KEY);
            dispatch(setLitecoinBackend('neutrino'));
            await refreshState();
            Alert.alert(
              'Migration reset',
              'Force-quit and relaunch to re-run the full migration.',
            );
          },
        },
      ],
    );
  };

  return (
    <LinearGradient style={styles.container} colors={['#F2F8FD', '#d2e1ef00']}>
      <Header />
      <ScrollView>
        <View style={styles.separator}>
          <Text style={styles.separatorTitle}>Current state</Text>
        </View>
        <View style={styles.stateBox}>
          <Text style={styles.stateText}>
            backend (redux): {litecoinBackend}
          </Text>
          <Text style={styles.stateText}>
            migration flag (keychain): {flag}
          </Text>
          <Text style={styles.stateText}>
            isMigrating (redux): {String(isMigrating)}
          </Text>
          <Text style={styles.stateText}>lnd.conf: {confNode}</Text>
        </View>

        <View style={styles.separator}>
          <Text style={styles.separatorTitle}>Actions</Text>
        </View>
        <TouchableOpacity style={styles.actionRow} onPress={refreshState}>
          <Text style={styles.actionText}>Refresh state</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionRow}
          onPress={handleDriftToNeutrino}>
          <Text style={styles.actionText}>
            DEBUG: drift to neutrino (flag stays true)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionRow}
          onPress={handleResetMigration}>
          <Text style={styles.actionText}>
            DEBUG: reset migration (re-run full migration)
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F7F7F7',
    },
    separator: {
      width: '100%',
      height: screenHeight * 0.02,
      minHeight: screenHeight * 0.02,
      backgroundColor: '#F7F7F7',
      justifyContent: 'center',
      alignItems: 'center',
    },
    separatorTitle: {
      color: '#000',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.014,
      fontStyle: 'normal',
    },
    stateBox: {
      paddingHorizontal: 20,
      paddingVertical: 12,
      gap: 6,
    },
    stateText: {
      color: '#000',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.016,
    },
    actionRow: {
      width: '100%',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: '#0000001a',
      backgroundColor: '#fff',
    },
    actionText: {
      color: '#1162E6',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.018,
      fontWeight: '600',
    },
    headerTitle: {
      color: '#fff',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.026,
      fontStyle: 'normal',
      fontWeight: '700',
    },
  });

export const TestMigrationNavigationOptions = (
  navigation: any,
): StackNavigationOptions => {
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  return {
    headerTitle: () => (
      <TranslateText
        textKey="Test Migration"
        domain="settingsTab"
        maxSizeInPixels={SCREEN_HEIGHT * 0.022}
        textStyle={styles.headerTitle}
        numberOfLines={1}
      />
    ),
    headerTitleAlign: 'left',
    headerTitleContainerStyle: {
      left: 7,
    },
    headerTransparent: true,
    headerTintColor: 'white',
    headerLeft: () => (
      <HeaderButton
        onPress={() => navigation.goBack()}
        imageSource={require('../../assets/images/back-icon.png')}
        leftPadding
      />
    ),
    headerLeftContainerStyle:
      Platform.OS === 'ios' && SCREEN_WIDTH >= 414 ? {marginStart: -5} : null,
    headerRightContainerStyle:
      Platform.OS === 'ios' && SCREEN_WIDTH >= 414 ? {marginEnd: -5} : null,
  };
};

export default TestMigration;
