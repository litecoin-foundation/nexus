// TODO: refactor this reducer
import Lightning from '../lib/lightning/lightning';

const LndInstance = new Lightning();

// initial state
const initialState = {};

// constants
export const SEND_ONCHAIN_PAYMENT = 'SEND_ONCHAIN_PAYMENT';

// actions
export const sendOnchainPayment = paymentreq => async dispatch => {
  try {
    const { txid } = await LndInstance.sendCommand('SendCoins', paymentreq);
    dispatch({
      type: SEND_ONCHAIN_PAYMENT
    });
  } catch (error) {
    alert('your transaction failed :(');
    console.log(`payment onchain error: ${error}`);
  }
};

export const estimateOnchainFee = request => async dispatch => {
  try {
    const { fee_sat, feerate_sat_per_byte } = await LndInstance.sendCommand('EstimateFee', request);
    return { fee_sat, feerate_sat_per_byte };
  } catch (error) {
    alert('your transaction failed :(');
    console.log(`payment onchain error: ${error}`);
  }
};

export const decodePaymentRequest = async payReqString => {
  const response = await LndInstance.sendCommand('DecodePayReq', { payReq: payReqString });
  return response;
};

export const sendLightningPayment = paymentreq => async dispatch => {
  try {
    const stream = LndInstance.sendStreamCommand('sendPayment');
    await new Promise((resolve, reject) => {
      stream.on('data', data => {
        if (data.paymentError) {
          reject(new Error(`Lightning payment error: ${data.paymentError}`));
        } else {
          resolve();
        }
      });
      stream.on('error', reject);
      stream.write(JSON.stringify({ paymentRequest: paymentreq }), 'utf8');
    });
  } catch (error) {
    alert('your transaction failed :(');
    console.log(`payment lightning error: ${error}`);
  }
};

// action handlers
const actionHandler = {
  [SEND_ONCHAIN_PAYMENT]: state => ({ ...state })
};

// reducer
export default function(state = initialState, action) {
  const handler = actionHandler[action.type];

  return handler ? handler(state, action) : state;
}
