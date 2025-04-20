import React, {useEffect, useState, useContext} from 'react';
import {
  StyleSheet,
  SafeAreaView,
  Platform,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {StackNavigationProp} from '@react-navigation/stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import HeaderButton from '../../components/Buttons/HeaderButton';
import RecoveryField from '../../components/RecoveryField';
import LoadingIndicator from '../../components/LoadingIndicator';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {sweepLitewallet} from '../../lib/utils/sweep';
import {getAddress} from '../../reducers/address';
import {publishTransaction} from '../../reducers/transaction';
import {useTranslation} from 'react-i18next';

import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

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
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();

  const {address} = useAppSelector(state => state.address);

  const [loading, setLoading] = useState(false);

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

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
        style={[
          styles.container,
          Platform.OS === 'android' && {
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          },
        ]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 40}>
          <SafeAreaView style={styles.flex}>
            <RecoveryField
              handleLogin={() => {}}
              headerText={t('litewallet_description')}
              isLitewalletRecovery={true}
              handleLWRecovery={seed => handleLWRecovery(seed)}
            />
          </SafeAreaView>
        </KeyboardAvoidingView>
      </LinearGradient>

      <LoadingIndicator visible={loading} />
    </>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    activity: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
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
    flex: {
      flex: 1,
    },
  });

export const RecoverLitewalletNavigationOptions = (navigation: any) => {
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  return {
    headerTitle: () => (
      <TranslateText
        textKey="import_litewallet"
        domain="settingsTab"
        maxSizeInPixels={SCREEN_HEIGHT * 0.022}
        textStyle={styles.headerTitle}
        numberOfLines={1}
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
