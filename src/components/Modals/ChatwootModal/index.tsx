import React, {useEffect, useState} from 'react';
import {SafeAreaView, Appearance, StyleSheet} from 'react-native';
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

const ChatwootModal = ({
  baseUrl,
  websiteToken,
  user,
  locale = 'en',
  colorScheme = 'light',
  customAttributes = {},
  closeModal,
}: ChatwootModalProps) => {
  const [cwCookie, setCookie] = useState('');

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
  return (
    <>
      <SafeAreaView
        style={[styles.headerView, {backgroundColor: headerBackgroundColor}]}
      />
      <SafeAreaView
        style={[styles.mainView, {backgroundColor: mainBackgroundColor}]}>
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
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
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
