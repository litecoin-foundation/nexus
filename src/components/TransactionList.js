import React from 'react';
import { View, SectionList, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

import TransactionCell from './TransactionCell';

const TransactionList = props => {
  const { groupedTransactions, onPress } = props;

  return (
    <View style={styles.container}>
      <SectionList
        sections={groupedTransactions}
        renderItem={({ item }) => <TransactionCell item={item} onPress={() => onPress(item)} />}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        keyExtractor={item => item.hash}
        initialNumToRender={7}
        ListEmptyComponent={<Text>Your transactions will appear here.</Text>}
        // currently setting the SectionList to inverted breaks the styling
        // so transaction grouping is manually inverting the arrays
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 500,
    position: 'absolute',
    bottom: 0
  },
  sectionHeader: {
    color: '#7C96AE',
    backgroundColor: 'white',
    opacity: 0.9,
    fontSize: 11,
    letterSpacing: -0.28,
    paddingLeft: 10
  }
});

TransactionList.propTypes = {
  groupedTransactions: PropTypes.arrayOf(PropTypes.object),
  onPress: PropTypes.func.isRequired
};

export default TransactionList;
