import React, {useEffect, useState, useContext, useRef, Fragment} from 'react';
import {ScrollView, View, Image, StyleSheet} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Share from 'react-native-share';

import InputActionField from '../InputActionField';
import TableCell from '../Cells/TableCell';
import BlueButton from '../Buttons/BlueButton';
import ChangeAddress from '../ChangeAddress';

import TranslateText from '../TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

interface SendReceiveLayoutProps {
  isSend: boolean;
  isMweb: boolean;
  allInputAddrs: string[];
  myOutputAddrs: string[];
  otherOutputAddrs: string[];
  txId: string;
  label: string;
  dateString: string;
  amountSymbol: string;
  currentExplorer: string;
  blockchainFee: number | 'unknown';
  labelTx: (labelProp: string) => void;
}

const SendReceiveTxLayout: React.FC<SendReceiveLayoutProps> = props => {
  const {
    isSend,
    isMweb,
    allInputAddrs,
    myOutputAddrs,
    otherOutputAddrs,
    txId,
    label,
    blockchainFee,
    dateString,
    amountSymbol,
    currentExplorer,
    labelTx,
  } = props;

  const navigation = useNavigation<any>();

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT, isMweb);

  const calculateAddressSize = (
    addresses: string[],
    defaultSize: number,
    singleThreshold: number,
    multiThreshold: number,
  ) => {
    if (addresses.length > 1) {
      return multiThreshold;
    } else if (addresses.length === 1 && addresses[0].length > 75) {
      return singleThreshold;
    }
    return defaultSize;
  };

  let fromAddressSize = calculateAddressSize(
    allInputAddrs,
    SCREEN_HEIGHT * 0.025,
    SCREEN_HEIGHT * 0.019,
    SCREEN_HEIGHT * 0.017,
  );

  let toAddressSize = calculateAddressSize(
    [...otherOutputAddrs, ...myOutputAddrs],
    SCREEN_HEIGHT * 0.025,
    SCREEN_HEIGHT * 0.019,
    SCREEN_HEIGHT * 0.017,
  );

  if (fromAddressSize >= toAddressSize) {
    fromAddressSize = toAddressSize;
  } else {
    toAddressSize = fromAddressSize;
  }

  const ADDR_ROW_LIMIT = 2;
  const CHANGE_ADDR_ROW_LIMIT = 1;

  const handleShare = (message: string) => {
    if (message) {
      Share.open({message: message});
    }
  };

  function renderInputs() {
    if (allInputAddrs.length > 0) {
      return allInputAddrs.slice(0, ADDR_ROW_LIMIT).map((input, index) => (
        <TranslateText
          textValue={input}
          maxSizeInPixels={SCREEN_HEIGHT * 0.02}
          textStyle={{
            ...styles.fromAddressTitle,
            fontSize: fromAddressSize,
          }}
          numberOfLines={4}
          key={'input-' + index}
          onPress={() => handleShare(input)}
        />
      ));
    } else {
      return (
        <TranslateText
          textValue="Unknown"
          maxSizeInPixels={SCREEN_HEIGHT * 0.02}
          textStyle={{
            ...styles.fromAddressTitle,
            fontSize: fromAddressSize,
          }}
          numberOfLines={1}
        />
      );
    }
  }

  function renderOutputs() {
    // change address
    const myOutputElements = myOutputAddrs
      .slice(0, isSend ? CHANGE_ADDR_ROW_LIMIT : ADDR_ROW_LIMIT)
      .map((output, index) => (
        <TranslateText
          textValue={output}
          maxSizeInPixels={SCREEN_HEIGHT * 0.02}
          textStyle={{
            ...styles.toAddressTitle,
            fontSize: toAddressSize,
            color: isSend ? '#2c72ff' : '#1ebc73',
          }}
          numberOfLines={4}
          key={'output-change-' + index}
          onPress={() => handleShare(output)}
        />
      ));

    // to address
    const otherOutputElements = otherOutputAddrs
      .slice(0, ADDR_ROW_LIMIT)
      .map((output, index) => (
        <TranslateText
          textValue={output}
          maxSizeInPixels={SCREEN_HEIGHT * 0.02}
          textStyle={{
            ...styles.toAddressTitle,
            fontSize: toAddressSize,
          }}
          numberOfLines={4}
          key={'output-sent-' + index}
          onPress={() => handleShare(output)}
        />
      ));

    if (myOutputElements.length === 0 && otherOutputElements.length === 0) {
      return (
        <TranslateText
          textValue="Unknown"
          maxSizeInPixels={SCREEN_HEIGHT * 0.02}
          textStyle={{
            ...styles.toAddressTitle,
            fontSize: toAddressSize,
          }}
          numberOfLines={1}
        />
      );
    } else {
      if (isSend) {
        // does/doesn't have a change address
        if (myOutputElements.length > 0) {
          const changeAddress = (
            <ChangeAddress>{myOutputElements}</ChangeAddress>
          );
          return [...otherOutputElements, changeAddress];
        } else {
          return otherOutputElements;
        }
      } else {
        // receive modal doesn't show addresses not belonging to users
        return myOutputElements;
      }
    }
  }

  const hiddenInputsNote = (
    <TranslateText
      textValue={`+ ${allInputAddrs.length - ADDR_ROW_LIMIT} other input ${
        allInputAddrs.length - ADDR_ROW_LIMIT > 1 ? 'addresses' : 'address'
      }`}
      maxSizeInPixels={SCREEN_HEIGHT * 0.02}
      textStyle={styles.otherAddressesNote}
      numberOfLines={1}
    />
  );

  const strangerAddressesNote = (
    <TranslateText
      textValue={`+ ${otherOutputAddrs.length} ${
        otherOutputAddrs.length > 1 ? 'addresses' : 'address'
      } not belonging to you`}
      maxSizeInPixels={SCREEN_HEIGHT * 0.02}
      textStyle={styles.otherAddressesNote}
      numberOfLines={1}
    />
  );

  const hiddenStrangerOutputsNote = (
    <TranslateText
      textValue={`+ ${otherOutputAddrs.length - ADDR_ROW_LIMIT} other output ${
        otherOutputAddrs.length - ADDR_ROW_LIMIT > 1 ? 'addresses' : 'address'
      }`}
      maxSizeInPixels={SCREEN_HEIGHT * 0.02}
      textStyle={styles.otherAddressesNote}
      numberOfLines={1}
    />
  );

  const hiddenChangeAddressesNote = (
    <TranslateText
      textValue={`+ ${myOutputAddrs.length - CHANGE_ADDR_ROW_LIMIT} change ${
        myOutputAddrs.length - CHANGE_ADDR_ROW_LIMIT > 1
          ? 'addresses'
          : 'address'
      }`}
      maxSizeInPixels={SCREEN_HEIGHT * 0.02}
      textStyle={styles.otherAddressesNote}
      numberOfLines={1}
    />
  );

  function renderInputNote() {
    return (
      <Fragment>
        {allInputAddrs.length > ADDR_ROW_LIMIT ? (
          hiddenInputsNote
        ) : (
          <Fragment />
        )}
      </Fragment>
    );
  }

  function renderOutputNote() {
    if (isSend) {
      return (
        <Fragment>
          {otherOutputAddrs.length > ADDR_ROW_LIMIT ? (
            hiddenStrangerOutputsNote
          ) : (
            <Fragment />
          )}
          {myOutputAddrs.length > CHANGE_ADDR_ROW_LIMIT ? (
            hiddenChangeAddressesNote
          ) : (
            <Fragment />
          )}
        </Fragment>
      );
    } else {
      return (
        <Fragment>
          {otherOutputAddrs.length > 0 ? strangerAddressesNote : <Fragment />}
        </Fragment>
      );
    }
  }

  const [newLabel, setNewLabel] = useState(label === ' ' ? '' : label);
  useEffect(() => {
    setNewLabel(label === ' ' ? '' : label);
  }, [label]);

  const scrollViewRef = useRef<ScrollView | null>(null);

  const scrollToInput = (y: number) => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({y, animated: true});
    }
  };

  return (
    <Fragment>
      <View style={styles.topContainer}>
        <ScrollView
          ref={scrollViewRef}
          scrollEnabled={false}
          contentContainerStyle={styles.scrollViewContent}>
          <View style={styles.fromToContainerHeight}>
            <ScrollView contentContainerStyle={styles.fromToContainer}>
              {isMweb ? (
                <Fragment />
              ) : (
                <View style={styles.fromContainer}>
                  <View style={styles.fromAndToIconContainer}>
                    <View style={styles.fromAndToIcon}>
                      <Image
                        style={styles.fromAndToIconImage}
                        source={require('../../assets/icons/send-icon.png')}
                      />
                    </View>
                    <View style={styles.sentLine} />
                  </View>
                  <View style={styles.fromAndToTitlesContainer}>
                    <TranslateText
                      textKey={'from'}
                      domain={'main'}
                      maxSizeInPixels={SCREEN_HEIGHT * 0.02}
                      textStyle={styles.fromAndToTitle}
                      numberOfLines={1}
                    />
                    {renderInputs()}
                    {renderInputNote()}
                    <View style={{paddingBottom: 10}} />
                  </View>
                </View>
              )}
              <View style={styles.toContainer}>
                <View style={styles.fromAndToIconContainer}>
                  <View style={styles.fromAndToIcon}>
                    <Image
                      style={styles.fromAndToIconImage}
                      source={require('../../assets/icons/receive-icon.png')}
                    />
                  </View>
                </View>
                <View style={styles.fromAndToTitlesContainer}>
                  <TranslateText
                    textKey={'to'}
                    domain={'main'}
                    maxSizeInPixels={SCREEN_HEIGHT * 0.02}
                    textStyle={styles.fromAndToTitle}
                    numberOfLines={1}
                  />
                  {renderOutputs()}
                  {renderOutputNote()}
                </View>
              </View>
            </ScrollView>
          </View>
          <TableCell
            titleTextKey="tx_id"
            titleTextDomain="main"
            value={txId}
            copyable
            valueStyle={{paddingLeft: 20}}
          />
          <TableCell
            titleTextKey="network_fee"
            titleTextDomain="main"
            value={`${
              blockchainFee && blockchainFee !== 'unknown'
                ? blockchainFee + amountSymbol
                : 'Unknown'
            }`}
          />
          <TableCell
            titleTextKey="time_date"
            titleTextDomain="main"
            value={dateString}
          />
          <View style={styles.inputFieldContainer}>
            <InputActionField
              value={newLabel}
              placeholder="Add label"
              onChangeText={text => setNewLabel(text)}
              onBlur={() => scrollToInput(0)}
              onFocus={() => scrollToInput(SCREEN_HEIGHT * 0.23)}
              clearInput={() => {
                setNewLabel('');
                labelTx('');
              }}
              onAction={() => labelTx(newLabel)}
            />
          </View>
        </ScrollView>
      </View>
      <View style={styles.bottomContainer}>
        <View style={styles.buttonContainer}>
          <BlueButton
            textKey="view_on_blockchain"
            textDomain="main"
            onPress={() => {
              navigation.navigate('WebPage', {
                uri: currentExplorer,
              });
            }}
          />
        </View>
        <View style={styles.paginationStrip} />
      </View>
    </Fragment>
  );
};

