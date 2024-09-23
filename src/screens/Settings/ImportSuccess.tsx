import React from 'react';
import {Platform, StyleSheet, Text, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import WhiteButton from '../../components/Buttons/WhiteButton';
import WhiteClearButton from '../../components/Buttons/WhiteClearButton';
import HeaderButton from '../../components/Buttons/HeaderButton';
import {StackNavigationProp} from '@react-navigation/stack';
import {RouteProp} from '@react-navigation/native';

type RootStackParamList = {
  ImportSuccess: {
    txHash: string;
  };
  NewWalletStack: undefined;
};

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'ImportSuccess'>;
  route: RouteProp<RootStackParamList, 'ImportSuccess'>;
}

const ImportSuccess: React.FC<Props> = props => {
  const {navigation, route} = props;

  const handleViewTxPress = () => {
    console.log('view tx');
  };

  const handleClosePress = () => {
    navigation.replace('NewWalletStack');
  };

  return (
    <LinearGradient colors={['#1162E6', '#0F55C7']} style={styles.container}>
      <Text>{route.params.txHash}</Text>
      <View style={styles.buttonContainer}>
        <WhiteButton
          value="View Transaction"
          small={false}
          active={true}
          onPress={() => handleViewTxPress()}
        />
        <WhiteClearButton
          value="View Transaction"
          small={false}
          onPress={() => handleClosePress()}
        />
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  buttonContainer: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 50,
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

export const ImportSuccessNavigationOptions = navigation => {
  return {
    headerTitle: '',
    headerTransparent: true,
  };
};

export default ImportSuccess;
