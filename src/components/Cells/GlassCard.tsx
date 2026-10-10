import React, {useContext, useMemo} from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';

import TranslateText from '../TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

// Apple-Pay-sheet styled grouping for the light sheets: near-opaque white
// cards with hairline separators, the row's title on the left and its value,
// with an optional status dot or chevron, on the right

export const PRIMARY_TEXT = '#2E2E2E';
export const SECONDARY_TEXT = '#747E87';
const HAIRLINE = 'rgba(60, 60, 67, 0.18)';
const CARD_BACKGROUND = 'rgba(255, 255, 255, 0.96)';

export const CARD_ROW_HEIGHT_RATIO = 0.055;

interface CardProps {
  children: React.ReactNode;
}

export const GlassCard: React.FC<CardProps> = ({children}) => {
  const styles = useGlassCardStyles();
  return <View style={styles.card}>{children}</View>;
};

export const GlassCardHairline: React.FC = () => {
  const styles = useGlassCardStyles();
  return <View style={styles.hairline} />;
};

export interface GlassCardRowProps {
  titleTextKey?: string;
  titleDomain?: string;
  titleTextValue?: string;
  valueTextKey?: string;
  valueDomain?: string;
  value?: string;
  valueColor?: string;
  smallValue?: boolean;
  // NOTE: the row that sums up the card, set in the primary colour and larger
  emphasized?: boolean;
  chevron?: boolean;
  dotColor?: string;
  onPress?: () => void;
}

