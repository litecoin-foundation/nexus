export const timeout = (timeMs: number) =>
  new Promise((resolve) => setTimeout(() => resolve(void 0), timeMs));

export const stringToUint8Array = (str: string) => {
  return Uint8Array.from(str, (x) => x.charCodeAt(0));
};

export const hexToUint8Array = (hexString: string) => {
  return new Uint8Array(
    hexString.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)),
  );
};

// from https://coolaj86.com/articles/unicode-string-to-a-utf-8-typed-array-buffer-in-javascript/
export function unicodeStringToUint8Array(s: string) {
  var escstr = encodeURIComponent(s);
  var binstr = escstr.replace(/%([0-9A-F]{2})/g, function (match, p1) {
    return String.fromCharCode(("0x" + p1) as any);
  });
  var ua = new Uint8Array(binstr.length);
  Array.prototype.forEach.call(binstr, function (ch, i) {
    ua[i] = ch.charCodeAt(0);
  });
  return ua;
}
