import React, {useContext} from 'react';
import {StyleSheet, Platform, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import AuthPad from './Numpad/AuthPad';
import {UnlockPhase} from './PasscodeInput';
import FoldedSkinView from './FoldedSkinView';
import {useAppSelector} from '../store/hooks';

import CustomSafeAreaView from '../components/CustomSafeAreaView';
import {ScreenSizeContext} from '../context/screenSize';

interface Props {
  handleValidationSuccess: () => void;
  handleValidationFailure: () => void;
  keychainPincodeState?: string | null;
  unlockPhase?: UnlockPhase;
  onOutroComplete?: () => void;
}

const Auth: React.FC<Props> = props => {
  const insets = useSafeAreaInsets();

  const {
    handleValidationSuccess,
    handleValidationFailure,
    keychainPincodeState,
    unlockPhase,
    onOutroComplete,
  } = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT, insets.bottom);

  // Mirror the Main screen's offline background so the hand-off matches.
  const isInternetReachable = useAppSelector(
    state => state.info!.isInternetReachable,
  );
  const online = !!isInternetReachable;

  return (
    <View style={styles.container}>
      {/* Mirrors the Main screen's backdrop, avoiding flicker on Skia
          first render. */}
      <FoldedSkinView online={online} />
      <CustomSafeAreaView styles={{...styles.safeArea}} edges={['top']}>
        <AuthPad
          handleValidationSuccess={handleValidationSuccess}
          handleValidationFailure={handleValidationFailure}
          keychainPincodeState={keychainPincodeState}
          unlockPhase={unlockPhase}
          onOutroComplete={onOutroComplete}
        />
      </CustomSafeAreaView>
    </View>
  );
};

const getStyles = (
  screenWidth: number,
  screenHeight: number,
  bottomInset: number,
) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    safeArea: {
      flex: 1,
      marginBottom: Platform.OS === 'android' ? bottomInset : 0,
    },
  });

export default Auth;
