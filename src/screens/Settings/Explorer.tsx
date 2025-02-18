import {StyleSheet, FlatList} from 'react-native';
import React, {useState} from 'react';
import LinearGradient from 'react-native-linear-gradient';

import OptionCell from '../../components/Cells/OptionCell';
import Header from '../../components/Header';
import explorers from '../../assets/explorers';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {setExplorer} from '../../reducers/settings';
import HeaderButton from '../../components/Buttons/HeaderButton';
import TranslateText from '../../components/TranslateText';

type ExplorerType = {
  name: string;
  key: string;
};

const Explorer: React.FC = () => {
  const dispatch = useAppDispatch();
  const {defaultExplorer} = useAppSelector(state => state.settings);
  const [selectedExplorer, setSelectedExplorer] = useState(defaultExplorer);

  const handlePress = (explorerKey: string): void => {
    setSelectedExplorer(explorerKey);
    dispatch(setExplorer(explorerKey));
  };

  const renderItem = ({item}: {item: ExplorerType}) => (
    <OptionCell
      title={`${item.name}`}
      key={item.key}
      onPress={() => handlePress(item.key)}
      selected={selectedExplorer === item.key ? true : false}
    />
  );

  return (
    <>
      <LinearGradient
        style={styles.container}
        colors={['#F2F8FD', '#d2e1ef00']}>
        <Header />
        <TranslateText
          textKey="select_block_explorer_note"
          domain="settingsTab"
          textStyle={styles.headerText}
        />
        <FlatList data={explorers} renderItem={renderItem} />
      </LinearGradient>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  headerTitle: {
    fontFamily: 'Satoshi Variable',
    fontStyle: 'normal',
    fontWeight: '700',
    color: 'white',
    fontSize: 17,
  },
  headerText: {
    color: '#484859',
    paddingTop: 10,
    paddingBottom: 10,
    fontFamily: 'Satoshi Variable',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

export const ExplorerNavigationOptions = (navigation: any) => {
  return {
    headerTitle: () => (
      <TranslateText
        textKey="select_block_explorer"
        domain="settingsTab"
        textStyle={styles.headerTitle}
      />
    ),
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

export default Explorer;
