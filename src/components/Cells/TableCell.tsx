import React, {Fragment, useContext} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import Share from 'react-native-share';

import NewButton from '../Buttons/NewButton';

import {ScreenSizeContext} from '../../context/screenSize';

interface CommonProps {
  title: string;
  valueFontSize?: number;
  noBorder?: boolean;
  copyButton?: boolean;
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
    value,
    valueStyle,
    children,
    valueFontSize,
    noBorder,
    copyButton,
  } = props;

  const {width, height} = useContext(ScreenSizeContext);
  const styles = getStyles(width, height, valueFontSize, noBorder, copyButton);

  const handleShare = () => {
    Share.open({message: value || 'unknown'});
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {children ? (
        children
      ) : (
        <Fragment>
          <Text
            style={[styles.text, valueStyle ? valueStyle : null]}
            numberOfLines={1}>
            {value}
          </Text>
          {copyButton ? (
            <NewButton
              onPress={() => handleShare()}
              imageSource={require('../../assets/icons/share-icon.png')}
              small
            />
          ) : (
            <Fragment />
          )}
        </Fragment>
      )}
    </View>
  );
};

const getStyles = (
  screenWidth: number,
  screenHeight: number,
  valueFontSize: number | undefined,
  noBorder: boolean | undefined,
  copyButton: boolean | undefined,
) =>
  StyleSheet.create({
    container: {
      width: '100%',
      height: screenHeight * 0.055,
      borderTopWidth: noBorder ? 0 : 1,
      borderTopColor: '#eee',
      backgroundColor: '#fff',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: screenWidth * 0.05,
    },
    title: {
      flexBasis: '30%',
      color: '#747e87',
      fontSize: screenHeight * 0.015,
      fontWeight: '600',
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
    },
    text: {
      flexBasis: copyButton ? '50%' : '70%',
      color: '#4A4A4A',
      fontSize: valueFontSize ? valueFontSize : screenHeight * 0.018,
      fontWeight: '700',
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      textAlign: 'right',
    },
  });

export default TableCell;
