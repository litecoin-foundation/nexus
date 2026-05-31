import {useContext} from 'react';

import {JadeContext, type JadeContextValue} from '../../context/JadeContext';

/**
 * Jade connection state + service. Re-renders on state/versionInfo/lastError
 * change; drive the device via `service.*`. Throws outside a <JadeProvider>.
 */
export const useJade = (): JadeContextValue => {
  const context = useContext(JadeContext);
  if (!context) {
    throw new Error('useJade must be used within a JadeProvider');
  }
  return context;
};
