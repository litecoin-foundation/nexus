import React, {useEffect} from 'react';
import {StyleSheet, Text, View, FlatList} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';

import Header from '../../components/Header';
import {getTransactionHistory} from '../../reducers/buy';
import BuyTransactionCell from '../../components/Cells/BuyTransactionCell';

const History = () => {
  const dispatch = useDispatch();
  const {history} = useSelector(state => state.buy);

  useEffect(() => {
    dispatch(getTransactionHistory());
  }, [dispatch]);

  const EmptySectionList = (
    <View style={styles.emptySectionListContainer}>
      <Text style={styles.emptySectionListText}>
        Litecoin purchased with Plasma will appear here.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header />
      <View style={styles.listContainer}>
        <FlatList
          data={history}
          renderItem={({item}) => (
            <BuyTransactionCell data={item} onPress={null} />
          )}
          ListEmptyComponent={EmptySectionList}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgb(238,244,249)',
  },
  descriptionText: {
    color: '#7C96AE',
    fontSize: 12,
    fontWeight: '600',
  },
  listContainer: {
    flex: 1,
    paddingTop: 10,
  },
  emptySectionListContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  emptySectionListText: {
    color: '#7C96AE',
    fontSize: 12,
    fontWeight: '600',
  },
});

History.navigationOptions = () => {
  return {
    headerTitle: 'History',
  };
};

export default History;
