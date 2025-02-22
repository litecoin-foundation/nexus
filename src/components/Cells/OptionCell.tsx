import React, {useContext} from 'react';
import {
  StyleSheet,
  Text,
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
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <TranslateText
        textValue={title}
        maxSizeInPixels={SCREEN_HEIGHT * 0.02}
        textStyle={styles.title}
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
      paddingLeft: 25,
      paddingRight: 25,
      height: 50,
      borderTopWidth: 1,
      borderColor: '#9797974d',
      backgroundColor: 'white',
    },
    title: {
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      color: '#484859',
      fontSize: 16,
    },
  });

export default OptionCell;
