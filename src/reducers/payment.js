/* eslint-disable camelcase */
// TODO: refactor this reducer
import Lightning from '../lib/lightning/lightning';

const LndInstance = new Lightning();

// initial state
const initialState = {
  onchain: {
    amount: '',
    address: '',
    memo: '',
    feeSat: null,
    feePerByte: null
  }
};

// constants
export const SEND_ONCHAIN_PAYMENT = 'SEND_ONCHAIN_PAYMENT';
export const ESTIMATE_ONCHAIN_FEE = 'ESTIMATE_ONCHAIN_FEE';
export const INPUT_PARAMS = 'INPUT_PARAMS';

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

export const estimateOnchainFee = (address, amount, conf) => async dispatch => {
  try {
    const AddrToAmount = {};
    AddrToAmount[address] = parseFloat(amount) * 1000000;
    const blocksToConfirm = conf !== undefined || isNaN(conf) ? conf : 1;
    const { fee_sat, feerate_sat_per_byte } = await LndInstance.sendCommand('EstimateFee', {
      AddrToAmount,
      target_conf: blocksToConfirm
    });

    dispatch({
      type: ESTIMATE_ONCHAIN_FEE,
      fee_sat,
      feerate_sat_per_byte
    });
  } catch (error) {
    alert(`fee calculation ${error}`);
    console.log(`payment onchain error: ${error}`);
  }
};

export const inputParams = params => dispatch => {
  dispatch({
    INPUT_PARAMS,
    params
  });
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
  [SEND_ONCHAIN_PAYMENT]: state => ({ ...state }),
  [INPUT_PARAMS]: (state, { params }) => ({ ...state, onchain: params }),
  [ESTIMATE_ONCHAIN_FEE]: (state, { fee_sat, feerate_sat_per_byte }) => ({
    ...state.onchain,
    feeSat: fee_sat,
    feePerByte: feerate_sat_per_byte
  })
};

// reducer
export default function(state = initialState, action) {
  const handler = actionHandler[action.type];

  return handler ? handler(state, action) : state;
}
