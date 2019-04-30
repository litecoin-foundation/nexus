import Lightning from '../lib/lightning/lightning';

const LndInstance = new Lightning();

// initial state
const initialState = {
  makingPayment: false,
  isOnchain: null,
  successful: null
};

// constants
export const SEND_ONCHAIN_PAYMENT = 'SEND_ONCHAIN_PAYMENT';

// actions
export const sendOnchainPayment = paymentreq => async dispatch => {
  try {
    const { txid } = await LndInstance.sendCommand('SendCoins', paymentreq);
    console.log(txid);
    dispatch({
      type: SEND_ONCHAIN_PAYMENT
    });
  } catch (error) {
    alert('your transaction failed :(');
    console.log(`payment onchain error: ${error}`);
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
