// minimal typing for the 'qrcode' encoder
declare module 'qrcode' {
  export interface QRCodeMatrix {
    size: number;
    data: Uint8Array;
  }
  export function create(
    value: string,
    options?: {errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'},
  ): {modules: QRCodeMatrix};
}
