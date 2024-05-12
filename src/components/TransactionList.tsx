import React, {
  useCallback,
  useState,
  forwardRef,
  useRef,
  useImperativeHandle,
  MutableRefObject,
} from 'react';
import {
  StyleSheet,
  Text,
  View,
  SectionList,
  RefreshControl,
  SectionListRenderItem,
  Platform,
} from 'react-native';

import {useAppDispatch} from '../store/hooks';
import {getTransactions} from '../reducers/transaction';
import TransactionCell from './Cells/TransactionCell';
import Animated, {
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

interface Props {
  onPress(item: ItemType): void;
  transactions: ITransactions[];
  onViewableItemsChanged(): void;
}

interface ITransactions {
  title: string;
  data: IData[];
}

interface IData {
  hash: string;
  amount: number;
  confs: number;
  day: string;
  fee: undefined;
  lightning: boolean;
  sent: boolean;
  time: Date;
  addresses: string[];
  timestamp: number;
}

type ItemType = {
  time: Date;
  amount: number;
  sent: boolean;
  hash: string;
};

const TransactionList = forwardRef((props: Props, ref) => {
  const transactionListRef = useRef() as MutableRefObject<
    SectionList<any, ITransactions>
  >;

  useImperativeHandle(ref, () => ({
    scrollToLocation: (sectionIndex: number) => {
      transactionListRef.current?.scrollToLocation({
        animated: true,
        sectionIndex: sectionIndex,
        itemIndex: 0,
        viewPosition: 0,
      });
    },
  }));

  const {onPress, transactions, onViewableItemsChanged} = props;
  const dispatch = useAppDispatch();

  const [refreshing, setRefreshing] = useState<boolean>(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    dispatch(getTransactions());
    setRefreshing(false);
  }, [dispatch]);

  const EmptySectionList = (
    <View style={styles.emptySectionListContainer}>
      <Text style={styles.emptySectionListText}>
        Your transactions will appear here.
      </Text>
    </View>
  );

  const renderItem: SectionListRenderItem<ItemType, ITransactions> = ({
    item,
  }) => <TransactionCell item={item} onPress={() => onPress(item)} />;

  const translationY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler(event => {
    translationY.value = event.contentOffset.y;
  });

  const headerHeightAnim = useAnimatedStyle(() => {
    return {
      // height: translationY.value,
      opacity: interpolate(translationY.value, [0, 100], [1, 0]),
    };
  });

  const AnimatedSectionList = Animated.createAnimatedComponent(SectionList);

  return (
    <>
      <Animated.View
        style={[{backgroundColor: 'red', height: 200}, headerHeightAnim]}
      />
      <View style={styles.container}>
        <AnimatedSectionList
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          ref={transactionListRef}
          sections={transactions}
          stickySectionHeadersEnabled={true}
          renderItem={renderItem}
          viewabilityConfig={{viewAreaCoveragePercentThreshold: 80}}
          renderSectionHeader={({section}) => (
            <View style={styles.sectionHeaderContainer}>
              <Text style={styles.sectionHeaderText}>{section.title}</Text>
            </View>
          )}
          keyExtractor={item => item.hash}
          initialNumToRender={7}
          ListEmptyComponent={EmptySectionList}
          ListFooterComponent={<View style={styles.emptyView} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onViewableItemsChanged={onViewableItemsChanged}
        />
      </View>
    </>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionHeaderContainer: {
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(214, 216, 218, 0.3)',
    backgroundColor: 'white',
    paddingLeft: 20,
  },
  sectionHeaderText: {
    fontFamily:
      Platform.OS === 'ios'
        ? 'Satoshi Variable'
        : 'SatoshiVariable-Regular.ttf',
    fontStyle: 'normal',
    fontWeight: '700',
    color: '#747E87',
    fontSize: 12,
  },
  emptySectionListContainer: {
    marginTop: 30,
  },
  emptySectionListText: {
    fontFamily:
      Platform.OS === 'ios'
        ? 'Satoshi Variable'
        : 'SatoshiVariable-Regular.ttf',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 12,
    color: '#747E87',
  },
  emptyView: {
    height: 350,
  },
});

export default TransactionList;
