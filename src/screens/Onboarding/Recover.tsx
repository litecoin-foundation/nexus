import React, {useEffect} from 'react';
import {Platform, SafeAreaView, StyleSheet} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {StackNavigationProp} from '@react-navigation/stack';

import TranslateText from '../../components/TranslateText';
import RecoveryField from '../../components/RecoveryField';
import HeaderButton from '../../components/Buttons/HeaderButton';
import {setSeedRecovery} from '../../reducers/onboarding';
import {useAppDispatch} from '../../store/hooks';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';

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
  const insets = useSafeAreaInsets();
  const {t} = useTranslation('onboarding');

  useEffect(() => {
    if (__DEV__) {
      navigation.setOptions({
        // eslint-disable-next-line react/no-unstable-nested-components
        headerRight: () => (
          <HeaderButton
            title="skip"
            onPress={() => {
              dispatch(setSeedRecovery(debugSeed));
              navigation.navigate('Pin');
            }}
            rightPadding={true}
          />
        ),
      });
    }
  });

  const attemptLogin = async (seed: string[]) => {
    await dispatch(setSeedRecovery(seed));
    navigation.navigate('Pin');
  };

  return (
    <LinearGradient
      colors={['#1162E6', '#0F55C7']}
      style={Platform.OS === 'android' ? {paddingTop: insets.top} : null}>
      <SafeAreaView>
        <RecoveryField
          handleLogin={seed => attemptLogin(seed)}
          headerText={t('enter_seed')}
          isLitewalletRecovery={false}
        />
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  headerTitle: {
    fontFamily: 'Satoshi Variable',
    fontStyle: 'normal',
    fontWeight: '700',
    color: 'white',
    fontSize: 17,
  },
});

export const RecoverNavigationOptions = (navigation: any) => {
  return {
    headerTitle: () => (
      <TranslateText
        textKey="recover_wallet"
        domain="onboarding"
        textStyle={styles.headerTitle}
      />
    ),
    headerTitleAlign: 'left',
    headerTransparent: true,
    headerTintColor: 'white',
    headerLeft: () => (
      <HeaderButton
        onPress={() => navigation.goBack()}
        imageSource={require('../../assets/images/back-icon.png')}
        title="Back"
      />
    ),
  };
};

export default Recover;
