import React, {useContext} from 'react';
import {DrawerActions, useNavigation} from '@react-navigation/native';

import HeaderButton from '../../../components/Buttons/HeaderButton';
import {ScreenSizeContext} from '../../../context/screenSize';

const MbsxMenuButton: React.FC = () => {
  const navigation = useNavigation();
  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);
  const size = SCREEN_HEIGHT * 0.018;

  return (
    <HeaderButton
      testID="mbsx-menu"
      onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
      imageSource={require('../../../assets/images/menu-icon.png')}
      tintColor="#ffffff"
      leftPadding
      imageXY={{x: size, y: size}}
    />
  );
};

export default MbsxMenuButton;
