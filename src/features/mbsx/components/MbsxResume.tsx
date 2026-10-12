import {useEffect} from 'react';

import {useAppDispatch, useAppSelector} from '../../../store/hooks';
import {resumeIfNeeded} from '../adapter';
import {lndUp} from '../adapter/leases';
import {notifySwapProblem} from '../adapter/notify';
import {setError, setRunning} from '../mbsxSlice';

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
    let left = false;
    lndUp()
      .then(up => (up && !left ? resumeIfNeeded() : false))
      .then(resumed => {
        if (resumed && !left) {
          dispatch(setRunning(true));
        }
      })
      .catch((error: Error) => {
        // A swap with running timelocks has nothing watching it now, and a
        // stripped console.warn would say so to nobody.
        dispatch(setError(`Swaps did not resume: ${error.message}`));
        notifySwapProblem(`Swaps did not resume: ${error.message}`);
      });
    return () => {
      left = true;
    };
  }, [lndActive, dispatch]);

  return null;
};

export default MbsxResume;
