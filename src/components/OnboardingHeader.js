import React from 'react';
import {View, Text, StyleSheet, SafeAreaView} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const OnboardingHeader = props => {
  const {description, children} = props;
  return (
    <View style={styles.container}>
      <LinearGradient colors={['#7E58FF', '#4A4CDF']}>
        <SafeAreaView style={styles.safeAreaViewContainer}>
          <View style={styles.headerContainer}>
            <Text style={styles.headerDescriptionText}>{description}</Text>
            {children}
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 220,
  },
  safeAreaViewContainer: {
    height: '100%',
  },
  headerContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerDescriptionText: {
    color: '#FFFFFF',
    fontSize: 15,
    paddingTop: 60,
    paddingBottom: 20,
    textAlign: 'center',
  },
});

export default OnboardingHeader;
