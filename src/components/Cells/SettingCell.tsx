import React, {useContext} from 'react';
import {TouchableOpacity, StyleSheet, Image} from 'react-native';

import Switch from '../Buttons/Switch';
import TranslateText from '../TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

interface Props {
  textKey: string;
  textDomain: string;
  children?: React.ReactNode;
  onPress?: () => void;
  forward?: boolean;
  switchEnabled?: boolean;
  fakeSwitch?: boolean;
  handleSwitch?: () => void;
  switchValue?: boolean;
  interpolationObj?: {
    [key: string]: any;
  };
}

const SettingCell: React.FC<Props> = props => {
  const {
    textKey,
    textDomain,
    children,
    onPress,
    forward,
    switchEnabled,
    fakeSwitch,
    handleSwitch,
    switchValue,
    interpolationObj,
  } = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <TranslateText
        textKey={textKey}
        domain={textDomain}
        textStyle={styles.title}
        maxSizeInPixels={SCREEN_HEIGHT * 0.017}
        interpolationObj={interpolationObj}
      />
      {children}
      {forward ? (
        <Image source={require('../../assets/images/forward.png')} />
      ) : null}
      {switchEnabled ? (
        <Switch
          initialValue={switchValue}
          onPress={fakeSwitch ? onPress : handleSwitch}
          fakeSwitch={fakeSwitch}
        />
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
      fontSize: 14,
    },
  });

export default SettingCell;
