import React, {useState} from 'react';
import {View, StyleSheet, FlatList, Text, Platform} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import Header from '../../components/Header';
import AlertCell from '../../components/Cells/AlertCell';
import AlertModal from '../../components/Modals/AlertModal';
import {removeAlert} from '../../reducers/alerts';
import HeaderButton from '../../components/Buttons/HeaderButton';
import {useAppDispatch, useAppSelector} from '../../store/hooks';

interface Props {}

const Alert: React.FC<Props> = () => {
  const dispatch = useAppDispatch();
  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [selectedID, setSelectedID] = useState('');
  const {alerts} = useAppSelector(state => state.alerts);

  const handleAlertPress = (index: string) => {
    setSelectedID(index);
    setAlertModalVisible(true);
  };

  const EmptySectionList = (
    <View style={styles.emptySectionListContainer}>
      <Text style={styles.emptySectionListText}>
        Create alerts to be notified when the price of Litecoin hits a target
        value.
      </Text>
      <View style={{paddingTop: 14}} />
      <Text style={styles.emptySectionListText}>
        Your alerts will appear here.
      </Text>
    </View>
  );

  return (
    <LinearGradient
      style={styles.container}
      colors={['#F6F9FC', 'rgb(238,244,249)']}>
      <Header />
      <FlatList
        data={alerts}
        renderItem={({item}) => (
          <AlertCell
            data={item}
            onPress={(id: string) => handleAlertPress(id)}
          />
        )}
        ListEmptyComponent={EmptySectionList}
      />
      <AlertModal
        isVisible={alertModalVisible}
        close={() => setAlertModalVisible(false)}
        onPress={() => dispatch(removeAlert(selectedID))}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRight: {
    paddingRight: 18,
  },
  emptySectionListContainer: {
    marginTop: 30,
    alignItems: 'center',
    paddingHorizontal: 34,
  },
  emptySectionListText: {
    color: '#7C96AE',
    fontFamily: 'Satoshi Variable',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 12,
    textAlign: 'center',
  },
  headerTitle: {
    fontFamily: 'Satoshi Variable',
    fontStyle: 'normal',
    fontWeight: '700',
    color: 'white',
    fontSize: 17,
  },
});

export const AlertNavigationOptions = navigation => {
  return {
    headerTitle: () => <Text style={styles.headerTitle}>Price Alerts</Text>,
    headerTitleAlign: 'left',
    headerLeft: () => (
      <HeaderButton
        onPress={() => navigation.goBack()}
        imageSource={require('../../assets/images/back-icon.png')}
      />
    ),
    headerRight: () => (
      <HeaderButton
        title="Create Alert"
        onPress={() => navigation.navigate('Dial')}
        rightPadding={true}
      />
    ),
  };
};

export default Alert;
