import {useEffect} from 'react';

import {useAppDispatch, useAppSelector} from '../../../store/hooks';
import {resumeIfNeeded} from '../adapter';
import {setRunning} from '../mbsxSlice';

/**
 * Brings the core back up at launch when a swap is still running.
 *
 * Renders nothing. Waits for lnd rather than for mount: starting the core needs
 * the seed for its main extkey and lnd for the signing and balance callbacks.
 */
const MbsxResume = () => {
  const dispatch = useAppDispatch();
  const lndActive = useAppSelector(state => state.lightning.lndActive);

  useEffect(() => {
    if (!lndActive) {
      return;
    }
    let left = false;
    resumeIfNeeded()
      .then(resumed => {
        if (resumed && !left) {
          dispatch(setRunning(true));
        }
      })
      .catch((error: Error) =>
        console.warn('mbsx could not resume a swap:', error.message),
      );
    return () => {
      left = true;
    };
  }, [lndActive, dispatch]);

  return null;
};

export default MbsxResume;
