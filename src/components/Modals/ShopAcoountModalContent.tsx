import React, {useState, useContext, useMemo} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  FlatList,
  Image,
} from 'react-native';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {ErrorView} from '../GiftCardShop/ErrorView';
import {getCommonStyles} from '../GiftCardShop/theme';
import {
  logoutFromNexusShop,
  setUserCurrency,
} from '../../reducers/nexusshopaccount';
import HeaderButton from '../../components/Buttons/HeaderButton';
import OptionCell from '../../components/Cells/OptionCell';
import fiat from '../../assets/fiat';

import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

const backIcon = require('../../assets/images/back-icon.png');

interface Props {
  navigation: any;
}

// NOTE: we can filter currencies specifically for the shop by
// specifying this array instead of showing all currencies from assets/fiat
// const SHOP_CURRENCIES = ['USD', 'CAD', 'AUD', 'EUR', 'GBP'];
const SHOP_CURRENCIES = fiat.map((item: any) => item.key);

const ShopAcoountModalContent: React.FC<Props> = props => {
  const {navigation} = props;
  const dispatch = useAppDispatch();
  const account = useAppSelector(
    (state: any) => state.nexusshopaccount.account,
  );
  const giftCards = useAppSelector(
    (state: any) => state.nexusshopaccount.giftCards,
  );
  const shopUserEmail = account && account.email;
  const isLoggedIn = account && account.isLoggedIn;
  const giftCardsCounter = giftCards ? String(giftCards.length) : 'unfound';

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = useMemo(
    () => getStyles(SCREEN_WIDTH, SCREEN_HEIGHT),
    [SCREEN_WIDTH, SCREEN_HEIGHT],
  );
  const commonStyles = getCommonStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const shopCurrency = account?.userCurrency || 'USD';
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  const shopFiat = useMemo(
    () => fiat.filter((item: any) => SHOP_CURRENCIES.includes(item.key)),
    [],
  );

  const handleCurrencySelect = (code: string) => {
    dispatch(setUserCurrency(code));
    setShowCurrencyPicker(false);
  };

  const toSignUp = () => {
    navigation.navigate('NexusShopStack', {screen: 'SignUp'});
  };

  const logout = () => {
    dispatch(logoutFromNexusShop());
  };

  if (showCurrencyPicker) {
    return (
      <View style={styles.container}>
        <View style={styles.currencyPickerHeader}>
          <HeaderButton
            onPress={() => setShowCurrencyPicker(false)}
            imageSource={require('../../assets/images/back-icon.png')}
            backgroundColorSpecified="#0070F0"
          />
        </View>
        <FlatList
          data={shopFiat}
          keyExtractor={(item: any) => item.key}
          renderItem={({item}: {item: any}) => (
            <OptionCell
              title={`${item.name} (${item.symbol_native})`}
              key={item.key}
              onPress={() => handleCurrencySelect(item.key)}
              selected={shopCurrency === item.key}
            />
          )}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isLoggedIn ? (
        <View style={styles.accountContainer}>
          <View style={styles.optionContainer}>
            <TranslateText
              textKey="email"
              domain="nexusShop"
              maxSizeInPixels={SCREEN_HEIGHT * 0.022}
              textStyle={styles.title}
              numberOfLines={1}
            />
            <TranslateText
              textValue={shopUserEmail ? shopUserEmail : 'unfound'}
              maxSizeInPixels={SCREEN_HEIGHT * 0.022}
              textStyle={styles.value}
              numberOfLines={1}
            />
          </View>
          <View style={styles.optionContainer}>
            <TranslateText
              textKey="active_cards"
              domain="nexusShop"
              maxSizeInPixels={SCREEN_HEIGHT * 0.022}
              textStyle={styles.title}
              numberOfLines={1}
            />
            <TranslateText
              textValue={giftCardsCounter}
              maxSizeInPixels={SCREEN_HEIGHT * 0.022}
              textStyle={styles.value}
              numberOfLines={1}
            />
          </View>
          <View style={styles.optionContainer}>
            <TranslateText
              textKey="currency"
              domain="nexusShop"
              maxSizeInPixels={SCREEN_HEIGHT * 0.022}
              textStyle={styles.title}
              numberOfLines={1}
            />
            <TouchableOpacity
              style={styles.currencyButton}
              onPress={() => setShowCurrencyPicker(true)}
              activeOpacity={0.7}>
              <Text style={styles.currencyTitle}>{shopCurrency}</Text>
              <Image
                source={backIcon}
                style={[styles.chevronIcon, {transform: [{rotate: '-90deg'}]}]}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.nexusTitleAbsoluteContainer}>
            <TranslateText
              textValue="NEXUS SHOP"
              maxSizeInPixels={SCREEN_HEIGHT * 0.04}
              textStyle={styles.nexusTitle}
              numberOfLines={1}
            />
          </View>
          <View style={styles.logoutButtonContainer}>
            <TouchableOpacity
              style={[commonStyles.buttonRounded, styles.logoutButton]}
              onPress={logout}>
              <TranslateText
                textKey="logout"
                domain="nexusShop"
                maxSizeInPixels={SCREEN_HEIGHT * 0.018}
                textStyle={commonStyles.buttonText}
                numberOfLines={1}
              />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.signInContainer}>
          <ErrorView
            message={'Sign in to Nexus Shop account'}
            onRetry={toSignUp}
            onRetryText={'Sign In'}
          />
        </View>
      )}
    </View>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
    },
    accountContainer: {
      flex: 1,
      paddingTop: screenHeight * 0.1,
      paddingBottom: screenWidth * 0.04,
      paddingHorizontal: screenWidth * 0.04,
    },
    signInContainer: {
      flex: 1,
      padding: screenWidth * 0.04,
    },
    optionContainer: {
      width: '100%',
      flexDirection: 'column',
      justifyContent: 'center',
      marginBottom: screenHeight * 0.02,
    },
    title: {
      color: '#0070F0',
      fontSize: screenHeight * 0.022,
      fontWeight: '600',
      textTransform: 'uppercase',
    },
    value: {
      color: '#000',
      fontSize: screenHeight * 0.022,
      fontWeight: '600',
      marginTop: screenHeight * 0.005,
    },
    nexusTitleContainer: {
      alignItems: 'center',
      paddingTop: screenHeight * 0.18,
    },
    nexusTitleAbsoluteContainer: {
      position: 'absolute',
      top: screenWidth * 0.025,
      left: screenWidth * 0.035,
    },
    nexusTitle: {
      color: '#d4d4d44f',
      fontSize: screenHeight * 0.04,
      fontWeight: '700',
    },
    logoutButtonContainer: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    logoutButton: {
      borderRadius: screenHeight * 0.01,
    },
    currencyPickerHeader: {
      height: screenHeight * 0.07,
      flexDirection: 'row',
      paddingTop: screenWidth * 0.01,
      paddingHorizontal: screenWidth * 0.01,
    },
    currencyButton: {
      width: screenWidth * 0.3,
      height: screenWidth * 0.12,
      borderWidth: 1,
      borderColor: '#ccc',
      backgroundColor: '#fff',
      flexDirection: 'row',
      gap: screenWidth * 0.03,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: screenHeight * 0.012,
      marginTop: screenHeight * 0.01,
    },
    currencyTitle: {
      color: '#000',
      fontSize: screenHeight * 0.022,
      fontWeight: '600',
    },
    chevronIcon: {
      width: screenWidth * 0.05,
      height: screenWidth * 0.05,
      tintColor: '#ccc',
      resizeMode: 'contain',
    },
  });

export default ShopAcoountModalContent;
