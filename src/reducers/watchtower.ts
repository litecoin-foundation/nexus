// import lnd, from '@litecoinfoundation/react-native-lndltc';
// import {createAction, createSlice} from '@reduxjs/toolkit';
// import {AppThunk} from './types';

// // types
// interface IWatchtowerState {
//   towers: wtclientrpc.ITower[];
// }

// // initial state
// const initialState = {
//   towers: [],
// } as IWatchtowerState;

// // actions
// const addTowers = createAction<wtclientrpc.ITower[]>('watchtower/addTowers');

// export const listTowers = (): AppThunk => async dispatch => {
//   const rpc = await lnd.watchtowerClient.listTowers(false);
//   if (rpc.isErr()) {
//     console.error(rpc.error);
//   }

//   if (rpc.isOk()) {
//     dispatch(addTowers(rpc.value.towers));
//   }
// };

// // export const addTower = async (pubkey: string, address: string) => {
// //   const rpc = await lnd.watchtowerClient.addTower(pubkey, address);
// //   if (rpc.isErr()) {
// //     console.error(rpc.error);
// //   }

// //   if (rpc.isOk()) {
// //     // handle is OKAy returns nothing
// //   }
// // };

// // slice
// export const watchtowerSlice = createSlice({
//   name: 'watchtower',
//   initialState,
//   reducers: {
//     addTowers: (state, action) => ({...state, towers: action.payload}),
//   },
// });

// export default watchtowerSlice.reducer;
