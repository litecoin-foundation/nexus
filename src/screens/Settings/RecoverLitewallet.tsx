import React, {useEffect, useState} from 'react';
import {StyleSheet, SafeAreaView, Platform, Alert} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {StackNavigationProp} from '@react-navigation/stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import HeaderButton from '../../components/Buttons/HeaderButton';
import RecoveryField from '../../components/RecoveryField';
import LoadingIndicator from '../../components/LoadingIndicator';
import TranslateText from '../../components/TranslateText';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {sweepLitewallet} from '../../lib/utils/sweep';
import {getAddress} from '../../reducers/address';
import {publishTransaction} from '../../reducers/transaction';
import {useTranslation} from 'react-i18next';

type RootStackParamList = {
  Import: {
    scanData?: string;
  };
  ImportSuccess: {
    txHash: string;
  };
};

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'Import'>;
  navigationOptions: any;
}

const RecoverLitewallet: React.FC<Props> = props => {
  const {navigation} = props;
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const {address} = useAppSelector(state => state.address);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    dispatch(getAddress());
  }, [dispatch]);

  const {t} = useTranslation('settingsTab');

  const handleLWRecovery = async (seed: string[]) => {
    setLoading(true);
    try {
      const rawTxs = await sweepLitewallet(seed, address);
      rawTxs.map(rawTx => {
        rawTx.map(async (tx: string) => {
          await publishTransaction(tx);
        });
      });

      setLoading(false);
      navigation.replace('ImportSuccess', {
        txHash: t('litewallet_success'),
      });
    } catch (error: any) {
      setLoading(false);
      Alert.alert(String(error.message));
    }
  };

  return (
    <>
      <LinearGradient
        colors={['#1162E6', '#0F55C7']}
        style={Platform.OS === 'android' ? {paddingTop: insets.top} : null}>
        <SafeAreaView>
          <RecoveryField
            handleLogin={() => {}}
            headerText={t('litewallet_description')}
            isLitewalletRecovery={true}
            handleLWRecovery={seed => handleLWRecovery(seed)}
          />
        </SafeAreaView>
      </LinearGradient>

      <LoadingIndicator visible={loading} />
    </>
  );
};

const styles = StyleSheet.create({
  activity: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    backgroundColor: 'rgba(10,10,10,0.8)',
    height: 100,
    width: 100,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Satoshi Variable',
    fontStyle: 'normal',
    fontWeight: '700',
    color: 'white',
    fontSize: 17,
  },
});

export const RecoverLitewalletNavigationOptions = (navigation: any) => {
  return {
    headerTitle: () => (
      <TranslateText
        textKey="import_litewallet"
        domain="settingsTab"
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
      />
    ),
  };
};

export default RecoverLitewallet;
