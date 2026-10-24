import React, {useContext} from 'react';
import {View, StyleSheet} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {StackNavigationProp} from '@react-navigation/stack';
import {useTranslation} from 'react-i18next';

import WhiteButtonV2 from '../../components/ButtonsV2/WhiteButtonV2';
import WhiteClearButtonV2 from '../../components/ButtonsV2/WhiteClearButtonV2';
import {useFixedBottomStyle} from '../../components/ButtonsV2/fixedBottomStyle';
import Card from '../../components/Card';
import ScreenHeader, {
  useScreenHeaderArrival,
  useScreenHeaderLayout,
} from '../../components/ScreenHeader';
import {authenticate} from '../../utils/biometric';
import {setBiometricEnabled} from '../../reducers/authentication';
import {useAppDispatch, useAppSelector} from '../../store/hooks';

import CustomSafeAreaView from '../../components/CustomSafeAreaView';
import {ScreenSizeContext} from '../../context/screenSize';

// Height fraction
const BUTTONS_GAP_RATIO = 0.015;

type RootStackParamList = {
  Biometric: undefined;
  Welcome: undefined;
};

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'Biometric'>;
}

const Biometric: React.FC<Props> = props => {
  const {navigation} = props;
  const dispatch = useAppDispatch();

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);
  const {rects, paddingHorizontal} = useScreenHeaderLayout();
  const headerFadeStyle = useScreenHeaderArrival();
  const fixedBottomStyle = useFixedBottomStyle();

  const {t} = useTranslation('onboarding');

  const faceIDSupported = useAppSelector(
    state => state.authentication.faceIDSupported,
  );
  const biometryType = faceIDSupported ? 'Face ID' : 'Touch ID';

  return (
    <LinearGradient colors={['#1162E6', '#0F55C7']} style={styles.gradient}>
      <CustomSafeAreaView styles={styles.safeArea} edges={['top']}>
        <Card
          titleText={biometryType}
          descTextKey="biometric_description"
          descTextDomain="onboarding"
          textInterpolation={{biometricType: biometryType}}
          imageSource={
            faceIDSupported
              ? require('../../assets/images/face-id-blue.png')
              : require('../../assets/images/touch-id-blue.png')
          }
        />
      </CustomSafeAreaView>

      <View style={[fixedBottomStyle, styles.buttons]}>
        <WhiteButtonV2
          textKey="enable_biometric"
          textDomain="onboarding"
          textInterpolation={{biometricType: biometryType}}
          onPress={async () => {
            try {
              await authenticate(`Enable ${biometryType}`);
              dispatch(setBiometricEnabled(true));
              navigation.navigate('Welcome');
            } catch (error) {
              console.log(error);
              return;
            }
          }}
        />
        <WhiteClearButtonV2
          textKey="maybe"
          textDomain="onboarding"
          onPress={() => {
            dispatch(setBiometricEnabled(false));
            navigation.navigate('Welcome');
          }}
        />
      </View>

      <ScreenHeader
        rects={rects}
        paddingHorizontal={paddingHorizontal}
        titleValue={t('enable_biometric', {biometricType: biometryType})}
        fadeStyle={headerFadeStyle}
      />
    </LinearGradient>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    gradient: {
      flex: 1,
    },
    safeArea: {
      flex: 1,
      width: '100%',
      alignItems: 'center',
      marginTop: screenHeight * 0.14,
    },
    buttons: {
      gap: screenHeight * BUTTONS_GAP_RATIO,
    },
  });

export default Biometric;
