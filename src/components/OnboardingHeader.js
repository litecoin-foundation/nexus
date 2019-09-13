import React from 'react';
import {View, Text, StyleSheet, SafeAreaView} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import PropTypes from 'prop-types';

const OnboardingHeader = props => {
  const {title, description, children} = props;
  return (
    <View style={styles.container}>
      <LinearGradient colors={['#7E58FF', '#4A4CDF']}>
        <SafeAreaView style={styles.safeAreaViewContainer}>
          <View style={styles.headerContainer}>
            <Text style={styles.headerTitleText}>{title}</Text>
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
  headerTitleText: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerDescriptionText: {
    color: '#FFFFFF',
    fontSize: 15,
    paddingBottom: 20,
    textAlign: 'center',
  },
});

OnboardingHeader.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  children: PropTypes.any,
};

export default OnboardingHeader;
