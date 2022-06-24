import React from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import {useSelector} from 'react-redux';

import TableCell from '../../components/Cells/TableCell';
import VerticalTableCell from '../../components/Cells/VerticalTableCell';
import Header from '../../components/Header';

const About = () => {
  const {
    syncedToChain,
    sycnedToGraph,
    blockHeight,
    blockHash,
    bestHeaderTimestamp,
    version,
  } = useSelector(state => state.info);

  return (
    <View style={styles.container}>
      <Header />
      <Text style={styles.titleText}>DEBUG INFO</Text>
      <ScrollView>
        <TableCell
          title="Synced to Chain?"
          value={`${syncedToChain === true ? 'true' : 'false'}`}
        />
        <TableCell
          title="Synced to Graph?"
          value={`${sycnedToGraph === true ? 'true' : 'false'}`}
        />
        <TableCell title="Block Height" value={blockHeight} />
        <VerticalTableCell title="Blockhash">
          <Text style={styles.text}>{blockHash}</Text>
        </VerticalTableCell>
        <VerticalTableCell title="bestHeaderTimestamp">
          <Text style={styles.text}>{`${new Date(
            bestHeaderTimestamp * 1000,
          )}`}</Text>
        </VerticalTableCell>

        <VerticalTableCell title="LND version">
          <Text style={styles.text}>{version}</Text>
        </VerticalTableCell>
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
    paddingLeft: 10,
    paddingTop: 15,
    paddingBottom: 5,
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
  };
};

export default About;
