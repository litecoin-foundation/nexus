import React, {useCallback, useContext, useMemo, useRef} from 'react';
import {Image, StyleSheet, View} from 'react-native';
import Animated from 'react-native-reanimated';
import {useHeaderHeight} from '@react-navigation/elements';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import LiquidGlassWalletButton from './Buttons/LiquidGlassWalletButton';
import {
  PADDING_HORIZONTAL_RATIO,
  ScreenHeaderBackIcon,
  ScreenHeaderPill,
} from './ScreenHeader';
import {ScreenSizeContext} from '../context/screenSize';

// Height fractions
const SETTINGS_ICON_RATIO = 0.02;
const FLEXA_ICON_RATIO = 0.02;
const ALERTS_ICON_RATIO = 0.028;
const PILL_GAP_RATIO = 0.01;

interface Props {
  currentWallet: string;
  activeTab: number;
  navigation: any;
  isFlexaCustomer: boolean;
  manualPayment: () => void;
  onBack: () => void;
  onPressWalletButton: () => void;
  rotateArrow: () => void;
  arrowSpinAnim: any;
  // opacity feeds: the first pair fade for the wallet's own modals, the last
  // rides the shop transition so this set hands over to the shop's header
  animatedHeaderButtonOpacity: any;
  animatedWalletButtonOpacity: any;
  shopHeaderFadeStyle: any;
  // bottom edge of the pill in page coords; the wallets modal opens from it
  onWalletButtonMeasured: (gapInPixels: number) => void;
  interactive: boolean;
}

const MainHeader: React.FC<Props> = ({
  currentWallet,
  activeTab,
  navigation,
  isFlexaCustomer,
  manualPayment,
  onBack,
  onPressWalletButton,
  rotateArrow,
  arrowSpinAnim,
  animatedHeaderButtonOpacity,
  animatedWalletButtonOpacity,
  shopHeaderFadeStyle,
  onWalletButtonMeasured,
  interactive,
}) => {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);

  const styles = useMemo(
    () =>
      getStyles(
        SCREEN_WIDTH,
        SCREEN_HEIGHT,
        insets.top,
        headerHeight - insets.top,
      ),
    [SCREEN_WIDTH, SCREEN_HEIGHT, insets.top, headerHeight],
  );

  const walletButtonRef = useRef<View>(null);
  const lastGap = useRef<number | null>(null);
  const measureWalletButton = useCallback(() => {
    walletButtonRef.current?.measure(
      (_x: any, _y: any, _w: any, height: any, _px: any, pageY: any) => {
        const gap = height + pageY;
        if (!Number.isFinite(gap) || lastGap.current === gap) return;
        lastGap.current = gap;
        onWalletButtonMeasured(gap);
      },
    );
  }, [onWalletButtonMeasured]);

  const openSettings = useCallback(
    () => navigation.navigate('SettingsStack'),
    [navigation],
  );
  const openAlerts = useCallback(
    () => navigation.navigate('AlertsStack'),
    [navigation],
  );

  const sidePointerEvents = interactive ? 'box-none' : 'none';

  return (
    <View style={styles.host} pointerEvents="box-none">
      <View style={styles.row} pointerEvents="box-none">
        <View style={styles.centre} pointerEvents={sidePointerEvents}>
          <Animated.View
            ref={walletButtonRef}
            onLayout={measureWalletButton}
            style={animatedWalletButtonOpacity}>
            <Animated.View style={shopHeaderFadeStyle}>
              <LiquidGlassWalletButton
                title={currentWallet}
                onPress={onPressWalletButton}
                disabled={false}
                rotateArrow={rotateArrow}
                arrowSpinAnim={arrowSpinAnim}
              />
            </Animated.View>
          </Animated.View>
        </View>

        <Animated.View
          style={[styles.side, styles.left, animatedHeaderButtonOpacity]}
          pointerEvents={sidePointerEvents}>
          <Animated.View style={[styles.sideRow, shopHeaderFadeStyle]}>
            {activeTab !== 0 ? (
              <ScreenHeaderPill onPress={onBack}>
                <ScreenHeaderBackIcon />
              </ScreenHeaderPill>
            ) : (
              <>
                <ScreenHeaderPill onPress={openSettings}>
                  <Image
                    style={styles.settingsIcon}
                    source={require('../assets/icons/settings-cog.png')}
                  />
                </ScreenHeaderPill>
                {isFlexaCustomer ? (
                  <ScreenHeaderPill onPress={manualPayment}>
                    <Image
                      style={styles.flexaIcon}
                      source={require('../assets/images/flexa-logo.png')}
                    />
                  </ScreenHeaderPill>
                ) : null}
              </>
            )}
          </Animated.View>
        </Animated.View>

        <Animated.View
          style={[styles.side, styles.right, animatedHeaderButtonOpacity]}
          pointerEvents={sidePointerEvents}>
          <Animated.View style={[styles.sideRow, shopHeaderFadeStyle]}>
            <ScreenHeaderPill onPress={openAlerts}>
              <Image
                style={styles.alertsIcon}
                source={require('../assets/icons/alerts-icon.png')}
              />
            </ScreenHeaderPill>
          </Animated.View>
        </Animated.View>
      </View>
    </View>
  );
};

const getStyles = (
  screenWidth: number,
  screenHeight: number,
  topInset: number,
  rowHeight: number,
) =>
  StyleSheet.create({
    host: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      paddingTop: topInset,
      zIndex: 2,
    },
    row: {
      height: rowHeight,
    },
    side: {
      position: 'absolute',
      top: 0,
    },
    left: {
      left: screenWidth * PADDING_HORIZONTAL_RATIO,
    },
    right: {
      right: screenWidth * PADDING_HORIZONTAL_RATIO,
    },
    sideRow: {
      flexDirection: 'row',
      gap: screenHeight * PILL_GAP_RATIO,
    },
    centre: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      alignItems: 'center',
    },
    settingsIcon: {
      width: screenHeight * SETTINGS_ICON_RATIO,
      height: screenHeight * SETTINGS_ICON_RATIO,
      resizeMode: 'contain',
    },
    flexaIcon: {
      width: screenHeight * FLEXA_ICON_RATIO,
      height: screenHeight * FLEXA_ICON_RATIO,
      resizeMode: 'contain',
    },
    alertsIcon: {
      width: screenHeight * ALERTS_ICON_RATIO,
      height: screenHeight * ALERTS_ICON_RATIO,
      resizeMode: 'contain',
    },
  });

export default React.memo(MainHeader);
