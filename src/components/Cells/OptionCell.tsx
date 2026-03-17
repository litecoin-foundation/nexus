import React, {useContext} from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  Image,
  GestureResponderEvent,
} from 'react-native';

import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

interface Props {
  title: string;
  key: string;
  onPress(event: GestureResponderEvent): void;
  selected: boolean;
}

const OptionCell: React.FC<Props> = (props: Props) => {
  const {title, onPress, selected} = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  return (
    <TouchableOpacity
      style={[styles.container, selected && styles.containerSelected]}
      onPress={onPress}>
      <TranslateText
        textValue={title}
        maxSizeInPixels={SCREEN_HEIGHT * 0.018}
        textStyle={[styles.title, selected && styles.titleSelected]}
        numberOfLines={1}
      />

      {selected ? (
        <Image source={require('../../assets/images/checkBlue.png')} />
      ) : null}
    </TouchableOpacity>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: screenWidth * 0.06,
      height: screenHeight * 0.055,
      borderTopWidth: 1,
      borderColor: '#E5E5EA',
      backgroundColor: '#FFFFFF',
    },
    containerSelected: {
      backgroundColor: '#F0F4FF',
    },
    title: {
      fontFamily: 'Satoshi Variable',
      fontWeight: '700',
      color: '#333',
      fontSize: screenHeight * 0.017,
    },
    titleSelected: {
      color: '#0070F0',
      fontWeight: '700',
    },
  });

export default OptionCell;
