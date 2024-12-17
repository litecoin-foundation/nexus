import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import DashboardButton from '../../../src/components/Buttons/DashboardButton';

export type HeaderProps = {

};

const Header = ({}: HeaderProps) => {

  const [activeTab, setActiveTab] = useState(0);
  
  const isInternetReachable = true;
  
  return (
    <View style={styles.headerContainer}>
      <DashboardButton
        title="Buy"
        imageSource={require('../../../src/assets/icons/buy-icon.png')}
        handlePress={() => setActiveTab(1)}
        active={activeTab === 1}
        textPadding={8}
        disabled={!isInternetReachable ? true : false}
      />
      <DashboardButton
        title="Sell"
        imageSource={require('../../../src/assets/icons/sell-icon.png')}
        handlePress={() => setActiveTab(2)}
        active={activeTab === 2}
        textPadding={7}
        disabled={!isInternetReachable ? true : false}
      />
      <DashboardButton
        title="Convert"
        wider={true}
        imageSource={require('../../../src/assets/icons/convert-icon.png')}
        handlePress={() => setActiveTab(3)}
        active={activeTab === 3}
        textPadding={18}
        disabled={!isInternetReachable ? true : false}
      />
      <DashboardButton
        title="Send"
        imageSource={require('../../../src/assets/icons/send-icon.png')}
        handlePress={() => setActiveTab(4)}
        active={activeTab === 4}
        textPadding={11}
        disabled={!isInternetReachable ? true : false}
      />
      <DashboardButton
        title="Receive"
        imageSource={require('../../../src/assets/icons/receive-icon.png')}
        handlePress={() => setActiveTab(5)}
        active={activeTab === 5}
        textPadding={18}
        disabled={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    marginTop: 5,
    flexDirection: 'row',
    justifyContent: 'center',
  },
});

export default Header;