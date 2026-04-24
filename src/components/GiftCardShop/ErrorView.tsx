import React, {useContext} from 'react';
import {View, StyleSheet} from 'react-native';
import {colors, getSpacing, getCommonStyles} from './theme';

import BlueRoundButton from '../Buttons/BlueRoundButton';
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
          {onRetryText ? (
            <BlueRoundButton value={onRetryText} onPress={onRetry} />
          ) : onRetryTextKey && onRetryTextDomain ? (
            <BlueRoundButton
              textKey={onRetryTextKey}
              textDomain={onRetryTextDomain}
              onPress={onRetry}
            />
          ) : (
            <BlueRoundButton value="Try Again" onPress={onRetry} />
          )}
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
