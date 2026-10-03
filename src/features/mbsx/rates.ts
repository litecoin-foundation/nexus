import type {AppDispatch} from '../../store';
import {getItem, setItem} from '../../utils/keychain';
import {getTor, isTorReady} from '../../utils/tor';
import {readConfig} from './adapter/config';
import {ratesCleared, ratesFetched} from './mbsxSlice';
import {getNetwork} from './network';

export type RateSource = 'coingecko' | 'coinpaprika' | 'mexc';

export const RATE_SOURCES: RateSource[] = ['coingecko', 'coinpaprika', 'mexc'];

export const SOURCE_NAMES: Record<RateSource, string> = {
  coingecko: 'CoinGecko',
  coinpaprika: 'CoinPaprika',
  mexc: 'MEXC',
};

// basicswap's chainparams rate_ids
const RATE_IDS: Record<RateSource, Record<string, string>> = {
  coingecko: {
    LTC: 'litecoin',
    BTC: 'bitcoin',
    PART: 'particl',
    FIRO: 'zcoin',
    XMR: 'monero',
  },
  coinpaprika: {
    LTC: 'ltc-litecoin',
    BTC: 'btc-bitcoin',
    PART: 'part-particl',
    FIRO: 'firo-firo',
    XMR: 'xmr-monero',
  },
  mexc: {
    LTC: 'LTCUSDT',
    BTC: 'BTCUSDT',
    PART: 'PARTUSDT',
    FIRO: 'FIROUSDT',
    XMR: 'XMRUSDT',
  },
};

export type CoinRate = {usd: number; source: RateSource; at: number};

export type SourceResult =
  | {kind: 'ok'; at: number; coins: string[]}
  | {kind: 'limited'; until: number}
  | {kind: 'failed'; at: number; message: string};

export type RateServices = {
  enabled: boolean;
  coingecko: {key: string; plan: 'demo' | 'pro'};
  coinpaprika: {key: string};
};

export const DEFAULT_RATE_SERVICES: RateServices = {
  enabled: true,
  coingecko: {key: '', plan: 'demo'},
  coinpaprika: {key: ''},
};

export const RATE_MAX_AGE = 5 * 60;
const SOURCE_MAX_AGE = 15 * 60;
const FETCH_MS = 60 * 1000;
const BACKOFF_MIN = 60;
const BACKOFF_MAX = 15 * 60;
const TIMEOUT_MS = 30 * 1000;
const KEYCHAIN_ITEM = 'mbsx_rate_services';

export const readRateServices = async (): Promise<RateServices> => {
  try {
    const raw = await getItem(KEYCHAIN_ITEM);
    if (!raw) {
      return DEFAULT_RATE_SERVICES;
    }
    const stored = JSON.parse(raw);
    return {
      enabled: stored.enabled !== false,
      coingecko: {
        key: String(stored.coingecko?.key ?? ''),
        plan: stored.coingecko?.plan === 'pro' ? 'pro' : 'demo',
      },
      coinpaprika: {key: String(stored.coinpaprika?.key ?? '')},
    };
  } catch {
    return DEFAULT_RATE_SERVICES;
  }
};

export const writeRateServices = (services: RateServices): Promise<void> =>
  setItem(KEYCHAIN_ITEM, JSON.stringify(services));

class RateLimited extends Error {}

const getJson = async (
  url: string,
  headers: Record<string, string>,
  viaTor: boolean,
): Promise<any> => {
  if (viaTor) {
    // No direct fallback, unlike fetchResolve: it would reveal this device
    const tor = (await isTorReady()) ? await getTor() : null;
    if (!tor) {
      throw new Error('Tor is not ready');
    }
    const rv = await tor.httpGet({
      url,
      headers: JSON.stringify(headers),
      timeout_ms: TIMEOUT_MS,
    });
    if (rv.status_code === 429) {
      throw new RateLimited('Rate limited');
    }
    if (rv.status_code < 200 || rv.status_code >= 300) {
      throw new Error(rv.error || `HTTP ${rv.status_code}`);
    }
    return JSON.parse(rv.body);
  }
  // Not Nexus's fetch wrapper, which loses a JSON error's status
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {headers, signal: controller.signal});
    if (res.status === 429) {
      throw new RateLimited('Rate limited');
    }
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
};

type Fetcher = (
  coins: string[],
  services: RateServices,
  viaTor: boolean,
  now: number,
) => Promise<Record<string, number>>;

const perCoin = async (
  coins: string[],
  one: (coin: string) => Promise<number | null>,
): Promise<Record<string, number>> => {
  const rates: Record<string, number> = {};
  let failure: Error | null = null;
  for (const coin of coins) {
    try {
      const usd = await one(coin);
      if (usd !== null) {
        rates[coin] = usd;
      }
    } catch (e) {
      if (e instanceof RateLimited) {
        throw e;
      }
      failure = e as Error;
    }
  }
  if (failure && Object.keys(rates).length === 0) {
    throw failure;
  }
  return rates;
};

const fetchCoinGecko: Fetcher = async (coins, services, viaTor, now) => {
  const {key, plan} = services.coingecko;
  const root =
    key && plan === 'pro'
      ? 'https://pro-api.coingecko.com/api/v3'
      : 'https://api.coingecko.com/api/v3';
  const headers: Record<string, string> = !key
    ? {}
    : plan === 'pro'
      ? {'x-cg-pro-api-key': key}
      : {'x-cg-demo-api-key': key};
  const ids = coins.map(coin => RATE_IDS.coingecko[coin]).join(',');
  const js = await getJson(
    `${root}/simple/price?ids=${ids}&vs_currencies=usd&include_last_updated_at=true`,
    headers,
    viaTor,
  );
  const rates: Record<string, number> = {};
  for (const coin of coins) {
    const row = js?.[RATE_IDS.coingecko[coin]];
    if (
      typeof row?.usd === 'number' &&
      row.usd > 0 &&
      (row.last_updated_at ?? 0) >= now - SOURCE_MAX_AGE
    ) {
      rates[coin] = row.usd;
    }
  }
  return rates;
};

