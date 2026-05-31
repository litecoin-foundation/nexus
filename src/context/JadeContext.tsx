import React, {
  createContext,
  useCallback,
  useMemo,
  useSyncExternalStore,
} from 'react';
import type {
  JadeConnectionState,
  JadeVersionInfo,
} from 'react-native-nitro-jade';

import {jadeService, type JadeServiceApi} from '../services/jade/JadeService';

export interface JadeContextValue {
  service: JadeServiceApi;
  state: JadeConnectionState;
  versionInfo: JadeVersionInfo | null;
  lastError: Error | null;
}

const JadeContext = createContext<JadeContextValue | null>(null);

interface Props {
  children: React.ReactNode;
  service?: JadeServiceApi; // injectable for tests; defaults to the singleton
}

const JadeProvider: React.FC<Props> = ({children, service = jadeService}) => {
  // Stable, bound wrappers so useSyncExternalStore doesn't resubscribe each
  // render and works for any JadeServiceApi, not just the singleton's arrow fields.
  const subscribe = useCallback(
    (listener: () => void) => service.subscribe(listener),
    [service],
  );
  const getSnapshot = useCallback(() => service.getSnapshot(), [service]);
  const snapshot = useSyncExternalStore(subscribe, getSnapshot);
  const value = useMemo<JadeContextValue>(
    () => ({service, ...snapshot}),
    [service, snapshot],
  );
  return <JadeContext.Provider value={value}>{children}</JadeContext.Provider>;
};

export {JadeContext, JadeProvider};
