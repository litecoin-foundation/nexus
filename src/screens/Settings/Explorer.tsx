import React, {useState, useContext} from 'react';
import {StyleSheet, FlatList} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {StackNavigationOptions} from '@react-navigation/stack';

import OptionCell from '../../components/Cells/OptionCell';
import Header from '../../components/Header';
import explorers from '../../assets/explorers';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {setExplorer} from '../../reducers/settings';
import HeaderButton from '../../components/Buttons/HeaderButton';

import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

type ExplorerType = {
  name: string;
  key: string;
};

const Explorer: React.FC = () => {
  const dispatch = useAppDispatch();

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

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
          maxSizeInPixels={SCREEN_HEIGHT * 0.017}
        />
        <FlatList data={explorers} renderItem={renderItem} />
      </LinearGradient>
    </>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
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

export const ExplorerNavigationOptions = (
  navigation: any,
): StackNavigationOptions => {
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  return {
    headerTitle: () => (
      <TranslateText
        textKey="select_block_explorer"
        domain="settingsTab"
        maxSizeInPixels={SCREEN_HEIGHT * 0.022}
        textStyle={styles.headerTitle}
        numberOfLines={1}
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
