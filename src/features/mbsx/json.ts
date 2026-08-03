// JSON.stringify throws on bigint, and the module returns 64 bit integers as
// bigints. They go out as strings, which is the convention the module already
// uses for amounts, so nothing downstream has to deal with two number types.
export const stringifyRpc = (value: unknown): string =>
  JSON.stringify(value, (_key, v) => (typeof v === 'bigint' ? v.toString() : v));
