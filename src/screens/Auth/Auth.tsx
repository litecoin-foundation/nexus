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

// Minimum time for the pin-box wave ('waiting' phase), so the unlock
// reads as intentional even when LND is ready almost instantly.
const MIN_WAVE_MS = 900;
// If LND never accepts the password, give the pad back instead of
// waving forever.
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

  // LND accepted the password and is starting up; a wrong PIN keeps the
  // wallet LOCKED.
  const lndAccepted =
    walletState === WalletState.UNLOCKED || isWalletRpcReady(walletState);

  // Owns the header: 'Forgot Pincode?' hides while unlocking and comes
  // back if the watchdog returns the pad.
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

  // Biometric unlocks have no local validation callback — enter
  // 'waiting' when the wallet leaves LOCKED.
  useEffect(() => {
    if (unlockInitiated && lndAccepted && unlockPhase === 'idle') {
      setUnlockPhase('waiting');
    }
  }, [lndAccepted, unlockInitiated, unlockPhase]);

  // Wave clock. Keep above the outro effect: effects run in declaration
  // order, so an already-ready wallet still gets a full wave.
  useEffect(() => {
    if (unlockPhase === 'waiting') {
      waveStartRef.current = Date.now();
    }
  }, [unlockPhase]);

  // Watchdog: 'waiting' starts optimistically on local validation, but
  // the unlock thunk can fail silently and leave the wallet LOCKED.
  // Give the pad back so the user can retry or reach 'Forgot Pincode?'.
  // Disarms once LND leaves LOCKED.
  useEffect(() => {
    if (unlockPhase !== 'waiting' || lndAccepted) {
      return;
    }
    const timer = setTimeout(() => {
      setUnlockPhase('idle');
    }, UNLOCK_STUCK_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [unlockPhase, lndAccepted]);

  // Once RPC is live and the wave has had its minimum moment, play the
  // outro.
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
    // The Main screen consumes this and plays the reveal intro.
    requestMainIntro();
    navigation.replace('NewWalletStack');
  }, [navigation]);

  const submitPin = () => {
    dispatch(unlockWalletWithPin(pin));
  };

  return (
    <Auth
      handleValidationSuccess={() => {
        // Start the wave right away; the squares keep their filled look
        // after the pin is wiped.
        setUnlockInitiated(true);
        setUnlockPhase('waiting');
        submitPin();
        dispatch(clearValues());
      }}
      // Submitted so the failed attempt counts; deliberately doesn't
      // arm unlockInitiated.
      handleValidationFailure={() => submitPin()}
      unlockPhase={unlockPhase}
      onOutroComplete={handleOutroComplete}
    />
  );
};

export default AuthScreen;
