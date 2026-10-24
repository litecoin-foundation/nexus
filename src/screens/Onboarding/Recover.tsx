import React, {useEffect} from 'react';
import {StyleSheet} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {StackNavigationProp} from '@react-navigation/stack';
import {useTranslation} from 'react-i18next';

import RecoveryField from '../../components/RecoveryField';
import ScreenHeader, {
  useScreenHeaderArrival,
  useScreenHeaderLayout,
} from '../../components/ScreenHeader';
import {
  setSeedRecovery,
  resetSeedAction,
  setRecoveryMode,
} from '../../reducers/onboarding';
import {useAppDispatch} from '../../store/hooks';

import CustomSafeAreaView from '../../components/CustomSafeAreaView';

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'Recover'>;
}

type RootStackParamList = {
  Recover: undefined;
  Pin: undefined;
};

const debugSeed = [
  'abandon',
  'clock',
  'civil',
  'uphold',
  'february',
  'liberty',
  'tray',
  'item',
  'kiwi',
  'adult',
  'casino',
  'force',
  'check',
  'brick',
  'nerve',
  'digital',
  'lawsuit',
  'describe',
  'lecture',
  'leopard',
  'figure',
  'season',
  'unaware',
  'sick',
];

const Recover: React.FC<Props> = props => {
  const {navigation} = props;
  const dispatch = useAppDispatch();
  const {t} = useTranslation('onboarding');

  const {rects, paddingHorizontal, titleLeft} = useScreenHeaderLayout();
  const headerFadeStyle = useScreenHeaderArrival();

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', e => {
      // Only reset if going back, not when navigating forward
      if (e.data.action.type === 'GO_BACK' || e.data.action.type === 'POP') {
        dispatch(resetSeedAction());
        dispatch(setRecoveryMode(false));
      }
    });

    return unsubscribe;
  }, [navigation, dispatch]);

  const skipWithDebugSeed = () => {
    dispatch(setSeedRecovery(debugSeed));
    navigation.navigate('Pin');
  };

  const attemptLogin = async (seed: string[]) => {
    await dispatch(setSeedRecovery(seed));
    navigation.navigate('Pin');
  };

  return (
    <LinearGradient style={styles.gradient} colors={['#1162E6', '#0F55C7']}>
      <CustomSafeAreaView
        styles={{...styles.safeArea}}
        edges={['top', 'bottom']}>
        <RecoveryField
          handleLogin={seed => attemptLogin(seed)}
          headerText={t('enter_seed')}
          headerTextPaddingHorizontal={titleLeft}
          isLitewalletRecovery={false}
          isScreenFocused={() => navigation.isFocused()}
        />
      </CustomSafeAreaView>
      <ScreenHeader
        rects={rects}
        paddingHorizontal={paddingHorizontal}
        titleKey="recover_wallet"
        titleDomain="onboarding"
        rightTextValue={__DEV__ ? 'skip' : undefined}
        onRightPress={__DEV__ ? skipWithDebugSeed : undefined}
        fadeStyle={headerFadeStyle}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
});

export default Recover;
