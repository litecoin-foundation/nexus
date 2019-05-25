/* eslint-disable class-methods-use-this */
import base64 from 'base64-js';
import { Duplex } from 'readable-stream';
import { NativeModules, NativeEventEmitter } from 'react-native';
import { lnrpc } from './rpc';
import { toCaps } from '../utils';

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
    const self = this;
    const streamId = self.generateStreamId();
    const stream = new Duplex({
      write(data) {
        data = JSON.parse(data.toString('utf8'));
        const req = self.serializeRequest(method, data);
        self.lightning.sendStreamWrite(streamId, req);
      },
      read() {}
    });
    self.lightningEvent.addListener('streamEvent', res => {
      if (res.streamId !== streamId) {
        return;
      }
      if (res.event === 'data') {
        stream.emit('data', self.deserializeResponse(method, res.data));
      } else {
        stream.emit(res.event, res.error || res.data);
      }
    });
    const req = self.serializeRequest(method, body);
    self.lightning.sendStreamCommand(method, streamId, req);
    return stream;
  }

  // helper functions

  async lnrpcRequest(method, body) {
    method = toCaps(method);
    const req = this.serializeRequest(method, body);
    const response = await this.lightning.sendCommand(method, req);
    return this.deserializeResponse(method, response.data);
  }

  serializeRequest(method, body = {}) {
    const req = lnrpc[this.getRequestName(method)];
    const message = req.create(body);
    const buffer = req.encode(message).finish();
    return base64.fromByteArray(buffer);
  }

  deserializeResponse(method, response) {
    const res = lnrpc[this.getResponseName(method)];
    const buffer = base64.toByteArray(response);
    return res.decode(buffer);
  }

  getRequestName(method) {
    const map = {
      AddInvoice: 'Invoice',
      DecodePayReq: 'PayReqString',
      ListInvoices: 'ListInvoiceRequest',
      SendPayment: 'SendRequest',
      SubscribeTransactions: 'GetTransactionsRequest',
      SubscribeInvoices: 'InvoiceSubscription'
    };
    return map[method] || `${method}Request`;
  }

  getResponseName(method) {
    const map = {
      DecodePayReq: 'PayReq',
      GetTransactions: 'TransactionDetails',
      ListInvoices: 'ListInvoiceResponse',
      SendPayment: 'SendResponse',
      OpenChannel: 'OpenStatusUpdate',
      CloseChannel: 'CloseStatusUpdate',
      SubscribeTransactions: 'Transaction',
      SubscribeInvoices: 'Invoice'
    };
    return map[method] || `${method}Response`;
  }

  // stream helpers
  generateStreamId() {
    this.streamCounter = this.streamCounter + 1;
    return String(this.streamCounter);
  }
}

export default Lightning;
