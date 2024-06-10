import {StyleSheet, Text, View, KeyboardAvoidingView} from 'react-native';
import React, {useState} from 'react';
import Modal from 'react-native-modal';
import SegmentedControl from '@react-native-segmented-control/segmented-control';

import GreyRoundButton from '../Buttons/GreyRoundButton';
import VerticalTableCell from '../Cells/VerticalTableCell';
import TableCell from '../Cells/TableCell';
import BlueButton from '../Buttons/BlueButton';
import SwitchButton from '../Buttons/Switch';
import InputField from '../InputField';

interface Props {
  close(): void;
  onPress(
    segmentOption: number,
    switchOption: boolean,
    searchField: string | undefined,
  ): void;
  isVisible: boolean;
}

const TransactionFilterModal: React.FC<Props> = props => {
  const {close, isVisible, onPress} = props;

  const [segmentOption, setSegmentOption] = useState<number>(0);
  const [switchOption, setSwitchOption] = useState<boolean>(true);
  const [searchField, setSearchField] = useState<string>();

  return (
    <Modal
      isVisible={isVisible}
      swipeDirection="down"
      onSwipeComplete={() => close()}
      backdropColor="rgb(19,58,138)"
      backdropOpacity={0.6}
      style={styles.noMargin}>
      <KeyboardAvoidingView behavior="padding" style={styles.container}>
        <View style={styles.container}>
          <View style={styles.modal}>
            <View style={styles.modalHeaderContainer}>
              <Text style={styles.modalHeaderTitle}>Filter</Text>
              <GreyRoundButton onPress={() => close()} />
            </View>

            <VerticalTableCell title="SHOW">
              <SegmentedControl
                values={['ALL', 'SENT', 'RECEIVED']}
                selectedIndex={segmentOption}
                tintColor="#2C72FF"
                onChange={event =>
                  setSegmentOption(event.nativeEvent.selectedSegmentIndex)
                }
              />
            </VerticalTableCell>

            <TableCell title="LIGHTNING">
              <SwitchButton
                initialValue={switchOption}
                onPress={() => setSwitchOption(!switchOption)}
              />
            </TableCell>

            <VerticalTableCell title="SEARCH (RECEIPIENT, SENDEE, OR DESCRIPTION)">
              <View style={styles.inputContainer}>
                <InputField
                  value={searchField}
                  onChangeText={(input: string) => setSearchField(input)}
                  placeholder="enter search query"
                />
              </View>
            </VerticalTableCell>

            <View style={styles.buttonContainer}>
              <BlueButton
                small={false}
                value="Apply"
                onPress={() =>
                  onPress(segmentOption, switchOption, searchField)
                }
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  noMargin: {
    margin: 0,
  },
  container: {
    flex: 1,
    margin: 0,
  },
  modal: {
    flex: 1,
    backgroundColor: 'white',
    width: '100%',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    position: 'absolute',
    bottom: 0,
  },
  modalHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 25,
    paddingRight: 25,
    paddingTop: 25,
    paddingBottom: 25,
  },
  modalHeaderTitle: {
    color: '#4E6070',
    fontSize: 26,
    fontWeight: 'bold',
    height: 31,
  },
  buttonContainer: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: 'rgba(151,151,151,0.3)',
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    paddingTop: 5,
  },
});

export default TransactionFilterModal;
