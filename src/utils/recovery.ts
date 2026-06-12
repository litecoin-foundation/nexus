import {getItem, setItem} from './keychain';

const RECOVERY_IN_PROGRESS = 'RECOVERY_IN_PROGRESS';

export const markRecoveryInProgress = (): Promise<void> =>
  setItem(RECOVERY_IN_PROGRESS, 'true');

export const clearRecoveryInProgress = (): Promise<void> =>
  setItem(RECOVERY_IN_PROGRESS, 'false');

export const isRecoveryInProgress = async (): Promise<boolean> =>
  (await getItem(RECOVERY_IN_PROGRESS)) === 'true';