const fetchCoinPaprika: Fetcher = (coins, services, viaTor, now) => {
  const {key} = services.coinpaprika;
  const root = key
    ? 'https://api-pro.coinpaprika.com/v1'
    : 'https://api.coinpaprika.com/v1';
  const headers: Record<string, string> = key ? {Authorization: key} : {};
  return perCoin(coins, async coin => {
    const js = await getJson(
      `${root}/tickers/${RATE_IDS.coinpaprika[coin]}?quotes=USD`,
      headers,
      viaTor,
    );
    const usd = js?.quotes?.USD?.price;
    const updated = Date.parse(js?.last_updated ?? '') / 1000;
    return typeof usd === 'number' && usd > 0 && updated >= now - SOURCE_MAX_AGE
      ? usd
      : null;
  });
};

// USDT, taken as USD as basicswap does
const fetchMexc: Fetcher = (coins, _services, viaTor) =>
  perCoin(coins, async coin => {
    const js = await getJson(
      `https://api.mexc.com/api/v3/ticker/24hr?symbol=${RATE_IDS.mexc[coin]}`,
      {},
      viaTor,
    );
    const usd = Number(js?.lastPrice);
    return Number.isFinite(usd) && usd > 0 ? usd : null;
  });

const FETCHERS: Record<RateSource, Fetcher> = {
  coingecko: fetchCoinGecko,
  coinpaprika: fetchCoinPaprika,
  mexc: fetchMexc,
};

export type Backoff = Partial<
  Record<RateSource, {delay: number; until: number}>
>;

export const fetchRates = async (
  coins: string[],
  services: RateServices,
  viaTor: boolean,
  backoff: Backoff,
  now: number,
) => {
  const rates: Record<string, CoinRate> = {};
  const results: Partial<Record<RateSource, SourceResult>> = {};
  for (const source of RATE_SOURCES) {
    const wanted = coins.filter(
      coin => !(coin in rates) && RATE_IDS[source][coin] !== undefined,
    );
    if (wanted.length === 0) {
      continue;
    }
    const held = backoff[source];
    if (held && held.until > now) {
      results[source] = {kind: 'limited', until: held.until};
      continue;
    }
    try {
      const got = await FETCHERS[source](wanted, services, viaTor, now);
      for (const [coin, usd] of Object.entries(got)) {
        rates[coin] = {usd, source, at: now};
      }
      delete backoff[source];
      results[source] = {kind: 'ok', at: now, coins: Object.keys(got)};
    } catch (e) {
      if (e instanceof RateLimited) {
        const delay = held
          ? Math.min(held.delay * 2, BACKOFF_MAX)
          : BACKOFF_MIN;
        backoff[source] = {delay, until: now + delay};
        results[source] = {kind: 'limited', until: now + delay};
      } else {
        results[source] = {
          kind: 'failed',
          at: now,
          message: (e as Error).message,
        };
      }
    }
  }
  return {rates, results};
};

export const freshRate = (
  rates: Record<string, CoinRate>,
  coin: string,
  now: number,
): CoinRate | null => {
  const rate = rates[coin.toUpperCase()];
  return rate && now - rate.at <= RATE_MAX_AGE ? rate : null;
};

export type Reference = {send: number; receive: number; label: string};

export const independentReference = (
  rates: Record<string, CoinRate>,
  sendCoin: string,
  receiveCoin: string,
  now: number,
): Reference | null => {
  const send = freshRate(rates, sendCoin, now);
  const receive = freshRate(rates, receiveCoin, now);
  if (!send || !receive) {
    return null;
  }
  const names = [...new Set([send.source, receive.source])].map(
    source => SOURCE_NAMES[source],
  );
  return {
    send: send.usd,
    receive: receive.usd,
    label: `${names.join(' and ')} rate`,
  };
};

const fetchedCoins = async (): Promise<string[]> => {
  const config = await readConfig();
  const enabled = Object.entries(config?.coins ?? {})
    .filter(([, coin]) => coin.enabled === true)
    .map(([ticker]) => ticker.toUpperCase());
  return [...new Set(['LTC', ...enabled])];
};

let refresh: (() => void) | null = null;

export const refreshRates = () => refresh?.();

export const startRateFetcher = (
  dispatch: AppDispatch,
  torEnabled: () => boolean,
): (() => void) => {
  // Real prices mean nothing for regtest coins, and the rig's differ from them
  if (getNetwork() === 'regtest') {
    return () => {};
  }
  const backoff: Backoff = {};
  let stopped = false;
  let busy = false;
  let again = false;
  const tick = async () => {
    if (busy) {
      again = true;
      return;
    }
    busy = true;
    try {
      const services = await readRateServices();
      if (stopped) {
        return;
      }
      if (!services.enabled) {
        dispatch(ratesCleared());
        return;
      }
      const rv = await fetchRates(
        await fetchedCoins(),
        services,
        torEnabled(),
        backoff,
        Math.floor(Date.now() / 1000),
      );
      if (!stopped) {
        dispatch(ratesFetched(rv));
      }
    } catch (e) {
      console.warn('mbsx rate fetch failed', e);
    } finally {
      busy = false;
      if (again && !stopped) {
        again = false;
        void tick();
      }
    }
  };
  refresh = () => void tick();
  void tick();
  const timer = setInterval(() => void tick(), FETCH_MS);
  return () => {
    stopped = true;
    clearInterval(timer);
    refresh = null;
  };
};
