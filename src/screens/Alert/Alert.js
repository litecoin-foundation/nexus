import React, {useState} from 'react';
import {View, StyleSheet, FlatList, Text} from 'react-native';
import {useSelector, useDispatch} from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';

import Header from '../../components/Header';
import WhiteButton from '../../components/Buttons/WhiteButton';
import AlertCell from '../../components/Cells/AlertCell';
import AlertModal from '../../components/Modals/AlertModal';
import {removeAlert} from '../../reducers/alerts';

const Alert = () => {
  const dispatch = useDispatch();
  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [selectedID, setSelectedID] = useState(null);
  const {alerts} = useSelector(state => state.alerts);

  const handleAlertPress = id => {
    setSelectedID(id);
    setAlertModalVisible(true);
  };

  const EmptySectionList = (
    <View style={styles.emptySectionListContainer}>
      <Text style={styles.emptySectionListText}>
        Your alerts will appear here. Create alerts with the button above.
      </Text>
    </View>
  );

  return (
    <LinearGradient style={styles.container} colors={['#F6F9FC', '#d2e1ef00']}>
      <Header />
      <FlatList
        data={alerts}
        renderItem={({item}) => (
          <AlertCell data={item} onPress={id => handleAlertPress(id)} />
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

Alert.navigationOptions = ({navigation}) => {
  return {
    headerTitle: 'Alerts',
    headerTitleStyle: {
      fontWeight: 'bold',
      color: 'white',
    },
    headerRight: (
      <View style={styles.headerRight}>
        <WhiteButton
          value="CREATE"
          small={true}
          onPress={() => navigation.navigate('Dial')}
          active={true}
        />
      </View>
    ),
    headerTransparent: true,
    headerBackTitle: null,
    headerTintColor: 'white',
  };
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
  },
  emptySectionListText: {
    color: '#7C96AE',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default Alert;
