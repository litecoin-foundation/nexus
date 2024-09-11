import React from 'react';
import {Platform, SafeAreaView, StyleSheet, Text, View} from 'react-native';
import HeaderButton from '../../components/Buttons/HeaderButton';

interface Props {}

const SearchTransaction: React.FC<Props> = props => {
  return (
    <View style={styles.container}>
      <SafeAreaView>
        <Text>SearchTransaction</Text>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1162E6',
  },
  headerTitle: {
    fontFamily:
      Platform.OS === 'ios'
        ? 'Satoshi Variable'
        : 'SatoshiVariable-Regular.ttf',
    fontStyle: 'normal',
    fontWeight: '700',
    color: 'white',
    fontSize: 17,
  },
});

export const SearchTransactionNavigationOptions = navigation => {
  return {
    headerTitle: () => <Text style={styles.headerTitle}>Transactions</Text>,
    headerTitleAlign: 'left',
    headerTransparent: true,
    headerTintColor: 'white',
    headerLeft: () => (
      <HeaderButton
        onPress={() => navigation.goBack()}
        imageSource={require('../../assets/images/back-icon.png')}
      />
    ),
  };
};

export default SearchTransaction;
