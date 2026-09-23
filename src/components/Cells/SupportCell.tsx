import React, {useContext} from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import TranslateText from '../TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

interface Props {
  onPress: () => void;
}

const SupportCell: React.FC<Props> = props => {
  const {onPress} = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress()}>
      <View style={styles.questionBox}>
        <TranslateText
          textValue="?"
          textStyle={styles.questionText}
          maxSizeInPixels={SCREEN_HEIGHT * 0.017}
        />
      </View>
      <TranslateText
        textKey="need_support"
        domain="settingsTab"
        textStyle={styles.title}
        maxSizeInPixels={SCREEN_HEIGHT * 0.017}
      />
    </TouchableOpacity>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      flexDirection: 'row',
      gap: screenWidth * 0.03,
      alignItems: 'center',
      paddingLeft: screenWidth * 0.05,
      paddingRight: screenWidth * 0.05,
      height: screenHeight * 0.06,
      backgroundColor: 'white',
      marginHorizontal: screenWidth * 0.04,
      marginTop: screenHeight * 0.02,
      marginBottom: screenHeight * 0.01,
      borderRadius: (screenHeight * 0.06) / 2,
      overflow: 'hidden',
    },
    title: {
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      color: '#484859',
      fontSize: 16,
    },
    questionBox: {
      height: 30,
      width: 30,
      borderRadius: 9,
      backgroundColor: '#1162E6',
      alignItems: 'center',
      justifyContent: 'center',
    },
    questionText: {
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      color: 'white',
      fontSize: 15,
    },
  });

export default SupportCell;
