import React, {useState, useContext, useMemo, useEffect} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  FlatList,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import {DrawerContentComponentProps} from '@react-navigation/drawer';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {ErrorView} from '../GiftCardShop/ErrorView';
import {
  logoutFromNexusShop,
  setUserCountry,
  setCountryPickerOpen,
} from '../../reducers/nexusshopaccount';
import HeaderButton from '../../components/Buttons/HeaderButton';
import OptionCell from '../../components/Cells/OptionCell';
import countries from '../../assets/countries';
import LinearGradient from 'react-native-linear-gradient';
import {SafeAreaView} from 'react-native-safe-area-context';

import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';
import WhiteButton from '../Buttons/WhiteButton';
import CustomSafeAreaView from '../CustomSafeAreaView';
import StatCard from '../Cards/StatCard';

const backIcon = require('../../assets/images/back-icon.png');

// Helper function to format member since date
const formatMemberSince = (timestamp: number): string => {
  if (!timestamp) return 'Recently';
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
};

// Helper function to get country name from code
const getCountryName = (code: string): string => {
  const country = countries.find(c => c.code === code);
  return country?.name || code;
};

const ShopAccountDrawerContent: React.FC<
  DrawerContentComponentProps
> = props => {
  const dispatch = useAppDispatch();
  const account = useAppSelector(
    (state: any) => state.nexusshopaccount.account,
  );
  const giftCards = useAppSelector(
    (state: any) => state.nexusshopaccount.giftCards,
  );
  const wishlistBrands = useAppSelector(
    (state: any) => state.nexusshopaccount.wishlistBrands || [],
  );
  const loading = useAppSelector(
    (state: any) => state.nexusshopaccount.loading,
  );

  const shopUserEmail = account && account.email;
  const isLoggedIn = account && account.isLoggedIn;
  const numberOfCards = giftCards.length;
  const numberOfWishlistBrands = wishlistBrands.length;
  const memberSince = account?.registrationDate;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = useMemo(
    () => getStyles(SCREEN_WIDTH, SCREEN_HEIGHT),
    [SCREEN_WIDTH, SCREEN_HEIGHT],
  );

  const shopCountry = account?.userCountry || 'US';
  const [showCountryModal, setShowCountryModal] = useState(false);
  const slideAnim = useSharedValue(0);

  // Reset country picker state when component mounts
  useEffect(() => {
    dispatch(setCountryPickerOpen(false));
  }, [dispatch]);

  // Cleanup: ensure drawer toggle button reappears when drawer closes
  useEffect(() => {
    return () => {
      dispatch(setCountryPickerOpen(false));
    };
  }, [dispatch]);

  const handleCountrySelect = (code: string) => {
    dispatch(setUserCountry(code));
    closeCountryPicker();
  };

  const openCountryPicker = () => {
    setShowCountryModal(true);
    dispatch(setCountryPickerOpen(true));
    slideAnim.value = withTiming(1, {
      duration: 350,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  };

  const closeCountryPicker = () => {
    dispatch(setCountryPickerOpen(false));
    slideAnim.value = withTiming(
      0,
      {
        duration: 350,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      },
      finished => {
        if (finished) {
          runOnJS(setShowCountryModal)(false);
        }
      },
    );
  };

  // Animated styles for main content
  const mainContentStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: slideAnim.value * -SCREEN_WIDTH,
        },
      ],
      opacity: 1 - slideAnim.value * 0.3,
    };
  });

  // Animated styles for country picker
  const countryPickerStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: (1 - slideAnim.value) * SCREEN_WIDTH,
        },
      ],
    };
  });

  const toSignUp = () => {
    props.navigation.closeDrawer();
    props.navigation
      .getParent()
      ?.navigate('NexusShopStack', {screen: 'SignUp'});
  };

  const logout = () => {
    dispatch(logoutFromNexusShop());
  };

  // Loading state
  if (loading) {
    return (
      <LinearGradient style={styles.container} colors={['#1162E6', '#0F55C7']}>
        <SafeAreaView style={styles.loadingContainer} edges={['top', 'bottom']}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Not logged in state
  if (!isLoggedIn || !account) {
    return (
      <View style={styles.notLoggedInContainer}>
        <SafeAreaView style={styles.errorContainer} edges={['top', 'bottom']}>
          <ErrorView
            message="Sign in to Nexus Shop account"
            onRetry={toSignUp}
            onRetryText="Sign In"
          />
        </SafeAreaView>
      </View>
    );
  }

  // Main render - logged in state
  return (
    <LinearGradient style={styles.container} colors={['#1162E6', '#0F55C7']}>
      <View style={styles.outerContainer}>
        {/* Main Content - Animated */}
        <Animated.View style={[styles.animatedContainer, mainContentStyle]}>
          <SafeAreaView style={styles.safeAreaContent} edges={['top']}>
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              scrollEnabled={!showCountryModal}>
              {/* Nexus Shop Title */}
              <View style={styles.titleContainer}>
                <TranslateText
                  textValue="Nexus Shop"
                  maxSizeInPixels={SCREEN_HEIGHT * 0.03}
                  textStyle={styles.title}
                  numberOfLines={1}
                />
              </View>

              {/* Account Info Section */}
              <View style={styles.accountInfoSection}>
                {/* Email */}
                <View style={styles.infoRow}>
                  <TranslateText
                    textKey="email"
                    domain="nexusShop"
                    maxSizeInPixels={SCREEN_HEIGHT * 0.014}
                    textStyle={styles.label}
                    numberOfLines={1}
                  />
                  <TranslateText
                    textValue={shopUserEmail || 'Not available'}
                    maxSizeInPixels={SCREEN_HEIGHT * 0.018}
                    textStyle={styles.value}
                    numberOfLines={1}
                  />
                </View>

                {/* Member Since */}
                <View style={styles.infoRow}>
                  <TranslateText
                    textValue="MEMBER SINCE"
                    maxSizeInPixels={SCREEN_HEIGHT * 0.014}
                    textStyle={styles.label}
                    numberOfLines={1}
                  />
                  <TranslateText
                    textValue={formatMemberSince(memberSince)}
                    maxSizeInPixels={SCREEN_HEIGHT * 0.018}
                    textStyle={styles.value}
                    numberOfLines={1}
                  />
                </View>
              </View>

              {/* Stats Section */}
              <View style={styles.statsSection}>
                <StatCard label="Purchased Cards" value={numberOfCards} />
                <View style={styles.statsSpacer} />
                <StatCard label="Wishlist" value={numberOfWishlistBrands} />
              </View>

              {/* Region Selector */}
              <View style={styles.regionSection}>
                <TranslateText
                  textKey="region"
                  domain="nexusShop"
                  maxSizeInPixels={SCREEN_HEIGHT * 0.014}
                  textStyle={styles.label}
                  numberOfLines={1}
                />
                <TouchableOpacity
                  style={styles.regionButton}
                  onPress={openCountryPicker}
                  activeOpacity={0.7}>
                  <Text style={styles.regionText}>
                    {getCountryName(shopCountry)}
                  </Text>
                  <Image
                    source={backIcon}
                    style={[
                      styles.chevronIcon,
                      {transform: [{rotate: '-90deg'}]},
                    ]}
                  />
                </TouchableOpacity>
              </View>
            </ScrollView>

            {/* Sign Out Button (Fixed to Bottom) */}
            <View style={styles.bottomContainer}>
              <CustomSafeAreaView
                styles={styles.buttonContainer}
                edges={['bottom']}>
                <WhiteButton
                  value="Sign Out"
                  onPress={logout}
                  small={false}
                  disabled={false}
                  active={true}
                />
              </CustomSafeAreaView>
            </View>
          </SafeAreaView>
        </Animated.View>

        {/* Country Picker - Animated (slides in from right) */}
        {showCountryModal && (
          <Animated.View
            style={[styles.countryPickerContainer, countryPickerStyle]}>
            <SafeAreaView style={styles.safeAreaContent} edges={['top']}>
              <View style={styles.pickerHeader}>
                <HeaderButton
                  onPress={closeCountryPicker}
                  imageSource={backIcon}
                  leftPadding
                />
              </View>
              <FlatList
                data={countries}
                keyExtractor={item => item.code}
                renderItem={({item}) => (
                  <OptionCell
                    title={item.name}
                    onPress={() => handleCountrySelect(item.code)}
                    selected={shopCountry === item.code}
                  />
                )}
                contentContainerStyle={styles.listContainer}
              />
            </SafeAreaView>
          </Animated.View>
        )}
      </View>
    </LinearGradient>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    notLoggedInContainer: {
      flex: 1,
      backgroundColor: '#fff',
    },
    outerContainer: {
      flex: 1,
      overflow: 'hidden',
    },
    safeAreaContent: {
      flex: 1,
    },
    animatedContainer: {
      position: 'absolute',
      width: '100%',
      height: '100%',
    },
    countryPickerContainer: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      backgroundColor: 'transparent',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorContainer: {
      flex: 1,
      padding: screenWidth * 0.05,
    },
    pickerHeader: {
      paddingLeft: 0,
      paddingRight: screenWidth * 0.05,
      paddingTop: screenHeight * 0.02,
      paddingBottom: screenHeight * 0.015,
      flexDirection: 'row',
      alignItems: 'center',
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: screenWidth * 0.05,
      paddingBottom: screenHeight * 0.12, // Extra padding for fixed button at bottom
    },
    titleContainer: {
      alignItems: 'flex-start',
      paddingTop: screenHeight * 0.02,
      paddingBottom: screenHeight * 0.025,
    },
    title: {
      color: 'rgba(255, 255, 255, 0.5)',
      fontSize: screenHeight * 0.03,
      fontWeight: '700',
      fontFamily: 'Satoshi Variable',
      letterSpacing: 0.5,
    },
    accountInfoSection: {
      marginBottom: screenHeight * 0.025,
    },
    infoRow: {
      marginBottom: screenHeight * 0.02,
    },
    label: {
      color: 'rgba(255, 255, 255, 0.7)',
      fontSize: screenHeight * 0.014,
      fontWeight: '600',
      fontFamily: 'Satoshi Variable',
      textTransform: 'uppercase',
      marginBottom: screenHeight * 0.005,
    },
    value: {
      color: '#FFFFFF',
      fontSize: screenHeight * 0.018,
      fontWeight: '700',
      fontFamily: 'Satoshi Variable',
    },
    statsSection: {
      flexDirection: 'row',
      marginBottom: screenHeight * 0.025,
    },
    statsSpacer: {
      width: screenWidth * 0.03,
    },
    regionSection: {
      marginBottom: screenHeight * 0.025,
    },
    regionButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: screenHeight * 0.015,
      paddingHorizontal: screenWidth * 0.04,
      paddingVertical: screenHeight * 0.018,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: screenHeight * 0.01,
    },
    regionText: {
      color: '#FFFFFF',
      fontSize: screenHeight * 0.018,
      fontWeight: '700',
      fontFamily: 'Satoshi Variable',
      flex: 1,
    },
    chevronIcon: {
      width: screenWidth * 0.05,
      height: screenWidth * 0.05,
      tintColor: 'rgba(255, 255, 255, 0.5)',
      resizeMode: 'contain',
    },
    bottomContainer: {
      position: 'absolute',
      bottom: 0,
      width: '100%',
      paddingHorizontal: screenWidth * 0.05,
    },
    buttonContainer: {
      width: '100%',
    },
    listContainer: {
      paddingBottom: screenHeight * 0.02,
    },
  });

export default ShopAccountDrawerContent;
