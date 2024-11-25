import React, {useEffect} from 'react';
import {StyleSheet, Text, View, FlatList, Platform} from 'react-native';

import Header from '../../components/Header';
import {getTransactionHistory} from '../../reducers/buy';
import BuyTransactionCell from '../../components/Cells/BuyTransactionCell';
import HeaderButton from '../../components/Buttons/HeaderButton';
import {useAppDispatch, useAppSelector} from '../../store/hooks';

const BuyHistory: React.FC = () => {
  const dispatch = useAppDispatch();
  const {history} = useAppSelector(state => state.buy);

  useEffect(() => {
    dispatch(getTransactionHistory());
  }, [dispatch]);

  const EmptySectionList = (
    <View style={styles.emptySectionListContainer}>
      <Text style={styles.emptySectionListText}>
        Litecoin purchased with Nexus will appear here.
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
    backgroundColor: '#FAFAFA',
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
    fontFamily:
      Platform.OS === 'ios'
        ? 'Satoshi Variable'
        : 'SatoshiVariable-Regular.ttf',
    fontStyle: 'normal',
    fontWeight: '700',
    color: '#484859',
    fontSize: 12,
  },
  headerLeftMargin: {
    marginLeft: 22,
  },
  headerTitle: {
    fontFamily:
      Platform.OS === 'ios'
        ? 'Satoshi Variable'
        : 'SatoshiVariable-Regular.ttf',
    fontStyle: 'normal',
    fontWeight: '700',
    color: 'white',
    fontSize: 17,
  },
});

export const BuyHistoryNavigationOptions = navigation => {
  return {
    headerTitle: () => <Text style={styles.headerTitle}>Purchase History</Text>,
    headerTitleAlign: 'left',
    headerTransparent: true,
    headerTintColor: 'white',
    headerLeft: () => (
      <HeaderButton
        onPress={() => navigation.goBack()}
        imageSource={require('../../assets/images/back-icon.png')}
      />
    ),
  };
};

export default BuyHistory;
