import React, {useContext} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import Share from 'react-native-share';

import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

interface CommonProps {
  title?: string;
  titleTextKey?: string;
  titleTextDomain?: string;
  thick?: boolean;
  valueFontSize?: number;
  noBorder?: boolean;
  blueValue?: boolean;
  copyable?: boolean;
}

type ConditionalProps =
  | {
      value?: string;
      valueStyle?: object;
      children?: never;
    }
  | {
      value?: never;
      valueStyle?: never;
      children?: React.ReactNode;
    };

type Props = CommonProps & ConditionalProps;

const TableCell: React.FC<Props> = props => {
  const {
    title,
    titleTextKey,
    titleTextDomain,
    thick,
    value,
    valueStyle,
    children,
    valueFontSize,
    noBorder,
    blueValue,
    copyable,
  } = props;

  const {width, height} = useContext(ScreenSizeContext);
  const styles = getStyles(
    width,
    height,
    thick,
    valueFontSize,
    noBorder,
    blueValue,
  );

  const handleShare = () => {
    if (copyable) {
      Share.open({message: value || 'unknown'});
    }
  };

  const textStyle = valueStyle ? {...styles.text, ...valueStyle} : styles.text;

  return (
    <View style={styles.container}>
      {title ? (
        <TranslateText
          textValue={title}
          maxSizeInPixels={height * 0.017}
          textStyle={styles.title}
        />
      ) : titleTextKey && titleTextDomain ? (
        <TranslateText
          textKey={titleTextKey}
          domain={titleTextDomain}
          maxSizeInPixels={height * 0.017}
          textStyle={styles.title}
          numberOfLines={1}
        />
      ) : (
        <></>
      )}

      {children ? (
        children
      ) : (
        <Pressable style={{flex: 1}} onPress={handleShare}>
          <TranslateText
            textValue={value}
            maxSizeInPixels={height * 0.02}
            textStyle={textStyle}
            numberOfLines={1}
          />
        </Pressable>
      )}
    </View>
  );
};

const getStyles = (
  screenWidth: number,
  screenHeight: number,
  thick: boolean | undefined,
  valueFontSize: number | undefined,
  noBorder: boolean | undefined,
  blueValue: boolean | undefined,
) =>
  StyleSheet.create({
    container: {
      width: '100%',
      height: thick ? screenHeight * 0.065 : screenHeight * 0.055,
      minHeight: thick ? screenHeight * 0.065 : screenHeight * 0.055,
      borderTopWidth: noBorder ? 0 : 1,
      borderTopColor: '#eee',
      backgroundColor: '#fff',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: screenWidth * 0.05,
    },
    title: {
      color: '#747e87',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.015,
      fontWeight: '700',
      fontStyle: 'normal',
    },
    text: {
      color: blueValue ? '#2c72ff' : '#4a4a4a',
      fontSize: valueFontSize ? valueFontSize : screenHeight * 0.018,
      fontWeight: '700',
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      textAlign: 'right',
    },
  });

export default TableCell;
