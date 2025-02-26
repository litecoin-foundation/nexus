import React, {useContext, useState} from 'react';
import {View, Text, StyleSheet, Pressable} from 'react-native';
import ConvertField from '../InputFields/ConvertField';
import BuyPad from '../Numpad/BuyPad';
import {ScreenSizeContext} from '../../context/screenSize';
import BlueButton from '../Buttons/BlueButton';

interface Props {}

const Convert: React.FC<Props> = props => {
  const {} = props;
  const [activeField, setActiveField] = useState('regular');
  const [toggleLTC, setToggleLTC] = useState(true);

  // TODO: TEMP
  const regularAmount = '0.00';
  const privateAmount = '0.00';

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const onChange = (value: string) => {
    if (toggleLTC) {
      // change regular litecoin
    } else if (!toggleLTC) {
      // change private litecoin
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputsContainer}>
        <View style={styles.fieldContainer}>
          <Text style={styles.smallText}>YOUR REGULAR LITECOIN</Text>
          <ConvertField
            active={activeField === 'regular'}
            amount={regularAmount}
          />
          <Text style={styles.smallText}>123 LTC</Text>
        </View>

        <View style={styles.arrowButtonContainer}>
          <Pressable style={styles.arrowButton}>
            <Text> {'->'} </Text>
          </Pressable>
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.smallText}>YOUR PRIVATE LITECOIN</Text>
          <ConvertField
            active={activeField === 'private'}
            amount={privateAmount}
          />
          <Text style={styles.smallText}>123 LTC</Text>
        </View>
      </View>

      <View style={styles.bottomContainer}>
        <View style={styles.numpadContainer}>
          <BuyPad
            onChange={(value: string) => onChange(value)}
            currentValue={toggleLTC ? regularAmount : privateAmount}
          />
        </View>

        <View style={styles.buttonContainer}>
          <BlueButton
            disabled={false}
            textKey="convert_button"
            textDomain="convertTab"
            onPress={() => {
              console.log('pressed');
            }}
          />
        </View>
      </View>
    </View>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      width: screenWidth,
      height: screenHeight * 0.55,
      paddingHorizontal: screenWidth * 0.06,
    },
    inputsContainer: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-evenly',
    },
    bottomContainer: {
      flexBasis: '82%',
      width: '100%',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    buttonContainer: {
      flexBasis: '20%',
      width: '100%',
      marginVertical: screenHeight * 0.02,
    },
    fieldContainer: {
      flex: 1,
      flexDirection: 'column',
      justifyContent: 'center',
    },
    numpadContainer: {
      width: screenWidth,
    },
    smallText: {
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.013,
      fontStyle: 'normal',
      fontWeight: '700',
      color: '#7C96AE',
    },
    arrowButtonContainer: {
      marginHorizontal: screenWidth * 0.024,
      justifyContent: 'center',
    },
    arrowButton: {
      backgroundColor: '#2C72FF',
      borderRadius: 10,
      height: screenHeight * 0.055,
      width: screenHeight * 0.055,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

export default Convert;
