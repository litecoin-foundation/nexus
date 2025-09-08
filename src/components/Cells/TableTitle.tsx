import React, {useContext} from 'react';
import {StyleSheet, View} from 'react-native';

import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

interface Props {
  title?: string;
  titleTextKey?: string;
  titleTextDomain?: string;
  titleInterpolationObj?: {
    [key: string]: any;
  };
  titleFontSize?: number;
  color?: string;
  rightTitle?: string;
  rightTitleTextKey?: string;
  rightTitleTextDomain?: string;
  rightTitleInterpolationObj?: {
    [key: string]: any;
  };
  rightTitleFontSize?: number;
  rightColor?: string;
  thick?: boolean;
  noBorder?: boolean;
  bgColor?: string;
}

const TableTitle: React.FC<Props> = props => {
  const {
    title,
    titleTextKey,
    titleTextDomain,
    titleInterpolationObj,
    titleFontSize,
    color,
    rightTitle,
    rightTitleTextKey,
    rightTitleTextDomain,
    rightTitleInterpolationObj,
    rightTitleFontSize,
    rightColor,
    thick,
    noBorder,
    bgColor,
  } = props;

  const {width, height} = useContext(ScreenSizeContext);
  const styles = getStyles(
    width,
    height,
    thick,
    noBorder,
    bgColor,
    titleFontSize,
    rightTitleFontSize,
  );

  const titleStyle = color
    ? {...styles.title, ...{color: color}}
    : styles.title;
  const rightTitleStyle = rightColor
    ? {...styles.rightTitle, ...{color: rightColor}}
    : styles.rightTitle;

  return (
    <View style={styles.container}>
      {title ? (
        <TranslateText
          textValue={title}
          maxSizeInPixels={height * 0.017}
          textStyle={titleStyle}
        />
      ) : titleTextKey && titleTextDomain ? (
        <TranslateText
          textKey={titleTextKey}
          domain={titleTextDomain}
          maxSizeInPixels={height * 0.017}
          textStyle={titleStyle}
          numberOfLines={1}
          interpolationObj={titleInterpolationObj}
        />
      ) : (
        <></>
      )}
      {rightTitle ? (
        <TranslateText
          textValue={rightTitle}
          maxSizeInPixels={height * 0.017}
          textStyle={rightTitleStyle}
        />
      ) : rightTitleTextKey && rightTitleTextDomain ? (
        <TranslateText
          textKey={rightTitleTextKey}
          domain={rightTitleTextDomain}
          maxSizeInPixels={height * 0.017}
          textStyle={rightTitleStyle}
          numberOfLines={1}
          interpolationObj={rightTitleInterpolationObj}
        />
      ) : (
        <></>
      )}
    </View>
  );
};

const getStyles = (
  screenWidth: number,
  screenHeight: number,
  thick: boolean | undefined,
  noBorder: boolean | undefined,
  bgColor: string | undefined,
  titleFontSize: number | undefined,
  rightTitleFontSize: number | undefined,
) =>
  StyleSheet.create({
    container: {
      width: '100%',
      height: thick ? screenHeight * 0.065 : screenHeight * 0.055,
      minHeight: thick ? screenHeight * 0.065 : screenHeight * 0.055,
      borderTopWidth: noBorder ? 0 : 1,
      borderTopColor: '#eee',
      backgroundColor: bgColor ? bgColor : '#fff',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: screenWidth * 0.05,
    },
    title: {
      color: '#747e87',
      fontFamily: 'Satoshi Variable',
      fontSize: titleFontSize ? titleFontSize : screenHeight * 0.015,
      fontWeight: '700',
      fontStyle: 'normal',
    },
    rightTitle: {
      color: '#747e87',
      fontFamily: 'Satoshi Variable',
      fontSize: rightTitleFontSize ? rightTitleFontSize : screenHeight * 0.015,
      fontWeight: '700',
      fontStyle: 'normal',
      textAlign: 'right',
    },
  });

export default TableTitle;
