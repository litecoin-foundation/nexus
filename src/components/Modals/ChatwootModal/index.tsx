import React, {useEffect, useState} from 'react';
import {
  Appearance,
  KeyboardAvoidingView,
  StyleSheet,
  Platform,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
  SafeAreaProvider,
} from 'react-native-safe-area-context';

import {storeHelper, findColors} from './utils';
import WebView from './WebView';

interface ChatwootModalProps {
  websiteToken: string;
  baseUrl: string;
  cwCookie?: string;
  user?: {
    name: string;
    avatar_url?: string;
    email: string;
    identifier: string;
    identifier_hash: string;
  };
  locale?: string;
  colorScheme?: 'light' | 'auto' | 'dark';
  customAttributes?: Record<string, unknown>;
  closeModal: () => void;
}

const ChatwootModalContent = ({
  baseUrl,
  websiteToken,
  user,
  locale = 'en',
  colorScheme = 'light',
  customAttributes = {},
  closeModal,
}: ChatwootModalProps) => {
  const [cwCookie, setCookie] = useState('');
  const insets = useSafeAreaInsets();

  useEffect(() => {
    async function fetchData() {
      const value = await storeHelper.getCookie();
      setCookie(value);
    }
    fetchData();
  }, []);

  const appColorScheme = Appearance.getColorScheme();

  const {headerBackgroundColor, mainBackgroundColor} = findColors({
    colorScheme,
    appColorScheme,
  });

  // Render content based on platform
  const renderContent = () => {
    const content = (
      <>
        <SafeAreaView
          style={[styles.headerView, {backgroundColor: headerBackgroundColor}]}
          edges={['top']}
        />
        <SafeAreaView
          style={[styles.mainView, {backgroundColor: mainBackgroundColor}]}
          edges={['bottom', 'left', 'right']}>
          <View
            style={[
              {flex: 1},
              Platform.OS === 'android' ? {paddingBottom: insets.bottom} : null,
            ]}>
            <WebView
              websiteToken={websiteToken}
              cwCookie={cwCookie}
              user={user}
              baseUrl={baseUrl}
              locale={locale}
              colorScheme={colorScheme}
              customAttributes={customAttributes}
              closeModal={closeModal}
            />
          </View>
        </SafeAreaView>
      </>
    );

    // Use KeyboardAvoidingView only on Android
    if (Platform.OS === 'android') {
      return (
        <KeyboardAvoidingView
          style={styles.container}
          behavior="height"
          keyboardVerticalOffset={25}>
          {content}
        </KeyboardAvoidingView>
      );
    }

    return <View style={styles.container}>{content}</View>;
  };

  return renderContent();
};

const ChatwootModal = (props: ChatwootModalProps) => {
  return (
    <SafeAreaProvider>
      <ChatwootModalContent {...props} />
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modal: {
    flex: 1,
    margin: 0,
    paddingVertical: 0,
  },
  mainView: {
    flex: 1,
  },
  headerView: {
    flex: 0,
  },
});

export default ChatwootModal;
