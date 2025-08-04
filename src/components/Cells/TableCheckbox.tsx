import React, {useContext, useState} from 'react';
import {View, StyleSheet, Pressable} from 'react-native';

import TranslateText from '../../components/TranslateText';
import AnimatedCheckbox from '../../components/AnimatedCheckbox';
import {ScreenSizeContext} from '../../context/screenSize';

interface Props {
  callback: (select: boolean) => void;
  initialState: boolean;
  title?: string;
  titleTextKey?: string;
  titleTextDomain?: string;
  value?: string;
  thick?: boolean;
  noBorder?: boolean;
  bgColor?: string;
  titleNumberOfLines?: number;
  titleFontSize?: number;
}

const TableCheckbox: React.FC<Props> = props => {
  const {
    callback,
    initialState,
    title,
    titleTextKey,
    titleTextDomain,
    value,
    thick,
    noBorder,
    bgColor,
    titleNumberOfLines = 1,
    titleFontSize,
  } = props;

  const {width, height} = useContext(ScreenSizeContext);
  const styles = getStyles(width, height, thick, noBorder, bgColor, titleNumberOfLines);

  const [switchState, setSwitchState] = useState(initialState);

  const handlePress = () => {
    callback(!switchState);
    setSwitchState(!switchState);
  };

  const titleStyle = switchState
    ? {...styles.title, ...{color: '#2C72FF'}}
    : {...styles.title, ...{color: '#747e87'}};
  const rightTitleStyle = switchState
    ? {...styles.rightTitle, ...{color: '#2C72FF'}}
    : {...styles.rightTitle, ...{color: '#747e87'}};

  return (
    <Pressable style={styles.container} onPress={handlePress}>
      <View style={styles.left}>
        <AnimatedCheckbox checked={switchState} />
        {title ? (
          <TranslateText
            textValue={title}
            maxSizeInPixels={titleFontSize || height * 0.014}
            textStyle={titleStyle}
            numberOfLines={titleNumberOfLines}
          />
        ) : titleTextKey && titleTextDomain ? (
          <TranslateText
            textKey={titleTextKey}
            domain={titleTextDomain}
            maxSizeInPixels={titleFontSize || height * 0.014}
            textStyle={titleStyle}
            numberOfLines={titleNumberOfLines}
          />
        ) : (
          <></>
        )}
      </View>

      <TranslateText
        textValue={value}
        maxSizeInPixels={height * 0.02}
        textStyle={rightTitleStyle}
        numberOfLines={1}
      />
    </Pressable>
  );
};

const getStyles = (
  screenWidth: number,
  screenHeight: number,
  thick: boolean | undefined,
  noBorder: boolean | undefined,
  bgColor: string | undefined,
  titleNumberOfLines: number = 1,
) =>
  StyleSheet.create({
    container: {
      width: '100%',
      height: titleNumberOfLines > 1 
        ? (thick ? screenHeight * 0.08 : screenHeight * 0.07)
        : (thick ? screenHeight * 0.065 : screenHeight * 0.055),
      minHeight: titleNumberOfLines > 1 
        ? (thick ? screenHeight * 0.08 : screenHeight * 0.07)
        : (thick ? screenHeight * 0.065 : screenHeight * 0.055),
      borderTopWidth: noBorder ? 0 : 1,
      borderTopColor: '#eee',
      backgroundColor: bgColor ? bgColor : '#fff',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: screenWidth * 0.05,
    },
    left: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    title: {
      color: '#747e87',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.015,
      fontWeight: '700',
      fontStyle: 'normal',
    },
    rightTitle: {
      color: '#747e87',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.018,
      fontWeight: '700',
      fontStyle: 'normal',
      textAlign: 'right',
    },
  });

export default TableCheckbox;
