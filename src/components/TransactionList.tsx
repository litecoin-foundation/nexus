import React, {
  useCallback,
  useState,
  forwardRef,
  useRef,
  useImperativeHandle,
  MutableRefObject,
} from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  View,
  SectionList,
  SectionListRenderItem,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import {SharedValue} from 'react-native-reanimated';

import {useAppDispatch} from '../store/hooks';
import {getTransactions} from '../reducers/transaction';
import TransactionCell from './Cells/TransactionCell';
import TransactionListEmpty from './TransactionListEmpty';

interface Props {
  onPress(item: ItemType): void;
  transactions: ITransactions[];
  onViewableItemsChanged(): void;
  folded: boolean;
  foldUnfold: (isFolded: boolean) => void;
}

interface ITransactions {
  title: string;
  data: IData[];
}

interface IData {
  hash: string;
  blockHeight: number,
  amount: number;
  confs: number;
  day: string;
  fee: undefined;
  lightning: boolean;
  sent: boolean;
  time: Date;
  addresses: string[];
  inputTxs: string[];
  timestamp: number;
}

type ItemType = {
  time: Date;
  amount: number;
  sent: boolean;
  hash: string;
};

const UNFOLD_SHEET_POINT = Dimensions.get('screen').height * 0.24;
const FOLD_SHEET_POINT = Dimensions.get('screen').height * 0.47;

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

  const {onPress, transactions, onViewableItemsChanged, folded, foldUnfold} = props;
  const dispatch = useAppDispatch();

  const [refreshing, setRefreshing] = useState<boolean>(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    dispatch(getTransactions());
    setRefreshing(false);
  }, [dispatch]);

  const renderItem: SectionListRenderItem<ItemType, ITransactions> = ({
    item,
  }) => <TransactionCell item={item} onPress={() => onPress(item)} />;

  // DashboardButton is 110, txTitleContainer is 70
  const scrollContainerHeight = folded ?
    Dimensions.get('screen').height - FOLD_SHEET_POINT - 110 - 70 :
    Dimensions.get('screen').height - UNFOLD_SHEET_POINT - 110 - 70;

  return (
    <View style={{height: scrollContainerHeight}}>
      <SectionList
        bounces={false}
        scrollEventThrottle={1}
        onScrollBeginDrag={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
          foldUnfold(true);
        }}
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
        initialNumToRender={9}
        ListEmptyComponent={<TransactionListEmpty />}
        ListFooterComponent={<View style={styles.emptyView} />}
        // refreshControl={
        //   <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        // }
        onViewableItemsChanged={onViewableItemsChanged}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  sectionHeaderContainer: {
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(214, 216, 218, 0.3)',
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
  emptyView: {
    height: 200,
  },
  item: {
    backgroundColor: '#f9c2ff',
    padding: 20,
    marginVertical: 8,
  },
  header: {
    fontSize: 32,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
  },
});

export default TransactionList;
