import React, {useContext, useMemo, useState, useEffect, useRef} from 'react';
import {View, TouchableOpacity, StyleSheet, Platform} from 'react-native';
import type {StackNavigationOptions} from '@react-navigation/stack';
import LinearGradient from 'react-native-linear-gradient';

import {GiftCardClient} from '../../services/giftcards';
import HeaderButton from '../../components/Buttons/HeaderButton';
import CustomSafeAreaView from '../../components/CustomSafeAreaView';
import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';
import {
  colors,
  getSpacing,
  getFontSize,
  getCommonStyles,
} from '../../components/GiftCardShop/theme';

export interface PendingGCDetailsParams {
  brand: string;
  amount: number;
  currency: string;
  paymentAmountLtc: string;
  paymentAddress: string;
  pendingPurchaseId: string;
}

interface Props {
  route: {
    params: PendingGCDetailsParams;
  };
  navigation: any;
}

type OrderStatus =
  | 'pending_payment'
  | 'payment_received'
  | 'completed'
  | 'expired'
  | 'failed';

const STATUS_STEPS: {key: OrderStatus; textKey: string}[] = [
  {key: 'pending_payment', textKey: 'status_pending_payment'},
  {key: 'payment_received', textKey: 'status_payment_received'},
  {key: 'completed', textKey: 'status_completed'},
];

function getStepIndex(status: OrderStatus): number {
  switch (status) {
    case 'pending_payment':
      return 0;
    case 'payment_received':
      return 1;
    case 'completed':
      return 2;
    case 'expired':
    case 'failed':
      return -1;
    default:
      return 0;
  }
}

