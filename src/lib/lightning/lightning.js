import base64 from 'base64-js';
import {Duplex} from 'readable-stream';
import {NativeModules, NativeEventEmitter} from 'react-native';
import {lnrpc} from './rpc';
import {routerrpc} from './router';
import {toCaps} from '../utils';

class Lightning {
  constructor() {
    this.lightning = NativeModules.LndReactModule;
    this.lightningEvent = new NativeEventEmitter(this.lightning);
    this.streamCounter = 0;
  }

  async init() {
    await this.lightning.start();
  }

  async stop() {
    // TODO: uncomment when available in API
    // await this.lightning.close()
  }

  async sendCommand(method, body) {
    return this.lnrpcRequest(method, body);
  }

  sendStreamCommand(method, body) {
    method = toCaps(method);
    const streamId = this.generateStreamId();
    const stream = new Duplex({
      write(data) {
        data = JSON.parse(data.toString('utf8'));
        const req = this.serializeRequest(method, data);
        this.lightning.sendStreamWrite(streamId, req);
      },
      read() {},
    });
    this.lightningEvent.addListener('streamEvent', (res) => {
      if (res.streamId !== streamId) {
        return;
      }
      if (res.event === 'data') {
        stream.emit('data', this.deserializeResponse(method, res.data));
      } else {
        stream.emit(res.event, res.error || res.data);
      }
    });
    const req = this.serializeRequest(method, body);
    this.lightning.sendStreamCommand(method, streamId, req);
    return stream;
  }

  // helper functions

  async lnrpcRequest(method, body) {
    try {
      method = toCaps(method);
      const req = this.serializeRequest(method, body);
      const response = await this.lightning.sendCommand(method, req);
      return this.deserializeResponse(method, response.data);
    } catch (error) {
      if (typeof error === 'string') {
        throw new Error(error);
      } else {
        throw error;
      }
    }
  }

  serializeRequest(method, body = {}) {
    const subserver = this.getRpcSubserver(method);
    const req = subserver[this.getRequestName(method)];
    const message = req.create(body);
    const buffer = req.encode(message).finish();
    return base64.fromByteArray(buffer);
  }

  deserializeResponse(method, response) {
    const subserver = this.getRpcSubserver(method);
    const res = subserver[this.getResponseName(method)];
    const buffer = base64.toByteArray(response);
    return res.decode(buffer);
  }

  getRequestName(method) {
    const map = {
      AddInvoice: 'Invoice',
      DecodePayReq: 'PayReqString',
      ListInvoices: 'ListInvoiceRequest',
      SendPaymentV2: 'SendPaymentRequest',
      SubscribeTransactions: 'GetTransactionsRequest',
      SubscribeInvoices: 'InvoiceSubscription',
      SubscribeChannelBackups: 'ChannelBackupSubscription',
    };
    return map[method] || `${method}Request`;
  }

  getResponseName(method) {
    const map = {
      DecodePayReq: 'PayReq',
      GetTransactions: 'TransactionDetails',
      ListInvoices: 'ListInvoiceResponse',
      SendPayment: 'Payment',
      OpenChannel: 'OpenStatusUpdate',
      CloseChannel: 'CloseStatusUpdate',
      SubscribeTransactions: 'Transaction',
      SubscribeInvoices: 'Invoice',
      SubscribeChannelBackups: 'ChanBackupSnapshot',
    };
    return map[method] || `${method}Response`;
  }

  getRpcSubserver(method) {
    const map = {
      SendPaymentV2: routerrpc,
    };
    return map[method] || lnrpc;
  }

  // stream helpers
  generateStreamId() {
    this.streamCounter = this.streamCounter + 1;
    return String(this.streamCounter);
  }
}

export default Lightning;
