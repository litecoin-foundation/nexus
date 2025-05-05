import React, {useContext} from 'react';
import {StyleSheet, Platform} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

import AuthPad from './Numpad/AuthPad';

import CustomSafeAreaView from '../components/CustomSafeAreaView';
import {ScreenSizeContext} from '../context/screenSize';

interface Props {
  handleValidationSuccess: () => Promise<void>;
  handleValidationFailure: () => void;
}

const Auth: React.FC<Props> = props => {
  const insets = useSafeAreaInsets();

  const {handleValidationSuccess, handleValidationFailure} = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT, insets.bottom);

  return (
    <LinearGradient style={styles.container} colors={['#1162E6', '#0F55C7']}>
      <CustomSafeAreaView styles={{...styles.safeArea}} edges={['top']}>
        <AuthPad
          handleValidationSuccess={handleValidationSuccess}
          handleValidationFailure={handleValidationFailure}
        />
      </CustomSafeAreaView>
    </LinearGradient>
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
