import React, {useState, useContext} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';
import {
  StackNavigationOptions,
  StackNavigationProp,
} from '@react-navigation/stack';
import {RouteProp} from '@react-navigation/native';

import HeaderButton from '../../components/Buttons/HeaderButton';
import WarningModal from '../../components/Modals/WarningModal';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {setLitecoinBackend} from '../../reducers/settings';
import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

type RootStackParamList = {
  LitecoinBackend: undefined;
  Settings: {updateHeader?: boolean};
};

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'LitecoinBackend'>;
  route: RouteProp<RootStackParamList, 'LitecoinBackend'>;
}

const LitecoinBackend: React.FC<Props> = props => {
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const dispatch = useAppDispatch();
  const {t} = useTranslation('settingsTab');
  const litecoinBackend = useAppSelector(
    state => state.settings!.litecoinBackend,
  );

  const [showRestartModal, setShowRestartModal] = useState(false);

  const handleBackendChange = (backend: 'neutrino' | 'electrum') => {
    if (backend !== litecoinBackend) {
      dispatch(setLitecoinBackend(backend));
      setShowRestartModal(true);
    }
  };

  return (
    <LinearGradient colors={['#1162E6', '#0F55C7']} style={styles.container}>
      <View style={styles.contentContainer}>
        <View style={styles.headerSection}>
          <Text style={styles.descriptionText}>
            {t('litecoin_backend_description')}
          </Text>
        </View>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.cardContainer}
            onPress={() => handleBackendChange('neutrino')}
            activeOpacity={0.7}>
            <View style={styles.internalCardContainer}>
              <View style={styles.cardImageContainer}>
                <Image
                  source={require('../../assets/icons/disguise-icon.png')}
                  style={styles.cardImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.cardTitle}>{t('neutrino_backend')}</Text>
              <Text style={styles.cardDescription} numberOfLines={4}>
                {t('neutrino_description')}
              </Text>
              {litecoinBackend === 'neutrino' && (
                <View style={styles.selectedIndicator}>
                  <Image
                    source={require('../../assets/images/checkBlue.png')}
                    style={styles.checkmarkIcon}
                    resizeMode="contain"
                  />
                </View>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cardContainer}
            onPress={() => handleBackendChange('electrum')}
            activeOpacity={0.7}>
            <View style={styles.internalCardContainer}>
              <View style={styles.cardImageContainer}>
                <Image
                  source={require('../../assets/images/electrum.png')}
                  style={styles.cardImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.cardTitle}>{t('electrum_backend')}</Text>
              <Text style={styles.cardDescription} numberOfLines={4}>
                {t('electrum_description')}
              </Text>
              {litecoinBackend === 'electrum' && (
                <View style={styles.selectedIndicator}>
                  <Image
                    source={require('../../assets/images/checkBlue.png')}
                    style={styles.checkmarkIcon}
                    resizeMode="contain"
                  />
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <WarningModal
        isVisible={showRestartModal}
        close={() => setShowRestartModal(false)}
        textDomain="settingsTab"
        textKey="restart_required_message"
      />
    </LinearGradient>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
    },
    contentContainer: {
      flex: 1,
      width: '100%',
      paddingTop: screenHeight * 0.12,
      paddingHorizontal: screenWidth * 0.06,
    },
    headerSection: {
      marginBottom: screenHeight * 0.04,
    },
    titleText: {
      color: '#fff',
      fontSize: screenHeight * 0.032,
      fontFamily: 'Satoshi Variable',
      fontWeight: '700',
      marginBottom: screenHeight * 0.015,
      textAlign: 'center',
    },
    descriptionText: {
      color: '#E0E0E0',
      fontSize: screenHeight * 0.018,
      fontFamily: 'Satoshi Variable',
      fontWeight: '500',
      textAlign: 'center',
      lineHeight: screenHeight * 0.024,
      paddingTop: 10,
    },
    buttonsContainer: {
      flexDirection: 'column',
      justifyContent: 'space-between',
      marginTop: screenHeight * 0.02,
      gap: 20,
      alignSelf: 'center',
    },
    cardContainer: {
      height: screenHeight * 0.28,
      width: screenWidth - 60,
      borderRadius: screenHeight * 0.02,
      backgroundColor: '#fff',
      shadowColor: 'rgb(82,84,103);',
      shadowOpacity: 0.12,
      shadowRadius: screenHeight * 0.015,
      elevation: screenHeight * 0.015,
      shadowOffset: {
        height: 0,
        width: 0,
      },
      textAlign: 'center',
      alignContent: 'center',
    },
    internalCardContainer: {
      paddingLeft: screenHeight * 0.025,
      paddingRight: screenHeight * 0.025,
      paddingTop: screenHeight * 0.025,
    },
    cardImageContainer: {
      width: '100%',
      height: screenHeight * 0.08,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    cardImage: {
      width: screenHeight * 0.06,
      height: screenHeight * 0.06,
    },
    cardTitle: {
      fontSize: screenHeight * 0.022,
      fontWeight: '700',
      color: '#333',
      marginBottom: 8,
      textAlign: 'center',
      fontFamily: 'Satoshi Variable',
    },
    cardDescription: {
      fontSize: screenHeight * 0.016,
      color: '#666',
      lineHeight: screenHeight * 0.022,
      textAlign: 'center',
      fontFamily: 'Satoshi Variable',
    },
    selectedIndicator: {
      position: 'absolute',
      top: 12,
      right: 12,
      width: 24,
      height: 24,
      backgroundColor: '#2C72FF',
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkmarkIcon: {
      width: 14,
      height: 14,
      tintColor: '#fff',
    },
    headerTitle: {
      color: '#fff',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.026,
      fontStyle: 'normal',
      fontWeight: '700',
    },
  });

export const LitecoinBackendNavigationOptions = (
  navigation: any,
): StackNavigationOptions => {
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  return {
    headerTitle: () => (
      <TranslateText
        textKey="litecoin_backend"
        domain="settingsTab"
        maxSizeInPixels={SCREEN_HEIGHT * 0.022}
        textStyle={styles.headerTitle}
        numberOfLines={1}
      />
    ),
    headerTitleAlign: 'left',
    headerTitleContainerStyle: {left: 7},
    headerTransparent: true,
    headerTintColor: 'white',
    headerLeft: () => (
      <HeaderButton
        onPress={() => navigation.popTo('Settings', {updateHeader: true})}
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

export default LitecoinBackend;