const getStyles = (
  screenWidth: number,
  screenHeight: number,
  isMweb?: boolean,
) =>
  StyleSheet.create({
    paginationStrip: {
      height: screenHeight * 0.06,
      width: '100%',
    },
    fromToContainerHeight: {
      height: isMweb ? screenHeight * 0.2 : screenHeight * 0.25,
    },
    fromToContainer: {
      width: '100%',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      paddingHorizontal: screenHeight * 0.03,
      paddingVertical: screenHeight * 0.02,
    },
    fromContainer: {
      flexShrink: 0,
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'flex-start',
    },
    toContainer: {
      flex: 1,
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'flex-start',
    },
    fromAndToIconContainer: {
      height: '100%',
      flexDirection: 'column',
      alignItems: 'center',
      marginRight: screenHeight * 0.03,
    },
    fromAndToIcon: {
      height: screenHeight * 0.035,
      width: screenHeight * 0.035,
      borderRadius: screenHeight * 0.005,
      backgroundColor: '#EAEBED',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    fromAndToIconImage: {
      width: '50%',
      height: '50%',
      objectFit: 'contain',
    },
    sentLine: {
      flex: 1,
      width: 1,
      backgroundColor: '#EAEBED',
      margin: screenHeight * 0.01,
    },
    fromAndToTitlesContainer: {
      height: '100%',
      flex: 1,
      flexDirection: 'column',
      alignItems: 'flex-start',
    },
    fromAndToTitle: {
      color: '#3b3b3b',
      fontSize: screenHeight * 0.02,
      fontWeight: '700',
      fontFamily: 'Satoshi Variable',
    },
    fromAddressTitle: {
      color: '#2c72ff',
      fontSize: screenHeight * 0.025,
      fontWeight: '700',
      fontFamily: 'Satoshi Variable',
    },
    toAddressTitle: {
      color: '#1ebc73',
      fontSize: screenHeight * 0.025,
      fontWeight: '700',
      fontFamily: 'Satoshi Variable',
    },
    otherAddressesNote: {
      color: '#747e87',
      fontSize: screenHeight * 0.015,
      fontWeight: '700',
      paddingTop: screenHeight * 0.002,
      fontFamily: 'Satoshi Variable',
    },
    inputFieldContainer: {},
    topContainer: {
      flex: 1,
      flexDirection: 'column',
      overflow: 'hidden',
    },
    scrollViewContent: {
      minHeight: screenHeight,
    },
    bottomContainer: {
      flexDirection: 'column',
      paddingHorizontal: screenWidth * 0.05,
    },
    buttonContainer: {
      width: '100%',
      justifyContent: 'center',
      alignSelf: 'center',
    },
  });

export default SendReceiveTxLayout;