const PendingGCDetails: React.FC<Props> = ({route, navigation}) => {
  const {brand, amount, currency, paymentAmountLtc, pendingPurchaseId} =
    route.params;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = useMemo(
    () => getStyles(SCREEN_WIDTH, SCREEN_HEIGHT),
    [SCREEN_WIDTH, SCREEN_HEIGHT],
  );
  const commonStyles = useMemo(
    () => getCommonStyles(SCREEN_WIDTH, SCREEN_HEIGHT),
    [SCREEN_WIDTH, SCREEN_HEIGHT],
  );

  const [status, setStatus] = useState<OrderStatus>('pending_payment');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const client = new GiftCardClient();

    const pollStatus = async () => {
      try {
        const pendingCards = await client.getMyPendingGiftCards();
        const match = pendingCards.find(p => p.id === pendingPurchaseId);
        if (match) {
          setStatus(match.status);
          if (
            match.status === 'completed' ||
            match.status === 'expired' ||
            match.status === 'failed'
          ) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }
          }
        }
      } catch {
        // Silently fail on poll errors
      }
    };

    pollStatus();
    intervalRef.current = setInterval(pollStatus, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [pendingPurchaseId]);

  const currentStepIndex = getStepIndex(status);
  const isTerminalError = status === 'expired' || status === 'failed';

  const navigateToMyCards = () => {
    navigation.navigate('NewWalletStack', {
      screen: 'Main',
      params: {
        screen: 'MainScreen',
        params: {
          activeCard: 3,
          shopScreen: 'my-cards',
        },
      },
    });
  };

  return (
    <LinearGradient
      style={styles.container}
      colors={['#F6F9FC', 'rgb(238,244,249)']}>
      <CustomSafeAreaView styles={styles.safeArea} edges={['bottom']}>
        <View style={styles.topContainer}>
          <CustomSafeAreaView styles={styles.safeArea2} edges={['top']}>
            <View style={styles.titles}>
              <TranslateText
                textKey="order_details"
                domain="nexusShop"
                maxSizeInPixels={SCREEN_HEIGHT * 0.02}
                textStyle={[commonStyles.subtitle, styles.title]}
                numberOfLines={2}
              />
            </View>

            <View style={styles.paymentDetails}>
              <View style={styles.detailRow}>
                <TranslateText
                  textKey="brand"
                  domain="nexusShop"
                  maxSizeInPixels={SCREEN_HEIGHT * 0.016}
                  textStyle={styles.detailLabel}
                  numberOfLines={1}
                />
                <TranslateText
                  textValue={brand}
                  maxSizeInPixels={SCREEN_HEIGHT * 0.018}
                  textStyle={styles.detailValue}
                  numberOfLines={1}
                />
              </View>

              <View style={styles.detailRow}>
                <TranslateText
                  textKey="amount"
                  domain="nexusShop"
                  maxSizeInPixels={SCREEN_HEIGHT * 0.016}
                  textStyle={styles.detailLabel}
                  numberOfLines={1}
                />
                <TranslateText
                  textValue={`${amount} ${currency}`}
                  maxSizeInPixels={SCREEN_HEIGHT * 0.018}
                  textStyle={styles.detailValue}
                  numberOfLines={1}
                />
              </View>

              {!!paymentAmountLtc && (
                <View style={styles.detailRow}>
                  <TranslateText
                    textKey="price_ltc"
                    domain="nexusShop"
                    maxSizeInPixels={SCREEN_HEIGHT * 0.016}
                    textStyle={styles.detailLabel}
                    numberOfLines={1}
                  />
                  <TranslateText
                    textValue={paymentAmountLtc}
                    maxSizeInPixels={SCREEN_HEIGHT * 0.018}
                    textStyle={styles.detailValue}
                    numberOfLines={1}
                  />
                </View>
              )}
            </View>
          </CustomSafeAreaView>
        </View>

        {/* Order Status Tracker */}
        <View style={styles.statusContainer}>
          <TranslateText
            textKey="order_status"
            domain="nexusShop"
            maxSizeInPixels={SCREEN_HEIGHT * 0.018}
            textStyle={styles.statusTitle}
            numberOfLines={1}
          />

          {isTerminalError ? (
            <View style={styles.errorStatusContainer}>
              <View style={[styles.statusDot, styles.statusDotError]} />
              <TranslateText
                textKey={
                  status === 'expired' ? 'status_expired' : 'status_failed'
                }
                domain="nexusShop"
                maxSizeInPixels={SCREEN_HEIGHT * 0.015}
                textStyle={styles.errorStatusText}
                numberOfLines={1}
              />
            </View>
          ) : (
            <View style={styles.stepsContainer}>
              {STATUS_STEPS.map((step, index) => {
                const isCompleted = index < currentStepIndex;
                const isActive = index === currentStepIndex;
                const isPending = index > currentStepIndex;

                return (
                  <View key={step.key} style={styles.stepRow}>
                    <View style={styles.stepIndicator}>
                      <View
                        style={[
                          styles.statusDot,
                          isCompleted && styles.statusDotCompleted,
                          isActive && styles.statusDotActive,
                          isPending && styles.statusDotPending,
                        ]}
                      />
                      {index < STATUS_STEPS.length - 1 && (
                        <View
                          style={[
                            styles.stepLine,
                            isCompleted
                              ? styles.stepLineCompleted
                              : styles.stepLinePending,
                          ]}
                        />
                      )}
                    </View>
                    <TranslateText
                      textKey={step.textKey}
                      domain="nexusShop"
                      maxSizeInPixels={SCREEN_HEIGHT * 0.015}
                      textStyle={[
                        styles.stepText,
                        isCompleted && styles.stepTextCompleted,
                        isActive && styles.stepTextActive,
                        isPending && styles.stepTextPending,
                      ]}
                      numberOfLines={1}
                    />
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={commonStyles.buttonRounded}
            onPress={navigateToMyCards}
            activeOpacity={0.7}>
            <TranslateText
              textKey="back_to_my_cards"
              domain="nexusShop"
              maxSizeInPixels={SCREEN_HEIGHT * 0.018}
              textStyle={commonStyles.buttonText}
              numberOfLines={1}
            />
          </TouchableOpacity>
        </View>
      </CustomSafeAreaView>
    </LinearGradient>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    safeArea: {
      flex: 1,
    },
    safeArea2: {
      width: '100%',
      height: '100%',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    topContainer: {
      width: '100%',
      height: screenHeight * 0.45,
      backgroundColor: colors.primary,
      borderBottomLeftRadius: screenHeight * 0.04,
      borderBottomRightRadius: screenHeight * 0.04,
      paddingHorizontal: getSpacing(screenWidth, screenHeight).lg,
      paddingBottom: getSpacing(screenWidth, screenHeight).lg,
    },
    titles: {
      width: '100%',
    },
    title: {
      paddingTop: getSpacing(screenWidth, screenHeight).header,
    },
    paymentDetails: {
      width: '100%',
      backgroundColor: colors.white,
      borderRadius: screenHeight * 0.025,
      paddingTop: getSpacing(screenWidth, screenHeight).xl,
      paddingHorizontal: getSpacing(screenWidth, screenHeight).lg,
    },
    detailRow: {
      width: '100%',
      minHeight: screenHeight * 0.04,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: getSpacing(screenWidth, screenHeight).md,
    },
    detailLabel: {
      flexBasis: '35%',
      fontSize: getFontSize(screenHeight).md,
      fontWeight: '600',
      color: colors.text,
    },
    detailValue: {
      flexBasis: '65%',
      fontSize: getFontSize(screenHeight).lg,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'right',
    },
    statusContainer: {
      paddingHorizontal: getSpacing(screenWidth, screenHeight).xl,
      paddingTop: getSpacing(screenWidth, screenHeight).xl,
    },
    statusTitle: {
      fontSize: getFontSize(screenHeight).lg,
      fontWeight: '700',
      fontFamily: 'Satoshi Variable',
      color: colors.text,
      marginBottom: getSpacing(screenWidth, screenHeight).lg,
    },
    stepsContainer: {
      paddingLeft: getSpacing(screenWidth, screenHeight).sm,
    },
    stepRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    stepIndicator: {
      alignItems: 'center',
      marginRight: getSpacing(screenWidth, screenHeight).md,
    },
    statusDot: {
      width: screenHeight * 0.018,
      height: screenHeight * 0.018,
      borderRadius: screenHeight * 0.009,
    },
    statusDotCompleted: {
      backgroundColor: colors.success,
    },
    statusDotActive: {
      backgroundColor: colors.warning,
    },
    statusDotPending: {
      backgroundColor: colors.grayMedium,
    },
    statusDotError: {
      backgroundColor: colors.danger,
    },
    stepLine: {
      width: screenHeight * 0.003,
      height: screenHeight * 0.035,
    },
    stepLineCompleted: {
      backgroundColor: colors.success,
    },
    stepLinePending: {
      backgroundColor: colors.grayMedium,
    },
    stepText: {
      fontSize: getFontSize(screenHeight).md,
      fontFamily: 'Satoshi Variable',
      fontWeight: '600',
      paddingTop: screenHeight * 0.001,
    },
    stepTextCompleted: {
      color: colors.success,
    },
    stepTextActive: {
      color: colors.warning,
    },
    stepTextPending: {
      color: colors.grayDark,
    },
    errorStatusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingLeft: getSpacing(screenWidth, screenHeight).sm,
    },
    errorStatusText: {
      fontSize: getFontSize(screenHeight).md,
      fontFamily: 'Satoshi Variable',
      fontWeight: '600',
      color: colors.danger,
      marginLeft: getSpacing(screenWidth, screenHeight).md,
    },
    buttonContainer: {
      position: 'absolute',
      bottom: screenHeight * 0.03,
      left: 0,
      width: '100%',
      paddingHorizontal: getSpacing(screenWidth, screenHeight).xl,
    },
    headerTitle: {
      color: '#fff',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.02,
      fontStyle: 'normal',
      fontWeight: '700',
    },
  });

export const PendingGCDetailsNavigationOptions = (
  navigation: any,
): StackNavigationOptions => {
  const {width, height} = useContext(ScreenSizeContext);
  const styles = getStyles(width, height);

  return {
    headerTransparent: true,
    headerTitle: () => (
      <TranslateText
        textKey="pending_gift_card"
        domain="nexusShop"
        maxSizeInPixels={height * 0.02}
        textStyle={styles.headerTitle}
        numberOfLines={1}
      />
    ),
    headerTitleAlign: 'left',
    headerTitleContainerStyle: {
      left: 7,
    },
    headerLeft: () => (
      <HeaderButton
        onPress={() =>
          navigation.navigate('NewWalletStack', {
            screen: 'Main',
            params: {
              screen: 'MainScreen',
              params: {
                activeCard: 3,
                shopScreen: 'my-cards',
              },
            },
          })
        }
        imageSource={require('../../assets/images/back-icon.png')}
        leftPadding
      />
    ),
    headerLeftContainerStyle:
      Platform.OS === 'ios' && width >= 414 ? {marginStart: -5} : null,
    headerRightContainerStyle:
      Platform.OS === 'ios' && width >= 414 ? {marginEnd: -5} : null,
    gestureEnabled: false,
  };
};

export default PendingGCDetails;
