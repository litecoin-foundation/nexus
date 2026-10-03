import {getItem} from '../../utils/keychain';
import {getTor, isTorReady} from '../../utils/tor';
import {readConfig} from './adapter/config';
import {getNetwork} from './network';
import {
  DEFAULT_RATE_SERVICES,
  fetchRates,
  freshRate,
  readRateServices,
  refreshRates,
  startRateFetcher,
} from './rates';
import type {Backoff, RateServices} from './rates';

jest.mock('../../utils/keychain', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));
jest.mock('../../utils/tor', () => ({
  getTor: jest.fn(),
  isTorReady: jest.fn(),
}));
jest.mock('./adapter/config', () => ({readConfig: jest.fn()}));
jest.mock('./network', () => ({getNetwork: jest.fn(() => 'mainnet')}));

const NOW = 1_800_000_000;

const reply = (body: unknown, status = 200) =>
  Promise.resolve({
    status,
    ok: status >= 200 && status < 300,
    json: () => Promise.resolve(body),
  });

const gecko = (rows: Record<string, number>, updated = NOW) =>
  Object.fromEntries(
    Object.entries(rows).map(([id, usd]) => [
      id,
      {usd, last_updated_at: updated},
    ]),
  );

const paprika = (usd: number, updated = NOW) => ({
  quotes: {USD: {price: usd}},
  last_updated: new Date(updated * 1000).toISOString(),
});

const fetchMock = jest.fn();
const settle = () => new Promise(resolve => setImmediate(resolve));

const withKeys = (patch: Partial<RateServices>): RateServices => ({
  ...DEFAULT_RATE_SERVICES,
  ...patch,
});

