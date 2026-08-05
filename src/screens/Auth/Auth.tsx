import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {StackNavigationProp} from '@react-navigation/stack';
import {WalletState} from 'react-native-nitro-lndltc';

import Auth from '../../components/Auth';
import {UnlockPhase} from '../../components/PasscodeInput';
import {requestMainIntro} from '../../components/MainIntroOverlay';
import HeaderButton from '../../components/Buttons/HeaderButton';
import {
  unlockWalletWithPin,
  unlockWalletWithBiometric,
} from '../../reducers/authentication';
import {clearValues} from '../../reducers/authpad';
import {isWalletRpcReady} from '../../reducers/lightning';
import {useAppDispatch, useAppSelector} from '../../store/hooks';

type RootStackParamList = {
  Auth: undefined;
  Forgot: undefined;
  NewWalletStack: undefined;
};

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'Auth'>;
}

const MIN_WAVE_MS = 900;
const UNLOCK_STUCK_TIMEOUT_MS = 12000;

const AuthScreen: React.FC<Props> = props => {
  const {navigation} = props;
  const dispatch = useAppDispatch();

  const pin = useAppSelector(state => state.authpad!.pin);
  const biometricsEnabled = useAppSelector(
    state => state.authentication!.biometricsEnabled,
  );
  const walletState = useAppSelector(state => state.lightning.walletState);
  const [unlockInitiated, setUnlockInitiated] = useState(false);
  const [unlockPhase, setUnlockPhase] = useState<UnlockPhase>('idle');
  const waveStartRef = useRef(0);
  const navigatedRef = useRef(false);

  const lndAccepted =
    walletState === WalletState.UNLOCKED || isWalletRpcReady(walletState);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: '',
      headerRight:
        unlockPhase === 'idle'
          ? () => (
              <HeaderButton
                textKey="forgot_pin"
                textDomain="onboarding"
                onPress={() => navigation.navigate('Forgot')}
                rightPadding={true}
              />
            )
          : () => null,
    });
  }, [navigation, unlockPhase]);

  // Presents Biometric authentication on launch
  // If biometricEnabled & wallet is locked, present Biometric auth request
  useEffect(() => {
    if (biometricsEnabled && walletState === WalletState.LOCKED) {
      setUnlockInitiated(true);
      dispatch(unlockWalletWithBiometric());
    }
  }, [biometricsEnabled, walletState, dispatch]);

  // Biometric unlocks have no local validation callback. Start the wave when
  // LND confirms that it accepted the password.
  useEffect(() => {
    if (unlockInitiated && lndAccepted && unlockPhase === 'idle') {
      setUnlockPhase('waiting');
    }
  }, [lndAccepted, unlockInitiated, unlockPhase]);

  useEffect(() => {
    if (unlockPhase === 'waiting') {
      waveStartRef.current = Date.now();
    }
  }, [unlockPhase]);

  // Local validation starts the animation optimistically. If LND never
  // accepts the password, restore the keypad so the user can retry.
  useEffect(() => {
    if (unlockPhase !== 'waiting' || lndAccepted) {
      return;
    }
    const timer = setTimeout(() => {
      setUnlockPhase('idle');
    }, UNLOCK_STUCK_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [unlockPhase, lndAccepted]);

  useEffect(() => {
    if (unlockPhase !== 'waiting' || !isWalletRpcReady(walletState)) {
      return;
    }

    const remaining = Math.max(
      0,
      MIN_WAVE_MS - (Date.now() - waveStartRef.current),
    );
    const timer = setTimeout(() => setUnlockPhase('outro'), remaining);
    return () => clearTimeout(timer);
  }, [unlockPhase, walletState]);

  const handleOutroComplete = useCallback(() => {
    if (navigatedRef.current) {
      return;
    }

    navigatedRef.current = true;
    requestMainIntro();
    navigation.replace('NewWalletStack');
  }, [navigation]);

  const submitPin = () => {
    dispatch(unlockWalletWithPin(pin));
  };

  return (
    <Auth
      handleValidationSuccess={() => {
        setUnlockInitiated(true);
        setUnlockPhase('waiting');
        submitPin();
        dispatch(clearValues());
      }}
      // Submit incorrect attempts so the existing lockout counters still
      // advance, but do not arm the unlock transition.
      handleValidationFailure={() => submitPin()}
      unlockPhase={unlockPhase}
      onOutroComplete={handleOutroComplete}
    />
  );
};

export default AuthScreen;
