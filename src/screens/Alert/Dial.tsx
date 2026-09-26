import React, {useState, useContext, useCallback, useMemo} from 'react';
import {View, StyleSheet, Platform} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {StackNavigationProp} from '@react-navigation/stack';

import SlideRuler from '../../components/SlideRuler';
import BlueButtonV2 from '../../components/ButtonsV2/BlueButtonV2';
import MegaphoneArt from '../../components/MegaphoneArt';
import {addAlert} from '../../reducers/alerts';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {convertLocalFiatToUSD, ltcRateSelector} from '../../reducers/ticker';
import ScreenHeader, {
  useScreenHeaderArrival,
  useScreenHeaderLayout,
} from '../../components/ScreenHeader';
import {
  SKIN_GRADIENT_COLORS,
  SKIN_GRADIENT_LOCATIONS,
} from '../../components/FoldedSkinView';

import CustomSafeAreaView from '../../components/CustomSafeAreaView';
import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';
import {useFixedBottomStyle} from '../../components/ButtonsV2/fixedBottomStyle';

type RootStackParamList = {
  Dial: undefined;
};

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'Dial'>;
}

const Dial: React.FC<Props> = props => {
  const {navigation} = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);
  const {rects, paddingHorizontal} = useScreenHeaderLayout();
  const headerFadeStyle = useScreenHeaderArrival();

  const dispatch = useAppDispatch();
  const currentRate =
    Number(useAppSelector(state => ltcRateSelector(state))) || 1;
  const localFiatToUSDRate =
    useAppSelector(state => convertLocalFiatToUSD(state)) || 1;
  const currencySymbol = useAppSelector(state => state.settings.currencySymbol);
  const [value, setValue] = useState(0);
  const [usdValue, setUSDValue] = useState(0);

  const maximumValue = currentRate > 1000 ? currentRate + 500 : 1000;

  const toggleActive = value >= currentRate;

  const Ruler = useMemo(
    () => (
      <SlideRuler
        onValueChange={(slideValue: number) => {
          setValue(slideValue);
          const calculatedValue = Number(
            (slideValue * localFiatToUSDRate).toFixed(2),
          );
          setUSDValue(calculatedValue);
        }}
        maximumValue={maximumValue}
        decimalPlaces={1}
        multiplicity={1}
        arrayLength={1000}
        initialValue={currentRate}
      />
    ),
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
    [],
  );

  const goBack = useCallback(() => navigation.goBack(), [navigation]);

  const handlePress = useCallback(() => {
    dispatch(
      addAlert({
        value,
        originalValue: usdValue,
        isIOS: Platform.OS === 'ios',
      }),
    );
    navigation.goBack();
  }, [value, usdValue, dispatch, navigation]);

  const fixedBottomStyle = useFixedBottomStyle();
  const CreateAlertButton = useMemo(
    () => (
      <View style={fixedBottomStyle}>
        <BlueButtonV2
          textKey="create_alert"
          textDomain="alertsTab"
          onPress={() => handlePress()}
        />
      </View>
    ),
    [fixedBottomStyle, handlePress],
  );

  return (
    <LinearGradient
      style={styles.container}
      colors={['#F6F9FC', 'rgb(238,244,249)']}>
      <CustomSafeAreaView styles={{...styles.safeArea}} edges={['bottom']}>
        <View style={styles.subContainer}>
          <LinearGradient
            style={styles.topContainer}
            colors={SKIN_GRADIENT_COLORS}
            locations={SKIN_GRADIENT_LOCATIONS}>
            <View style={styles.imageContainer}>
              <MegaphoneArt />
            </View>
            <TranslateText
              textKey="alert_me"
              domain="alertsTab"
              maxSizeInPixels={SCREEN_HEIGHT * 0.04}
              textStyle={styles.text}
              numberOfLines={1}
            />
            <TranslateText
              textKey="when_ltc"
              domain="alertsTab"
              maxSizeInPixels={SCREEN_HEIGHT * 0.04}
              textStyle={styles.text}
              numberOfLines={1}
            />

            <View style={styles.switchContainer}>
              <View style={!toggleActive ? styles.toggleActive : styles.toggle}>
                <TranslateText
                  textKey="below"
                  domain="alertsTab"
                  maxSizeInPixels={SCREEN_HEIGHT * 0.03}
                  textStyle={
                    !toggleActive ? styles.toggleTextActive : styles.toggleText
                  }
                  numberOfLines={1}
                />
              </View>
              <View style={toggleActive ? styles.toggleActive : styles.toggle}>
                <TranslateText
                  textKey="above"
                  domain="alertsTab"
                  maxSizeInPixels={SCREEN_HEIGHT * 0.03}
                  textStyle={
                    toggleActive ? styles.toggleTextActive : styles.toggleText
                  }
                  numberOfLines={1}
                />
              </View>
            </View>
          </LinearGradient>

          <View style={styles.valueContainer}>
            <TranslateText
              textValue={currencySymbol + value}
              maxSizeInPixels={SCREEN_HEIGHT * 0.07}
              textStyle={styles.valueText}
              numberOfLines={1}
            />
          </View>
          <View style={styles.rulerContainer}>{Ruler}</View>
        </View>
      </CustomSafeAreaView>
      {CreateAlertButton}
      <ScreenHeader
        rects={rects}
        paddingHorizontal={paddingHorizontal}
        titleKey="set_alerts"
        titleDomain="alertsTab"
        onBack={goBack}
        fadeStyle={headerFadeStyle}
      />
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
    subContainer: {
      flex: 1,
      alignItems: 'center',
    },
    topContainer: {
      width: '100%',
      height: screenHeight * 0.62,
      borderBottomLeftRadius: screenHeight * 0.07,
      borderBottomRightRadius: screenHeight * 0.07,
      borderCurve: 'continuous',
      justifyContent: 'flex-start',
      alignItems: 'center',
    },
    imageContainer: {
      width: '100%',
      height: screenHeight * 0.55,
      marginTop: screenHeight * 0.047,
      marginBottom: screenHeight * (0.12 + 0.047) * -1,
    },
    text: {
      color: '#fff',
      fontSize: screenHeight * 0.03,
      fontWeight: '500',
    },
    boldText: {
      color: '#fff',
      fontSize: screenHeight * 0.03,
      fontWeight: '700',
    },
    switchContainer: {
      width: screenWidth * 0.8,
      height: screenHeight * 0.056,
      borderRadius: screenHeight * 0.028,
      borderColor: '#fff',
      borderWidth: screenHeight < 701 ? 2 : 3,
      flexDirection: 'row',
      marginTop: screenHeight * 0.02,
      overflow: 'hidden',
    },
    toggle: {
      flexBasis: '50%',
      height: '100%',
      backgroundColor: 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
    },
    toggleActive: {
      flexBasis: '50%',
      height: '100%',
      backgroundColor: '#fff',
      justifyContent: 'center',
      alignItems: 'center',
    },
    toggleText: {
      color: '#fff',
      fontSize: screenHeight * 0.02,
      fontWeight: '500',
    },
    toggleTextActive: {
      color: '#0070F0',
      fontSize: screenHeight * 0.02,
      fontWeight: '500',
    },
    valueContainer: {
      width: '100%',
      alignItems: 'center',
      height: screenHeight * 0.08,
      justifyContent: 'center',
      marginTop: screenHeight * 0.05,
    },
    valueText: {
      fontSize: screenHeight * 0.07,
      color: '#1C1C1C',
      fontWeight: 'bold',
      letterSpacing: -0.39,
    },
    rulerContainer: {
      width: '100%',
      marginTop: screenHeight * 0.01,
    },
  });

export default Dial;
