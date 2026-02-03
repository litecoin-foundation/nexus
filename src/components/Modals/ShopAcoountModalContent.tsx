import React, {useState, useContext, useMemo} from 'react';
import {View, StyleSheet, TouchableOpacity, Text} from 'react-native';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {ErrorView} from '../GiftCardShop/ErrorView';
import {getCommonStyles} from '../GiftCardShop/theme';
import {logoutFromNexusShop} from '../../reducers/nexusshopaccount';

import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

interface Props {
  navigation: any;
}

const SHOP_CURRENCIES = ['USD', 'CAD', 'AUD', 'EUR', 'GBP'];

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

  const [shopCurrency, setShopCurrency] = useState('USD');

  const toSignUp = () => {
    navigation.navigate('NexusShopStack', {screen: 'SignUp'});
  };

  const logout = () => {
    dispatch(logoutFromNexusShop());
  };

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
            <View style={styles.currenciesRow}>
              {SHOP_CURRENCIES.map(currencyItem => (
                <TouchableOpacity
                  key={currencyItem}
                  style={[
                    styles.currencyButton,
                    shopCurrency === currencyItem &&
                      styles.currencyButtonSelected,
                  ]}
                  onPress={() => setShopCurrency(currencyItem)}
                  activeOpacity={0.7}>
                  <Text
                    style={[
                      styles.currencyText,
                      shopCurrency === currencyItem &&
                        styles.currencyTextSelected,
                    ]}>
                    {currencyItem}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.nexusTitleContainer}>
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
      paddingTop: screenHeight * 0.05,
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
    currenciesRow: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: screenHeight * 0.01,
    },
    currencyButton: {
      minWidth: screenWidth * 0.15,
      minHeight: screenWidth * 0.12,
      borderWidth: 1,
      borderColor: '#F2F2F7',
      backgroundColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: screenHeight * 0.012,
    },
    currencyButtonSelected: {
      backgroundColor: '#0070F0',
      borderColor: '#0070F0',
    },
    currencyText: {
      fontSize: screenHeight * 0.017,
      fontWeight: '500',
      color: '#000',
    },
    currencyTextSelected: {
      color: '#fff',
    },
    nexusTitleContainer: {
      alignItems: 'center',
      paddingTop: screenHeight * 0.18,
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
  });

export default ShopAcoountModalContent;
