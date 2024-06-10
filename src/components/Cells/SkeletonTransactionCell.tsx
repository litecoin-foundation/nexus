import {StyleSheet, Text, View} from 'react-native';
import React from 'react';
import {Dimensions} from 'react-native';

interface Props {}

const SkeletonTransactionCell: React.FC<Props> = props => {
  return (
    <View style={styles.container}>
      <View style={styles.circle} />
      <View style={styles.left}>
        <View style={styles.topskeleton} />
        <View style={styles.bottomskeleton} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    height: 70,
    width: Dimensions.get('window').width,
    alignItems: 'center',
    paddingHorizontal: 19,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(214, 216, 218, 0.3)',
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 32 / 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F4F4',
  },
  left: {
    flexGrow: 1,
    paddingLeft: 11,
    gap: 8,
  },
  topskeleton: {
    backgroundColor: '#F4F4F4',
    width: 169,
    height: 10,
    borderRadius: 3,
  },
  bottomskeleton: {
    backgroundColor: '#F4F4F4',
    width: 94,
    height: 10,
    borderRadius: 3,
  },
});

export default SkeletonTransactionCell;
