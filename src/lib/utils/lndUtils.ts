import {Platform} from 'react-native';
import {subscribeState} from 'react-native-turbo-lndltc';
import {WalletState} from 'react-native-turbo-lndltc/protos/lightning_pb';

export interface SubscribeStateWithTimeoutOptions {
  timeout: number;
  expectedStates: WalletState[];
  maxRetries?: number;
  retryDelay?: number;
}

export interface SubscribeStateResult {
  state: WalletState;
  success: boolean;
  timedOut: boolean;
  error?: string;
}

/**
 * Wrapper for subscribeState with timeout and retry logic
 * Addresses hanging issues on slower Android devices
 */
export const subscribeStateWithTimeout = (
  options: SubscribeStateWithTimeoutOptions,
): Promise<SubscribeStateResult> => {
  const {timeout, expectedStates, maxRetries = 3, retryDelay = 1000} = options;
  
  return new Promise((resolve) => {
    let attempts = 0;
    let timeoutId: NodeJS.Timeout;
    let resolved = false;
    
    const attemptSubscription = () => {
      attempts++;
      console.log(`LND subscribeState attempt ${attempts}/${maxRetries + 1}`);
      
      // Clear any existing timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // Set timeout for this attempt
      timeoutId = setTimeout(() => {
        if (!resolved) {
          console.warn(`LND subscribeState timeout on attempt ${attempts}`);
          
          if (attempts <= maxRetries) {
            setTimeout(attemptSubscription, retryDelay);
          } else {
            resolved = true;
            resolve({
              state: WalletState.WAITING_TO_START,
              success: false,
              timedOut: true,
              error: `subscribeState timed out after ${attempts} attempts`
            });
          }
        }
      }, timeout);
      
      try {
        subscribeState(
          {},
          (state) => {
            if (!resolved && expectedStates.includes(state.state)) {
              resolved = true;
              clearTimeout(timeoutId);
              console.log(`LND subscribeState success: ${WalletState[state.state]}`);
              resolve({
                state: state.state,
                success: true,
                timedOut: false
              });
            }
          },
          (error) => {
            if (!resolved) {
              console.error(`LND subscribeState error on attempt ${attempts}:`, error);
              
              if (attempts <= maxRetries) {
                setTimeout(attemptSubscription, retryDelay);
              } else {
                resolved = true;
                clearTimeout(timeoutId);
                resolve({
                  state: WalletState.WAITING_TO_START,
                  success: false,
                  timedOut: false,
                  error: String(error)
                });
              }
            }
          }
        );
      } catch (error) {
        if (!resolved) {
          console.error(`LND subscribeState exception on attempt ${attempts}:`, error);
          
          if (attempts <= maxRetries) {
            setTimeout(attemptSubscription, retryDelay);
          } else {
            resolved = true;
            clearTimeout(timeoutId);
            resolve({
              state: WalletState.WAITING_TO_START,
              success: false,
              timedOut: false,
              error: String(error)
            });
          }
        }
      }
    };
    
    attemptSubscription();
  });
};

/**
 * Get platform-specific timeouts for LND operations
 * Android devices get longer timeouts due to performance issues
 */
export const getLndTimeouts = () => {
  const isAndroid = Platform.OS === 'android';
  
  return {
    // Timeout for LND startup and initial state subscription
    startupTimeout: isAndroid ? 60000 : 30000, // 60s Android, 30s iOS
    
    // Timeout for wallet initialization 
    initTimeout: isAndroid ? 45000 : 30000, // 45s Android, 30s iOS
    
    // Timeout for wallet unlock
    unlockTimeout: isAndroid ? 30000 : 20000, // 30s Android, 20s iOS
    
    // Sleep time before calling initWallet (the existing workaround)
    initSleepTime: isAndroid ? 3000 : 1500, // 3s Android, 1.5s iOS
    
    // Retry delay between attempts
    retryDelay: isAndroid ? 2000 : 1000, // 2s Android, 1s iOS
  };
};

/**
 * Enhanced sleep function with console logging for debugging
 */
export const sleepWithLog = (ms: number, reason: string): Promise<void> => {
  console.log(`Sleeping for ${ms}ms: ${reason}`);
  return new Promise(resolve => setTimeout(resolve, ms));
};