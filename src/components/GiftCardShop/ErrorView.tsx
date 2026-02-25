import React, {useContext} from 'react';
import {View, TouchableOpacity, StyleSheet} from 'react-native';
import {colors, getSpacing, getCommonStyles} from './theme';

import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

export function ErrorView({
  message,
  messageKey,
  messageDomain,
  onRetry,
  onRetryText,
  onRetryTextKey,
  onRetryTextDomain,
}: {
  message?: string;
  messageKey?: string;
  messageDomain?: string;
  onRetry?: () => void;
  onRetryText?: string;
  onRetryTextKey?: string;
  onRetryTextDomain?: string;
}) {
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  return (
    <View style={styles.container}>
      {message ? (
        <TranslateText
          textValue={message}
          maxSizeInPixels={SCREEN_HEIGHT * 0.02}
          textStyle={[
            getCommonStyles(SCREEN_WIDTH, SCREEN_HEIGHT).subtitle,
            styles.text,
          ]}
          numberOfLines={3}
        />
      ) : messageKey && messageDomain ? (
        <TranslateText
          textKey={messageKey}
          domain={messageDomain}
          maxSizeInPixels={SCREEN_HEIGHT * 0.02}
          textStyle={[
            getCommonStyles(SCREEN_WIDTH, SCREEN_HEIGHT).subtitle,
            styles.text,
          ]}
          numberOfLines={3}
        />
      ) : (
        <></>
      )}

      {onRetry && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={getCommonStyles(SCREEN_WIDTH, SCREEN_HEIGHT).buttonRounded}
            onPress={onRetry}>
            {onRetryText ? (
              <TranslateText
                textValue={onRetryText}
                maxSizeInPixels={SCREEN_HEIGHT * 0.02}
                textStyle={
                  getCommonStyles(SCREEN_WIDTH, SCREEN_HEIGHT).buttonText
                }
              />
            ) : onRetryTextKey && onRetryTextDomain ? (
              <TranslateText
                textKey={onRetryTextKey}
                domain={onRetryTextDomain}
                maxSizeInPixels={SCREEN_HEIGHT * 0.02}
                textStyle={
                  getCommonStyles(SCREEN_WIDTH, SCREEN_HEIGHT).buttonText
                }
              />
            ) : (
              <TranslateText
                textValue="Try Again"
                maxSizeInPixels={SCREEN_HEIGHT * 0.02}
                textStyle={
                  getCommonStyles(SCREEN_WIDTH, SCREEN_HEIGHT).buttonText
                }
              />
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      padding: getSpacing(screenWidth, screenHeight).xl,
    },
    text: {
      width: '100%',
      color: colors.lightBlack,
      textAlign: 'center',
    },
    buttonContainer: {
      width: '100%',
      marginTop: getSpacing(screenWidth, screenHeight).lg,
    },
  });
