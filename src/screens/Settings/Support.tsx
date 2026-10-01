import React from 'react';
import {View, StyleSheet} from 'react-native';

import {
  StackNavigationOptions,
  StackNavigationProp,
  TransitionPresets,
} from '@react-navigation/stack';

import ScreenHeader, {
  ScreenHeaderCard,
  ScreenHeaderNavigationOptions,
  useScreenHeaderArrival,
  useScreenHeaderLayout,
} from '../../components/ScreenHeader';
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
  const {uniqueId, supportId} = useAppSelector(state => state.onboarding);
  const {languageCode} = useAppSelector(state => state.settings);
  const {cardHeight, rects, paddingHorizontal} = useScreenHeaderLayout(true);
  const headerFadeStyle = useScreenHeaderArrival();

  console.log(supportId);

  const getChatwootLocale = (appLanguageCode: string): string => {
    const languageMap: Record<string, string> = {
      fr: 'fr',
      es: 'es',
      ru: 'ru',
    };

    return languageMap[appLanguageCode] || 'en';
  };

  const user = {
    identifier: uniqueId,
    name: '',
    email: '',
    identifier_hash: supportId,
  };
  const customAttributes = {
    nexusversion: 3,
  };
  const websiteToken = 'SH4YF5fA3sHFqhHvKt23aQzz';
  const baseUrl = 'https://support.nexuswallet.com';
  const locale = getChatwootLocale(languageCode);
  return (
    <View style={styles.container}>
      <View style={[styles.container, {paddingTop: cardHeight}]}>
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
      <ScreenHeaderCard cardHeight={cardHeight} rounded={false} />
      <ScreenHeader
        rects={rects}
        paddingHorizontal={paddingHorizontal}
        fadeStyle={headerFadeStyle}
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
});

export const SupportNavigationOptions: StackNavigationOptions = {
  ...TransitionPresets.ModalPresentationIOS,
  ...ScreenHeaderNavigationOptions,
};

export default Support;
