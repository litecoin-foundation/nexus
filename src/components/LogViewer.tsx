import React, {useState, useEffect, useRef, useContext} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as RNFS from '@dr.pogodin/react-native-fs';
import Clipboard from '@react-native-clipboard/clipboard';
import Share from 'react-native-share';

import TranslateText from './TranslateText';
import NewButton from './Buttons/NewButton';

import {ScreenSizeContext} from '../context/screenSize';

interface LogViewerProps {
  maxLines?: number;
  refreshInterval?: number;
}

const LogViewer: React.FC<LogViewerProps> = ({
  maxLines = 15,
  refreshInterval = 2000,
}) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileExists, setFileExists] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSizeRef = useRef<number>(0);

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const logFilePath = RNFS?.DocumentDirectoryPath
    ? `${RNFS.DocumentDirectoryPath}/lndltc/logs/litecoin/mainnet/lnd.log`
    : '';

  const readLogFile = async () => {
    try {
      if (!RNFS || !RNFS.DocumentDirectoryPath) {
        setError('File system not available');
        setLoading(false);
        return;
      }

      if (!logFilePath) {
        setError('Log file path not available');
        setLoading(false);
        return;
      }

      const exists = await RNFS.exists(logFilePath);
      if (!exists) {
        setFileExists(false);
        setError('Log file not found');
        setLoading(false);
        return;
      }

      setFileExists(true);
      setError(null);

      // Get file stats to check if it has changed
      const stats = await RNFS.stat(logFilePath);
      const currentSize = stats.size;

      // Only read if file has changed
      if (currentSize !== lastSizeRef.current) {
        lastSizeRef.current = currentSize;

        // Read the file content
        const content = await RNFS.readFile(logFilePath, 'utf8');
        const lines = content.split('\n').filter(line => line.trim() !== '');

        // Keep only the last maxLines
        const recentLines = lines.slice(-maxLines);
        setLogs(recentLines);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error reading log file:', err);
      setError('Failed to read log file');
      setLoading(false);
    }
  };

  const copyAllLogs = async () => {
    try {
      if (!RNFS || !logFilePath) {
        Alert.alert('Error', 'File system not available');
        return;
      }

      const exists = await RNFS.exists(logFilePath);
      if (!exists) {
        Alert.alert('Error', 'Log file not found');
        return;
      }

      const content = await RNFS.readFile(logFilePath, 'utf8');
      await Clipboard.setString(content);
      Alert.alert('Copied', 'Copied Nexus Logs to Clipboard.');
    } catch (err) {
      Alert.alert('Error', 'Failed to copy logs');
    }
  };

  const shareAllLogs = async () => {
    try {
      if (!RNFS || !logFilePath) {
        Alert.alert('Error', 'File system not available');
        return;
      }

      const exists = await RNFS.exists(logFilePath);
      if (!exists) {
        Alert.alert('Error', 'Log file not found');
        return;
      }

      const tempLogPath = `${RNFS.CachesDirectoryPath}/nexus_logs_${Date.now()}.txt`;
      await RNFS.copyFile(logFilePath, tempLogPath);

      Share.open({
        url: `file://${tempLogPath}`,
        type: 'text/plain',
        title: 'LND Logs',
      }).finally(() => {
        RNFS.unlink(tempLogPath).catch(() => {});
      });
    } catch (err) {
      console.error('Share error:', err);
      Alert.alert('Error', 'Failed to share logs');
    }
  };

  useEffect(() => {
    // Initial read
    readLogFile();

    // Set up interval for live updates
    intervalRef.current = setInterval(readLogFile, refreshInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [refreshInterval]);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (logs.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({animated: true});
      }, 100);
    }
  }, [logs]);

  if (loading) {
    return (
      <View style={styles.container}>
        <TranslateText
          textValue="LND Logs"
          maxSizeInPixels={SCREEN_HEIGHT * 0.017}
          textStyle={styles.title}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#4A4A4A" />
          <Text style={styles.loadingText}>Loading logs...</Text>
        </View>
      </View>
    );
  }

  if (!fileExists || error) {
    return (
      <View style={styles.container}>
        <TranslateText
          textValue="LND Logs"
          maxSizeInPixels={SCREEN_HEIGHT * 0.017}
          textStyle={styles.title}
        />
        <Text style={styles.errorText}>
          {error ||
            'Log file not found. LND may not be running or logging may be disabled.'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TranslateText
          textValue="LND Logs"
          maxSizeInPixels={SCREEN_HEIGHT * 0.017}
          textStyle={styles.title}
        />
        <View style={styles.buttonContainer}>
          <NewButton
            onPress={copyAllLogs}
            imageSource={require('../assets/icons/copy-icon.png')}
            small={true}
          />
          <NewButton
            onPress={shareAllLogs}
            imageSource={require('../assets/icons/share-icon.png')}
            small={true}
          />
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.logContainer}
        showsVerticalScrollIndicator={true}>
        {logs.map((line, index) => (
          <Text key={index} style={styles.logLine}>
            {line}
          </Text>
        ))}
        {logs.length === 0 && (
          <Text style={styles.noLogsText}>No logs available</Text>
        )}
      </ScrollView>
    </View>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      paddingTop: 15,
      paddingLeft: 22,
      paddingRight: 25,
      paddingBottom: 15,
      borderTopWidth: 1,
      borderTopColor: 'rgba(151,151,151,0.3)',
      backgroundColor: 'white',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    title: {
      color: '#747e87',
      fontSize: 14,
      fontWeight: '600',
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      paddingBottom: 2,
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: 8,
    },
    logContainer: {
      maxHeight: screenHeight * 0.25,
      minHeight: screenHeight * 0.15,
    },
    logLine: {
      fontSize: 10,
      fontFamily: 'Courier',
      color: '#4A4A4A',
      marginBottom: 1,
      lineHeight: 12,
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: 8,
    },
    loadingText: {
      color: '#4A4A4A',
      fontSize: 12,
      marginLeft: 8,
    },
    errorText: {
      color: '#D32F2F',
      fontSize: 12,
      paddingTop: 4,
    },
    noLogsText: {
      color: '#747e87',
      fontSize: 12,
      textAlign: 'center',
      marginTop: 10,
    },
  });

export default LogViewer;
