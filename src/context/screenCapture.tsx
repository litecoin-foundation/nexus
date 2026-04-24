import React, {createContext, useContext, useMemo, useRef} from 'react';
import {View, StyleSheet} from 'react-native';

interface ScreenCaptureContextType {
  captureRef: React.RefObject<View | null>;
}

const ScreenCaptureContext = createContext<ScreenCaptureContextType>({
  captureRef: {current: null},
});

interface ProviderProps {
  children: React.ReactNode;
}

const ScreenCaptureProvider: React.FC<ProviderProps> = ({children}) => {
  const captureRef = useRef<View>(null);
  const value = useMemo(() => ({captureRef}), []);
  return (
    <ScreenCaptureContext.Provider value={value}>
      {children}
    </ScreenCaptureContext.Provider>
  );
};

const ScreenCaptureTarget: React.FC<ProviderProps> = ({children}) => {
  const {captureRef} = useContext(ScreenCaptureContext);
  return (
    <View ref={captureRef} collapsable={false} style={styles.container}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export {ScreenCaptureContext, ScreenCaptureProvider, ScreenCaptureTarget};
