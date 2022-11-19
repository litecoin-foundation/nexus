import {StyleSheet, View, FlatList} from 'react-native';
import React, {forwardRef, useImperativeHandle, useRef} from 'react';

import WhiteButton from './Buttons/WhiteButton';
import {formatMonths} from '../lib/utils/date';

interface Props {
  selectedTimestamp: number | null;
  transactions: ITransactions[];
  handlePress(item: IOptions['hash'], timestamp: IOptions['timestamp']): void;
}

interface ITransactions {
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

interface IOptions {
  title: string;
  hash: string;
  timestamp: number;
}

const TxDatePicker = forwardRef((props: Props, ref) => {
  const {selectedTimestamp, transactions, handlePress} = props;

  let options: IOptions[] = [];
  const DatePickerRef = useRef<FlatList>(null);

  let currentHeaderTx = formatMonths(selectedTimestamp! * 1000);

  useImperativeHandle(ref, () => ({
    scrollToItem: () => {
      DatePickerRef.current?.scrollToIndex({animated: true, index: 1});
    },
  }));

  transactions.map(tx => {
    const month = formatMonths(tx.timestamp * 1000);

    if (!options.some(e => e.title === month)) {
      options.push({
        title: month,
        hash: tx.hash,
        timestamp: tx.timestamp,
      });
    }
  });

  const ListFooterComponent = <View style={styles.emptyView} />;
  const ListEmptyComponent = <View />;

  return (
    <View style={styles.container}>
      <FlatList
        ref={DatePickerRef}
        data={options}
        horizontal={true}
        inverted={true}
        ListHeaderComponent={ListFooterComponent}
        showsHorizontalScrollIndicator={false}
        ListEmptyComponent={ListEmptyComponent}
        renderItem={({item}) => {
          return (
            <WhiteButton
              value={item.title}
              small={true}
              onPress={() => handlePress(item.hash, item.timestamp)}
              customFontStyles={styles.smallFont}
              key={item.hash}
              active={currentHeaderTx === item.title ? true : false}
            />
          );
        }}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingTop: 15,
  },
  smallFont: {
    fontSize: 11,
  },
  emptyView: {
    width: 165,
  },
});

export default TxDatePicker;
