import React, {useState, useContext, useEffect} from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Platform,
  Text,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {RouteProp} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import {
  StackNavigationOptions,
  StackNavigationProp,
} from '@react-navigation/stack';
import {useTranslation} from 'react-i18next';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Clipboard from '@react-native-clipboard/clipboard';
import QRCode from 'react-native-qrcode-svg';
import SegmentedControl from '@react-native-segmented-control/segmented-control';

import Header from '../../components/Header';
import HeaderButton from '../../components/Buttons/HeaderButton';
import LoadingIndicator from '../../components/LoadingIndicator';
import SkeletonLines from '../../components/SkeletonLines';
import {useAppSelector} from '../../store/hooks';
import {decodeSeed} from '../../utils/aezeed';
import {bip32RootToBip84Account} from '../../utils/bip32';

import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

type RootStackParamList = {
  ExportElectrum: undefined;
};

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'ExportElectrum'>;
  route: RouteProp<RootStackParamList, 'ExportElectrum'>;
}

const ExportElectrum: React.FC<Props> = () => {
  const insets = useSafeAreaInsets();
  const {t} = useTranslation('settingsTab');

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const [electrumKey, setElectrumKey] = useState<string>('');
  const [isPrivateKey, setIsPrivateKey] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const seedArray = useAppSelector(state => state.onboarding!.seed);

  useEffect(() => {
    const deriveElectrumKey = async () => {
      if (seedArray && seedArray.length === 24) {
        setIsLoading(true);
        try {
          // Use setTimeout to allow UI to update before heavy computation
          await new Promise(resolve => setTimeout(resolve, 0));

          // Decode aezeed seed to get entropy
          const decoded = await decodeSeed(seedArray);

          // Get the root key in zprv format
          const bip32RootKey = decoded.bip32RootKeyXprv;

          // Convert to BIP84 account keys
          const bip84Keys = bip32RootToBip84Account(bip32RootKey, 0);

          if (isPrivateKey) {
            setElectrumKey(bip84Keys.accountXprv);
          } else {
            setElectrumKey(bip84Keys.accountXpub);
          }
        } catch (error) {
          console.error('Error deriving Electrum key:', error);
          setElectrumKey('Error deriving key');
        } finally {
          setIsLoading(false);
        }
      }
    };

    deriveElectrumKey();
  }, [seedArray, isPrivateKey]);

  const copyToClipboard = () => {
    Clipboard.setString(electrumKey);
    Alert.alert(t('copied'), t('key_copied_to_clipboard'), [
      {text: t('ok'), style: 'default'},
    ]);
  };

  return (
    <LinearGradient
      style={[
        styles.container,
        Platform.OS === 'android' ? {paddingBottom: insets.bottom} : null,
      ]}
      colors={['#F2F8FD', '#d2e1ef00']}>
      <Header />
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <TranslateText
            textKey="export_electrum_description"
            domain="settingsTab"
            textStyle={styles.descriptionText}
            maxSizeInPixels={SCREEN_HEIGHT * 0.018}
          />

          <View style={styles.controlsContainer}>
            <View style={styles.toggleContainer}>
              <TranslateText
                textKey="key_type"
                domain="settingsTab"
                textStyle={styles.toggleTitle}
                maxSizeInPixels={SCREEN_HEIGHT * 0.017}
              />
              <SegmentedControl
                values={['Private Key', 'Public Key']}
                selectedIndex={isPrivateKey ? 0 : 1}
                tintColor="#2C72FF"
                fontStyle={styles.toggleText}
                activeFontStyle={styles.activeToggleText}
                backgroundColor="#F8F9FA"
                onChange={event =>
                  setIsPrivateKey(event.nativeEvent.selectedSegmentIndex === 0)
                }
              />
            </View>
          </View>

          <View style={styles.qrContainer}>
            {!isLoading && electrumKey ? (
              <QRCode
                value={electrumKey}
                size={SCREEN_HEIGHT * 0.25}
                backgroundColor="white"
                color="black"
              />
            ) : (
              <View style={styles.qrSkeleton} />
            )}

            <LoadingIndicator visible={isLoading} noBlur tinted />
          </View>

          <View style={styles.addressContainer}>
            {!isLoading && electrumKey ? (
              <View style={styles.address}>
                <TouchableOpacity
                  style={styles.pressableContainer}
                  onPress={copyToClipboard}>
                  <Text style={styles.keyText} selectable numberOfLines={0}>
                    {electrumKey}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <SkeletonLines
                numberOfLines={3}
                shortLastLine
                lineHeight={SCREEN_HEIGHT * 0.022}
                lineGap={SCREEN_HEIGHT * 0.01}
              />
            )}
          </View>

          {isPrivateKey && !isLoading && electrumKey && (
            <View style={styles.warningContainer}>
              <TranslateText
                textKey="export_electrum_warning"
                domain="settingsTab"
                textStyle={styles.warningText}
                maxSizeInPixels={SCREEN_HEIGHT * 0.016}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F7F7F7',
    },
    scrollView: {
      flex: 1,
    },
    content: {
      padding: 20,
      gap: 20,
    },
    descriptionText: {
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      color: '#484859',
      fontSize: 15,
      paddingLeft: 18,
      textAlign: 'left',
    },
    toggleContainer: {
      flex: 1,
      gap: 8,
      paddingVertical: 10,
    },
    toggleTitle: {
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      color: '#484859',
      fontSize: 14,
    },
    toggleText: {
      color: '#484859',
      fontSize: screenHeight * 0.017,
      fontWeight: 'bold',
    },
    activeToggleText: {
      color: '#fff',
      fontSize: screenHeight * 0.017,
      fontWeight: 'bold',
    },
    pathContainer: {
      backgroundColor: '#F8F9FA',
      borderRadius: 8,
      padding: 12,
      borderLeftWidth: 3,
      borderLeftColor: '#2C72FF',
    },
    pathLabel: {
      fontFamily: 'Satoshi Variable',
      fontWeight: '700',
      color: '#484859',
      fontSize: 12,
      marginBottom: 4,
    },
    pathText: {
      fontFamily: 'Monaco',
      color: '#2C72FF',
      fontSize: 14,
      fontWeight: '600',
    },
    qrContainer: {
      backgroundColor: '#FEFEFE',
      borderWidth: 1,
      borderColor: 'rgba(217,217,217,0.45)',
      borderRadius: screenHeight * 0.012,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: screenHeight * 0.02,
      overflow: 'hidden',
      minHeight: screenHeight * 0.25 + 40,
    },
    qrSkeleton: {
      width: '100%',
      height: screenHeight * 0.25,
    },
    addressContainer: {
      width: '100%',
      height: 'auto',
    },
    address: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: screenHeight * 0.007,
    },
    pressableContainer: {
      flex: 1,
    },
    keyText: {
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      color: '#20BB74',
      fontSize: screenHeight * 0.022,
      lineHeight: screenHeight * 0.028,
    },
    controlsContainer: {
      gap: 12,
      marginBottom: 20,
    },
    warningContainer: {
      backgroundColor: '#FFF3CD',
      borderRadius: 8,
      padding: 16,
      borderLeftWidth: 4,
      borderLeftColor: '#FFC107',
    },
    warningText: {
      fontFamily: 'Satoshi Variable',
      fontWeight: '400',
      color: '#856404',
      fontSize: 14,
      lineHeight: 20,
    },
    headerTitle: {
      color: '#fff',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.026,
      fontStyle: 'normal',
      fontWeight: '700',
    },
  });

export const ExportElectrumNavigationOptions = (
  navigation: any,
): StackNavigationOptions => {
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  return {
    headerTitle: () => (
      <TranslateText
        textKey={'export_electrum'}
        domain={'settingsTab'}
        maxSizeInPixels={SCREEN_HEIGHT * 0.022}
        textStyle={styles.headerTitle}
        numberOfLines={1}
      />
    ),
    headerTitleAlign: 'left',
    headerTitleContainerStyle: {
      left: 7,
    },
    headerTransparent: true,
    headerTintColor: 'white',
    headerLeft: () => (
      <HeaderButton
        onPress={() => navigation.goBack()}
        imageSource={require('../../assets/images/back-icon.png')}
        leftPadding
      />
    ),
    headerLeftContainerStyle:
      Platform.OS === 'ios' && SCREEN_WIDTH >= 414 ? {marginStart: -5} : null,
    headerRightContainerStyle:
      Platform.OS === 'ios' && SCREEN_WIDTH >= 414 ? {marginEnd: -5} : null,
  };
};

export default ExportElectrum;
