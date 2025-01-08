import React from 'react';
import {View, StyleSheet} from 'react-native';

import {StackNavigationProp, TransitionPresets} from '@react-navigation/stack';

import Header from '../../components/Header';
import HeaderButton from '../../components/Buttons/HeaderButton';
import ChatwootModal from '../../components/Modals/ChatwootModal';
import {useAppSelector} from '../../store/hooks';

type RootStackParamList = {
  Support: undefined;
};

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'Support'>;
}

const Support: React.FC<Props> = props => {
  const {navigation} = props;
  const {uniqueId} = useAppSelector(state => state.onboarding);

  const user = {
    identifier: `${uniqueId}`,
    name: 'bruh man',
    avatar_url: 'poopy@gmail.com',
    email: 'john@gmail.com',

    // name: string;
    //     avatar_url: string;
    //     email: string;
    //     identifier: string;
  };
  const customAttributes = {
    deviceos: 'ppoyooyp',
  };
  const websiteToken = 'SH4YF5fA3sHFqhHvKt23aQzz';
  const baseUrl = 'https://chat-mobile.litecoin.com';
  const locale = 'en';
  return (
    <View style={styles.container}>
      <Header modal={true} />

      <ChatwootModal
        websiteToken={websiteToken}
        locale={locale}
        baseUrl={baseUrl}
        closeModal={() => navigation.goBack()}
        user={user}
        customAttributes={customAttributes}
        colorScheme="light"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    height: 400,
  },
  optionsContainer: {
    height: 100,
    backgroundColor: '#1D385F',
    justifyContent: 'space-around',
    alignItems: 'center',
    flexDirection: 'row',
  },
  opacity: {
    opacity: 0.4,
  },
  headerButtonContainer: {
    paddingTop: 30,
  },
});

export const SupportNavigationOptions = navigation => {
  return {
    ...TransitionPresets.ModalPresentationIOS,
    headerTitle: '',
    headerTransparent: true,
    headerBackTitleVisible: false,
    headerTintColor: 'white',
    headerLeft: () => (
      <View style={styles.headerButtonContainer}>
        <HeaderButton
          onPress={() => navigation.goBack()}
          imageSource={require('../../assets/images/back-icon.png')}
          title="BACK"
        />
      </View>
    ),
  };
};

export default Support;
