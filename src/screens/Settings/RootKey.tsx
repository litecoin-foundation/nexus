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
import {decodeSeed} from '../../lib/utils/aezeed';

import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

type RootStackParamList = {
  RootKey: undefined;
};

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'RootKey'>;
  route: RouteProp<RootStackParamList, 'RootKey'>;
}

const RootKey: React.FC<Props> = props => {
  const {navigation} = props;
  const insets = useSafeAreaInsets();
  const {t} = useTranslation('settingsTab');

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const [selectedFormat, setSelectedFormat] = useState<number>(0); // 0 = Litecoin, 1 = Bitcoin
  const [rootKey, setRootKey] = useState<string>('');
  const [isPrivateKey, setIsPrivateKey] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const seedArray = useAppSelector(state => state.onboarding!.seed);

  useEffect(() => {
    const deriveRootKey = async () => {
      if (seedArray && seedArray.length === 24) {
        setIsLoading(true);
        try {
          // Use setTimeout to allow UI to update before heavy computation
          await new Promise(resolve => setTimeout(resolve, 0));

          // Decode aezeed seed to get entropy
          const decoded = await decodeSeed(seedArray);

          let selectedRootKey;

          if (selectedFormat === 0) {
            // Litecoin format (Ltpv/Ltub)
            selectedRootKey = decoded.bip32RootKey;
          } else {
            // Bitcoin format (xprv/xpub)
            selectedRootKey = decoded.bip32RootKeyXprv;
          }

          if (isPrivateKey) {
            setRootKey(selectedRootKey.toBase58());
          } else {
            setRootKey(selectedRootKey.neutered().toBase58());
          }
        } catch (error) {
          console.error('Error deriving root key:', error);
          setRootKey('Error deriving key');
        } finally {
          setIsLoading(false);
        }
      }
    };

    deriveRootKey();
  }, [seedArray, selectedFormat, isPrivateKey]);

  const copyToClipboard = () => {
    Clipboard.setString(rootKey);
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
            textKey="root_key_description"
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

            <View style={styles.toggleContainer}>
              <TranslateText
                textKey="key_format"
                domain="settingsTab"
                textStyle={styles.toggleTitle}
                maxSizeInPixels={SCREEN_HEIGHT * 0.017}
              />
              <SegmentedControl
                values={isPrivateKey ? ['Ltpv', 'xprv'] : ['Ltub', 'xpub']}
                selectedIndex={selectedFormat}
                tintColor="#2C72FF"
                fontStyle={styles.toggleText}
                activeFontStyle={styles.activeToggleText}
                backgroundColor="#F8F9FA"
                onChange={event =>
                  setSelectedFormat(event.nativeEvent.selectedSegmentIndex)
                }
              />
            </View>
          </View>

          <View style={styles.qrContainer}>
            {!isLoading && rootKey ? (
              <QRCode
                value={rootKey}
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
            {!isLoading && rootKey ? (
              <View style={styles.address}>
                <TouchableOpacity
                  style={styles.pressableContainer}
                  onPress={copyToClipboard}>
                  <Text style={styles.keyText} selectable numberOfLines={0}>
                    {rootKey}
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

          {isPrivateKey && !isLoading && rootKey && (
            <View style={styles.warningContainer}>
              <TranslateText
                textKey="root_key_warning"
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

export const RootKeyNavigationOptions = (
  navigation: any,
): StackNavigationOptions => {
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  return {
    headerTitle: () => (
      <TranslateText
        textKey={'root_key'}
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
      />
    ),
  };
};

export default RootKey;
