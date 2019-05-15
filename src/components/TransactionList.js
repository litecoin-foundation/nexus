import React from 'react';
import { View, SectionList, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

import TransactionCell from './TransactionCell';

const TransactionList = props => {
  const { groupedTransactions, navigation } = props;

  let emptyList;
  if (groupedTransactions === undefined || groupedTransactions.length === 0) {
    emptyList = <Text>Your transactions will appear here.</Text>;
  }

  return (
    <View style={styles.container}>
      {emptyList}
      <SectionList
        sections={groupedTransactions}
        renderItem={({ item }) => (
          <TransactionCell
            item={item}
            onPress={() => navigation.navigate('Transaction', { item })}
          />
        )}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        keyExtractor={item => item.txHash}
        initialNumToRender={6}
        // currently setting the SectionList to inverted breaks the styling
        // so transaction grouping is manually inverting the arrays
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 400,
    position: 'absolute',
    bottom: 0
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    backgroundColor: 'white'
  }
});

TransactionList.propTypes = {
  groupedTransactions: PropTypes.arrayOf(PropTypes.object),
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired
  }).isRequired
};

export default TransactionList;
