import React from 'react';
import {View, Text, StyleSheet, SafeAreaView, Platform} from 'react-native';

interface Props {
  description: string;
  children?: React.ReactNode;
}

const OnboardingHeader: React.FC<Props> = props => {
  const {description, children} = props;
  return (
    <SafeAreaView>
      <View style={styles.headerContainer}>
        <Text style={styles.headerDescriptionText}>{description}</Text>
        {children}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    marginTop: 50,
  },
  headerDescriptionText: {
    fontFamily:
      Platform.OS === 'ios'
        ? 'Satoshi Variable'
        : 'SatoshiVariable-Regular.ttf',
    fontStyle: 'normal',
    fontWeight: '600',
    color: 'white',
    fontSize: 18,
    paddingLeft: 67,
    paddingRight: 29,
  },
});

export default OnboardingHeader;
