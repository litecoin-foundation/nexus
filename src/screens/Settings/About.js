import React from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import {useSelector} from 'react-redux';

import TableCell from '../../components/Cells/TableCell';
import VerticalTableCell from '../../components/Cells/VerticalTableCell';

const About = () => {
  const {
    syncedToChain,
    blockHeight,
    blockHash,
    bestHeaderTimeStamp,
    version,
  } = useSelector((state) => state.info);

  return (
    <View style={styles.container}>
      <Text style={styles.titleText}>DEBUG INFO</Text>
      <ScrollView>
        <TableCell title="Synced to Chain?" value={syncedToChain} />
        <TableCell title="Block Height" value={blockHeight} />
        <VerticalTableCell title="Blockhash">
          <Text style={styles.text}>{blockHash}</Text>
        </VerticalTableCell>
        <TableCell
          title="bestHeaderTimeStamp"
          value={`${new Date(bestHeaderTimeStamp * 1000)}`}
        />
        <TableCell title="LND version" value={version} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgb(238,244,249)',
  },
  titleText: {
    color: '#7C96AE',
    fontSize: 12,
    fontWeight: '600',
  },
  text: {
    color: '#4A4A4A',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

About.navigationOptions = () => {
  return {
    headerTitle: 'General',
    headerTitleStyle: {
      fontWeight: 'bold',
      color: 'white',
    },
    headerTransparent: true,
    headerBackTitleVisible: false,
    headerTintColor: 'white',
  };
};

export default About;