export const GlassCardRow: React.FC<GlassCardRowProps> = props => {
  const {
    titleTextKey,
    titleDomain,
    titleTextValue,
    valueTextKey,
    valueDomain,
    value,
    valueColor,
    smallValue,
    emphasized,
    chevron,
    dotColor,
    onPress,
  } = props;

  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);
  const styles = useGlassCardStyles();

  return (
    <TouchableOpacity
      style={styles.cardRow}
      activeOpacity={onPress ? 0.6 : 1}
      onPress={onPress}
      disabled={!onPress}>
      <TranslateText
        textKey={titleTextKey}
        textValue={titleTextValue}
        domain={titleDomain || 'main'}
        maxSizeInPixels={SCREEN_HEIGHT * 0.017}
        textStyle={{
          ...styles.cardRowTitle,
          ...(emphasized ? styles.cardRowTitleEmphasized : {}),
        }}
        numberOfLines={1}
      />
      <View style={styles.cardRowRight}>
        {dotColor ? (
          <View style={[styles.statusDot, {backgroundColor: dotColor}]} />
        ) : null}
        <TranslateText
          textKey={valueTextKey}
          textValue={value}
          domain={valueDomain || 'main'}
          maxSizeInPixels={SCREEN_HEIGHT * (emphasized ? 0.024 : 0.02)}
          textStyle={{
            ...styles.cardRowValue,
            ...(smallValue ? styles.cardRowValueSmall : {}),
            ...(emphasized ? styles.cardRowValueEmphasized : {}),
            ...(valueColor ? {color: valueColor} : {}),
          }}
          numberOfLines={smallValue ? 2 : 1}
        />
        {chevron ? (
          <TranslateText
            textValue={'›'}
            maxSizeInPixels={SCREEN_HEIGHT * 0.024}
            textStyle={styles.chevron}
            numberOfLines={1}
          />
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

interface SubRowProps {
  titleTextKey: string;
  titleDomain?: string;
  value: string;
}

// NOTE: a dotted, shorter row breaking down the row above it
export const GlassCardSubRow: React.FC<SubRowProps> = props => {
  const {titleTextKey, titleDomain, value} = props;

  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);
  const styles = useGlassCardStyles();

  return (
    <View style={styles.subRow}>
      <View style={styles.subRowLeft}>
        <View style={styles.subRowDot} />
        <TranslateText
          textKey={titleTextKey}
          domain={titleDomain || 'main'}
          maxSizeInPixels={SCREEN_HEIGHT * 0.016}
          textStyle={styles.cardRowTitle}
          numberOfLines={1}
        />
      </View>
      <TranslateText
        textValue={value}
        maxSizeInPixels={SCREEN_HEIGHT * 0.02}
        textStyle={styles.subRowValue}
        numberOfLines={1}
      />
    </View>
  );
};

interface StackedRowProps {
  titleTextKey?: string;
  titleDomain?: string;
  titleTextValue?: string;
  value: string;
  // NOTE: no limit by default, so a value that must be read in full, such as an
  // address, is never cut short
  numberOfLines?: number;
}

// NOTE: a row for a value too long to sit beside its title, set under it instead
export const GlassCardStackedRow: React.FC<StackedRowProps> = props => {
  const {titleTextKey, titleDomain, titleTextValue, value, numberOfLines} =
    props;

  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);
  const styles = useGlassCardStyles();

  return (
    <View style={styles.stackedRow}>
      <TranslateText
        textKey={titleTextKey}
        textValue={titleTextValue}
        domain={titleDomain || 'main'}
        maxSizeInPixels={SCREEN_HEIGHT * 0.017}
        textStyle={styles.cardRowTitle}
        numberOfLines={1}
      />
      <TranslateText
        textValue={value}
        maxSizeInPixels={SCREEN_HEIGHT * 0.02}
        textStyle={styles.stackedRowValue}
        numberOfLines={numberOfLines}
      />
    </View>
  );
};

const useGlassCardStyles = () => {
  const {width, height} = useContext(ScreenSizeContext);
  return useMemo(() => getStyles(width, height), [width, height]);
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    card: {
      width: '100%',
      backgroundColor: CARD_BACKGROUND,
      borderRadius: screenHeight * 0.028,
      paddingHorizontal: screenWidth * 0.045,
      marginBottom: screenHeight * 0.012,
      overflow: 'hidden',
    },
    cardRow: {
      minHeight: screenHeight * CARD_ROW_HEIGHT_RATIO,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: screenHeight * 0.008,
    },
    cardRowTitle: {
      color: SECONDARY_TEXT,
      fontSize: screenHeight * 0.014,
      fontWeight: '700',
      fontFamily: 'Satoshi Variable',
    },
    cardRowTitleEmphasized: {
      color: PRIMARY_TEXT,
      fontSize: screenHeight * 0.015,
    },
    cardRowRight: {
      flexShrink: 1,
      flexDirection: 'row',
      alignItems: 'center',
      paddingLeft: screenWidth * 0.03,
    },
    cardRowValue: {
      color: PRIMARY_TEXT,
      fontSize: screenHeight * 0.017,
      fontWeight: '700',
      fontFamily: 'Satoshi Variable',
      textAlign: 'right',
      flexShrink: 1,
    },
    cardRowValueSmall: {
      fontSize: screenHeight * 0.012,
      fontWeight: '500',
    },
    cardRowValueEmphasized: {
      fontSize: screenHeight * 0.021,
    },
    chevron: {
      color: SECONDARY_TEXT,
      fontSize: screenHeight * 0.024,
      fontWeight: '400',
      paddingLeft: screenWidth * 0.02,
      marginTop: -screenHeight * 0.004,
    },
    statusDot: {
      width: screenHeight * 0.009,
      height: screenHeight * 0.009,
      borderRadius: screenHeight * 0.0045,
      marginRight: screenWidth * 0.02,
    },
    subRow: {
      minHeight: screenHeight * 0.04,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    subRowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    subRowDot: {
      width: screenHeight * 0.005,
      height: screenHeight * 0.005,
      borderRadius: screenHeight * 0.0025,
      backgroundColor: SECONDARY_TEXT,
      marginRight: screenWidth * 0.02,
      marginLeft: screenWidth * 0.01,
    },
    subRowValue: {
      color: PRIMARY_TEXT,
      fontSize: screenHeight * 0.016,
      fontWeight: '500',
      fontFamily: 'Satoshi Variable',
      textAlign: 'right',
      flexShrink: 1,
    },
    stackedRow: {
      minHeight: screenHeight * CARD_ROW_HEIGHT_RATIO,
      justifyContent: 'center',
      paddingVertical: screenHeight * 0.012,
    },
    stackedRowValue: {
      color: PRIMARY_TEXT,
      fontSize: screenHeight * 0.015,
      fontWeight: '700',
      fontFamily: 'Satoshi Variable',
      marginTop: screenHeight * 0.004,
    },
    hairline: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: HAIRLINE,
      width: '100%',
    },
  });