describe('fetchRates', () => {
  beforeEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
    global.fetch = fetchMock as any;
  });

  it('asks CoinGecko first, then later sources only for what is missing', async () => {
    fetchMock.mockImplementation((url: string) =>
      url.includes('coingecko')
        ? reply(gecko({litecoin: 80, bitcoin: 100000}))
        : reply(paprika(0.2)),
    );
    const {rates, results} = await fetchRates(
      ['LTC', 'BTC', 'PART'],
      DEFAULT_RATE_SERVICES,
      false,
      {},
      NOW,
    );
    expect(rates).toEqual({
      LTC: {usd: 80, source: 'coingecko', at: NOW},
      BTC: {usd: 100000, source: 'coingecko', at: NOW},
      PART: {usd: 0.2, source: 'coinpaprika', at: NOW},
    });
    const urls = fetchMock.mock.calls.map(call => call[0]);
    expect(urls).toEqual([
      'https://api.coingecko.com/api/v3/simple/price?ids=litecoin,bitcoin,particl&vs_currencies=usd&include_last_updated_at=true',
      'https://api.coinpaprika.com/v1/tickers/part-particl?quotes=USD',
    ]);
    expect(results.mexc).toBeUndefined();
  });

  it('drops a quote older than its source allows', async () => {
    fetchMock.mockImplementation((url: string) =>
      url.includes('coingecko')
        ? reply(gecko({litecoin: 80}, NOW - 16 * 60))
        : reply(paprika(81)),
    );
    const {rates} = await fetchRates(
      ['LTC'],
      DEFAULT_RATE_SERVICES,
      false,
      {},
      NOW,
    );
    expect(rates.LTC).toEqual({usd: 81, source: 'coinpaprika', at: NOW});
  });

  it('backs a rate limited source off, doubling the wait', async () => {
    fetchMock.mockImplementation((url: string) =>
      url.includes('coingecko') ? reply({}, 429) : reply(paprika(80)),
    );
    const backoff: Backoff = {};
    const first = await fetchRates(
      ['LTC'],
      DEFAULT_RATE_SERVICES,
      false,
      backoff,
      NOW,
    );
    expect(first.results.coingecko).toEqual({
      kind: 'limited',
      until: NOW + 60,
    });
    expect(first.rates.LTC.source).toBe('coinpaprika');

    fetchMock.mockClear();
    await fetchRates(['LTC'], DEFAULT_RATE_SERVICES, false, backoff, NOW + 30);
    expect(
      fetchMock.mock.calls.some(call => call[0].includes('coingecko')),
    ).toBe(false);

    const third = await fetchRates(
      ['LTC'],
      DEFAULT_RATE_SERVICES,
      false,
      backoff,
      NOW + 61,
    );
    expect(third.results.coingecko).toEqual({
      kind: 'limited',
      until: NOW + 61 + 120,
    });
  });

  it('sends each key to its own host and header', async () => {
    fetchMock.mockImplementation((url: string) =>
      url.includes('coingecko') ? reply({}) : reply(paprika(80)),
    );
    await fetchRates(
      ['LTC'],
      withKeys({
        coingecko: {key: 'gk', plan: 'demo'},
        coinpaprika: {key: 'pk'},
      }),
      false,
      {},
      NOW,
    );
    expect(fetchMock.mock.calls[0][0]).toMatch(
      /^https:\/\/api\.coingecko\.com\//,
    );
    expect(fetchMock.mock.calls[0][1].headers).toEqual({
      'x-cg-demo-api-key': 'gk',
    });
    expect(fetchMock.mock.calls[1][0]).toMatch(
      /^https:\/\/api-pro\.coinpaprika\.com\//,
    );
    expect(fetchMock.mock.calls[1][1].headers).toEqual({Authorization: 'pk'});

    fetchMock.mockClear();
    await fetchRates(
      ['LTC'],
      withKeys({coingecko: {key: 'gk', plan: 'pro'}}),
      false,
      {},
      NOW,
    );
    expect(fetchMock.mock.calls[0][0]).toMatch(
      /^https:\/\/pro-api\.coingecko\.com\//,
    );
    expect(fetchMock.mock.calls[0][1].headers).toEqual({
      'x-cg-pro-api-key': 'gk',
    });
    expect(fetchMock.mock.calls[1][0]).toMatch(
      /^https:\/\/api\.coinpaprika\.com\//,
    );
    expect(fetchMock.mock.calls[1][1].headers).toEqual({});
  });

  it('with Tor on asks only through Tor, and nothing while it is not ready', async () => {
    const httpGet = jest.fn(() =>
      Promise.resolve({
        status_code: 200,
        body: JSON.stringify(gecko({litecoin: 80})),
        error: '',
      }),
    );
    (getTor as jest.Mock).mockResolvedValue({httpGet});
    (isTorReady as jest.Mock).mockResolvedValue(true);
    const {rates} = await fetchRates(
      ['LTC'],
      DEFAULT_RATE_SERVICES,
      true,
      {},
      NOW,
    );
    expect(rates.LTC.usd).toBe(80);
    expect(httpGet).toHaveBeenCalledTimes(1);
    expect(fetchMock).not.toHaveBeenCalled();

    httpGet.mockClear();
    (isTorReady as jest.Mock).mockResolvedValue(false);
    const none = await fetchRates(
      ['LTC'],
      DEFAULT_RATE_SERVICES,
      true,
      {},
      NOW,
    );
    expect(none.rates).toEqual({});
    expect(none.results.coingecko).toEqual({
      kind: 'failed',
      at: NOW,
      message: 'Tor is not ready',
    });
    expect(httpGet).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('freshRate', () => {
  it('counts a rate older than five minutes as none', () => {
    const rates = {LTC: {usd: 80, source: 'coingecko' as const, at: NOW}};
    expect(freshRate(rates, 'ltc', NOW + 300)?.usd).toBe(80);
    expect(freshRate(rates, 'LTC', NOW + 301)).toBeNull();
  });
});

describe('readRateServices', () => {
  it('is on with no keys when nothing is stored', async () => {
    (getItem as jest.Mock).mockResolvedValue(null);
    expect(await readRateServices()).toEqual(DEFAULT_RATE_SERVICES);
    (getItem as jest.Mock).mockResolvedValue(
      JSON.stringify({enabled: false, coingecko: {key: 'gk', plan: 'pro'}}),
    );
    expect(await readRateServices()).toEqual({
      enabled: false,
      coingecko: {key: 'gk', plan: 'pro'},
      coinpaprika: {key: ''},
    });
  });
});

describe('startRateFetcher', () => {
  let stop: () => void = () => {};

  beforeEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
    global.fetch = fetchMock as any;
    (getNetwork as jest.Mock).mockReturnValue('mainnet');
    (readConfig as jest.Mock).mockResolvedValue({
      coins: {
        ltc: {enabled: true},
        btc: {enabled: false},
        part: {enabled: true},
      },
    });
    fetchMock.mockImplementation(() =>
      reply(gecko({litecoin: 80, particl: 0.2})),
    );
  });

  afterEach(() => stop());

  it('fetches every enabled coin', async () => {
    (getItem as jest.Mock).mockResolvedValue(null);
    const dispatch = jest.fn();
    stop = startRateFetcher(dispatch, () => false);
    await settle();
    expect(fetchMock.mock.calls[0][0]).toContain('ids=litecoin,particl&');
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({type: 'mbsx/ratesFetched'}),
    );
  });

  it('switched off clears the rates and asks nothing, until turned on', async () => {
    (getItem as jest.Mock).mockResolvedValue(JSON.stringify({enabled: false}));
    const dispatch = jest.fn();
    stop = startRateFetcher(dispatch, () => false);
    await settle();
    expect(dispatch).toHaveBeenCalledWith({type: 'mbsx/ratesCleared'});
    expect(fetchMock).not.toHaveBeenCalled();

    (getItem as jest.Mock).mockResolvedValue(JSON.stringify({enabled: true}));
    refreshRates();
    await settle();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('never fetches on regtest', async () => {
    (getNetwork as jest.Mock).mockReturnValue('regtest');
    const dispatch = jest.fn();
    stop = startRateFetcher(dispatch, () => false);
    await settle();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
  });
});
