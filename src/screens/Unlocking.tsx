import React, {useEffect, useRef, useState} from 'react';
import {StyleSheet} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {StackNavigationProp} from '@react-navigation/stack';
import {WalletState} from 'react-native-nitro-lndltc';

import LoadingIndicator from '../components/LoadingIndicator';
import {useAppSelector} from '../store/hooks';

type RootStackParamList = {
  Unlocking: undefined;
  NewWalletStack: undefined;
};

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'Unlocking'>;
}

// Keep the unlock animation on screen for at least this long so the
// hand-off reads as an intentional transition even when LND reports
// RPC_ACTIVE almost immediately.
const MIN_VISIBLE_MS = 1000;

const Unlocking: React.FC<Props> = ({navigation}) => {
  const walletState = useAppSelector(state => state.lightning.walletState);
  const [minElapsed, setMinElapsed] = useState(false);
  const navigatedRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinElapsed(true), MIN_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, []);

  // Reveal the wallet only once LND's RPC layer is live AND the animation
  // has had its minimum moment on screen.
  useEffect(() => {
    const walletReady =
      walletState === WalletState.RPC_ACTIVE ||
      walletState === WalletState.SERVER_ACTIVE;

    if (minElapsed && walletReady && !navigatedRef.current) {
      navigatedRef.current = true;
      navigation.replace('NewWalletStack');
    }
  }, [minElapsed, walletState, navigation]);

  return (
    <LinearGradient style={styles.container} colors={['#1162E6', '#0F55C7']}>
      <LoadingIndicator visible noBlur />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default Unlocking;
