import {StyleSheet, FlatList} from 'react-native';
import React, {useState} from 'react';
import LinearGradient from 'react-native-linear-gradient';

import OptionCell from '../../components/Cells/OptionCell';
import Header from '../../components/Header';
import explorer from '../../assets/explorers';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {setExplorer} from '../../reducers/settings';

type ExplorerType = {
  name: string;
  key: string;
};

const Explorer: React.FC = () => {
  const dispatch = useAppDispatch();
  const {defaultExplorer} = useAppSelector(state => state.settings);
  const [selectedExplorer, setSelectedExplorer] = useState(defaultExplorer);

  const handlePress = (code: string): void => {
    setSelectedExplorer(code);
    dispatch(setExplorer(code));
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
        <FlatList data={explorer} renderItem={renderItem} />
      </LinearGradient>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgb(238,244,249)',
  },
});

export default Explorer;
