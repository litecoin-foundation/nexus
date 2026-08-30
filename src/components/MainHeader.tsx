import React, {useCallback, useContext, useMemo, useRef} from 'react';
import {StyleSheet, View} from 'react-native';
import Animated from 'react-native-reanimated';
import {useHeaderHeight} from '@react-navigation/elements';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import HeaderButton from './Buttons/HeaderButton';
import LiquidGlassWalletButton from './Buttons/LiquidGlassWalletButton';
import {ScreenSizeContext} from '../context/screenSize';

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
    () => getStyles(insets.top, headerHeight - insets.top),
    [insets.top, headerHeight],
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
              <HeaderButton
                onPress={onBack}
                imageSource={require('../assets/images/back-icon.png')}
                leftPadding
              />
            ) : (
              <>
                <HeaderButton
                  onPress={() => navigation.navigate('SettingsStack')}
                  imageSource={require('../assets/icons/settings-cog.png')}
                  imageXY={{x: SCREEN_HEIGHT * 0.02, y: SCREEN_HEIGHT * 0.02}}
                  leftPadding
                />
                {isFlexaCustomer ? (
                  <HeaderButton
                    onPress={() => manualPayment()}
                    imageSource={require('../assets/images/flexa-logo.png')}
                    imageXY={{x: SCREEN_HEIGHT * 0.02, y: SCREEN_HEIGHT * 0.02}}
                    leftPadding
                    marginLeft={SCREEN_WIDTH * 0.02 * -1}
                  />
                ) : null}
              </>
            )}
          </Animated.View>
        </Animated.View>

        <Animated.View
          style={[styles.side, styles.right, animatedHeaderButtonOpacity]}
          pointerEvents={sidePointerEvents}>
          <Animated.View style={[styles.sideRow, shopHeaderFadeStyle]}>
            <HeaderButton
              onPress={() => navigation.navigate('AlertsStack')}
              imageSource={require('../assets/icons/alerts-icon.png')}
              imageXY={{x: SCREEN_HEIGHT * 0.028, y: SCREEN_HEIGHT * 0.028}}
              rightPadding
            />
          </Animated.View>
        </Animated.View>
      </View>
    </View>
  );
};

const getStyles = (topInset: number, rowHeight: number) =>
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
      left: 0,
    },
    right: {
      right: 0,
    },
    sideRow: {
      flexDirection: 'row',
    },
    centre: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      alignItems: 'center',
    },
  });

export default React.memo(MainHeader);
