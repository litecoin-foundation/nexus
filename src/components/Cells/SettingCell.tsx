import React from 'react';
import {TouchableOpacity, StyleSheet, Image} from 'react-native';

import Switch from '../Buttons/Switch';
import TranslateText from '../TranslateText';

interface Props {
  textKey: string;
  textDomain: string;
  children?: React.ReactNode;
  onPress?: () => void;
  forward?: boolean;
  switchEnabled?: boolean;
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
    handleSwitch,
    switchValue,
    interpolationObj,
  } = props;
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <TranslateText
        textKey={textKey}
        domain={textDomain}
        textStyle={styles.title}
        interpolationObj={interpolationObj}
      />
      {children}
      {forward ? (
        <Image source={require('../../assets/images/forward.png')} />
      ) : null}
      {switchEnabled ? (
        <Switch initialValue={switchValue} onPress={handleSwitch} />
      ) : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
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
