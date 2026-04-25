import * as SecureStore from 'expo-secure-store';
import fiat from '../assets/fiat';

const fiatByCode: Record<string, {symbol_native: string}> = Object.fromEntries(
  fiat.map((f: {code: string; symbol_native: string}) => [f.code, f]),
);

export const TILLO_CATEGORIES = [
  'baby',
  'beauty',
  'books',
  'cars',
  'charity',
  'craft',
  'cryptocurrency',
  'cycling',
  'department-store',
  'electronics',
  'fashion',
  'food-and-drink',
  'gaming',
  'home',
  'jewellery',
  'music',
  'other',
  'school-vouchers',
  'sports',
  'supermarket',
  'toys',
  'travel-and-leisure',
  'tv-and-movies',
] as const;

export type TilloCategory = (typeof TILLO_CATEGORIES)[number];

export interface FaceValue {
  amount: number;
  currency: string;
}

export interface Brand {
  slug: string; // Unique brand identifier
  name: string;
  currency: string; // ISO currency code (e.g., 'USD', 'EUR', 'GBP')
  countries_served?: string[]; // ISO country codes (e.g., ['US', 'CA'])
  logo_url?: string;
  description?: string;
  terms?: string;
  categories?: string[];
  digital_face_value_limits?: {
    lower: number;
    upper: number;
    minor_unit: number;
  };
  denominations?: string[];
  digital_denominations?: number[];
  async_only?: boolean;
  type?: 'gift-card' | 'choice-link';
  priority?: number;
  currencyMinValue?: number;
}

export interface GiftCard {
  id: string;
  brand: string;
  redeemUrl?: string;
  redeemCode?: string;
  pin?: string;
  faceValue: FaceValue;
  expirationDate: string;
  purchasedAt: string;
  status: 'active' | 'redeemed' | 'cancelled' | 'expired';
  logo_url?: string;
}

export interface GiftCardInApp {
  id: string;
  brand: string;
  redeemUrl?: string;
  redeemCode?: string;
  pin?: string;
  faceValue: FaceValue;
  expirationDate: string;
  purchasedAt: string;
  status: 'active' | 'redeemed' | 'cancelled' | 'expired';
  favoured: boolean;
}

export interface PurchaseRequest {
  brand: string;
  amount: number;
  currency: string;
}

export interface PendingGiftCardPurchase {
  id: string;
  userId: string;
  brand: string;
  amount: number;
  currency: string;
  deliveryMethod: 'code' | 'url';
  btcpayInvoiceId: string;
  btcpayPaymentAddress: string;
  btcpayPaymentAmountLtc: string;
  status:
    | 'pending_payment'
    | 'payment_received'
    | 'completed'
    | 'expired'
    | 'failed';
  createdAt: string;
  expiresAt: string;
  logo_url?: string;
}

export interface InitiatePurchaseResponseData {
  pendingPurchaseId: string;
  brand: string;
  amount: number;
  currency: string;
  paymentAddress: string;
  paymentAmountLtc: string;
  checkoutLink: string;
  expiresAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

interface ValidateUserResponse {
  userId: string;
  email: string;
  authenticated: boolean;
}

export class GiftCardClient {
  private baseUrl: string = __DEV__
    ? 'https://stage-api.nexuswallet.com'
    : 'https://api.nexuswallet.com';

  constructor() {}

  private async request<T>(
    method: string,
    endpoint: string,
    body?: object,
  ): Promise<T> {
    const token = await SecureStore.getItemAsync('sessionToken');

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (error: any) {
      console.warn(String(error));
      throw new GiftCardError(
        'Unable to connect to server. Please check your connection and try again.',
        0,
      );
    }

    let data: ApiResponse<T>;
    try {
      data = await response.json();
    } catch (error: any) {
      console.warn(String(error));
      throw new GiftCardError(
        'Unable to connect to server. Please try again later.',
        response.status,
      );
    }

    if (!response.ok || !data.success) {
      throw new GiftCardError(
        data.error || data.message || 'Request failed',
        response.status,
      );
    }

    return data.data as T;
  }

  // NOTE: Deprecate unfiltered brands fetching since we have to make sure that
  // users do not accidentally purchase giftcards for a wrong region
  // async getBrands(): Promise<Brand[]> {
  //   return this.request<Brand[]>('GET', '/api/gift-cards/brands');
  // }

  async getBrandsFiltered(options?: {
    country?: string;
    currency?: string;
  }): Promise<Brand[]> {
    const params = new URLSearchParams();
    if (options?.country) params.append('country', options.country);
    const query = params.toString();
    return this.request<Brand[]>(
      'GET',
      `/api/gift-cards/brands-filtered${query ? `?${query}` : ''}`,
    );
  }

  async getBrand(slug: string): Promise<Brand> {
    return this.request<Brand>('GET', `/api/gift-cards/brands/${slug}`);
  }

  async purchase(request: PurchaseRequest): Promise<GiftCard> {
    return this.request<GiftCard>('POST', '/api/gift-cards/purchase', request);
  }

  async initiatePurchase(
    request: PurchaseRequest,
  ): Promise<InitiatePurchaseResponseData> {
    return this.request<InitiatePurchaseResponseData>(
      'POST',
      '/api/gift-cards/purchase',
      request,
    );
  }

  async validateUser(email: string): Promise<ValidateUserResponse> {
    return this.request<ValidateUserResponse>(
      'POST',
      '/api/gift-cards/validate-user',
      {
        email,
      },
    );
  }

  async getMyGiftCards(): Promise<GiftCard[]> {
    return this.request<GiftCard[]>('GET', '/api/gift-cards');
  }

  async getMyPendingGiftCards(): Promise<PendingGiftCardPurchase[]> {
    return this.request<PendingGiftCardPurchase[]>(
      'GET',
      '/api/gift-cards/pending',
    );
  }

  async getGiftCard(id: string): Promise<GiftCard> {
    return this.request<GiftCard>('GET', `/api/gift-cards/${id}`);
  }

  async markAsRedeemed(id: string): Promise<GiftCard> {
    return this.request<GiftCard>('POST', `/api/gift-cards/${id}/redeem`);
  }

  async cancel(id: string): Promise<GiftCard> {
    return this.request<GiftCard>('POST', `/api/gift-cards/${id}/cancel`);
  }

  async getWishlist(): Promise<string[]> {
    return this.request<string[]>('GET', '/api/shop/wishlist');
  }

  async addToWishlist(brandSlug: string): Promise<void> {
    await this.request<void>('POST', `/api/shop/wishlist/${brandSlug}`);
  }

  async removeFromWishlist(brandSlug: string): Promise<void> {
    await this.request<void>('DELETE', `/api/shop/wishlist/${brandSlug}`);
  }
}

export class GiftCardError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'GiftCardError';
    this.status = status;
  }
}

export function validateAmount(
  brand: Brand,
  amount: number,
  availableBalanceFiat?: number,
): {valid: boolean; error?: string} {
  if (brand.currencyMinValue && amount < brand.currencyMinValue) {
    return {valid: false, error: `Minimum amount is ${brand.currencyMinValue}`};
  }

  if (brand.denominations && brand.denominations.length > 0) {
    if (!brand.denominations.some(d => Number(d) === Number(amount))) {
      return {
        valid: false,
        error: `Amount must be one of: ${brand.denominations.join(', ')}`,
      };
    }
    if (availableBalanceFiat !== undefined && amount > availableBalanceFiat) {
      return {valid: false, error: 'Insufficient balance'};
    }
    return {valid: true};
  }

  if (brand.digital_face_value_limits) {
    const {lower, upper, minor_unit} = brand.digital_face_value_limits;

    if (amount < lower) {
      return {valid: false, error: `Minimum amount is ${lower}`};
    }
    if (amount > upper) {
      return {valid: false, error: `Maximum amount is ${upper}`};
    }

    const multiplier = 1 / minor_unit;
    if ((amount * multiplier) % 1 !== 0) {
      return {
        valid: false,
        error: `Amount must be divisible by ${minor_unit}`,
      };
    }

    if (availableBalanceFiat !== undefined && amount > availableBalanceFiat) {
      return {valid: false, error: 'Insufficient balance'};
    }

    return {valid: true};
  }

  if (availableBalanceFiat !== undefined && amount > availableBalanceFiat) {
    return {valid: false, error: 'Insufficient balance'};
  }

  return {valid: true};
}

export function isExpired(giftCard: GiftCard): boolean {
  return new Date(giftCard.expirationDate) < new Date();
}

export function daysUntilExpiration(giftCard: GiftCard): number {
  const now = new Date();
  const expiration = new Date(giftCard.expirationDate);
  const diffTime = expiration.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function formatAmount(amount: number, currency: string): string {
  const symbol = fiatByCode[currency]?.symbol_native ?? currency + ' ';
  return `${symbol}${amount.toFixed(2)}`;
}

export function formatCurrency(currency: string): string {
  return fiatByCode[currency]?.symbol_native ?? currency + ' ';
}

const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  US: 'USD',
  GB: 'GBP',
  CA: 'CAD',
  AL: 'EUR',
  AU: 'AUD',
  BH: 'BHD',
  CN: 'CNY',
  CZ: 'CZK',
  DK: 'DKK',
  FR: 'EUR',
  GE: 'GEL',
  DE: 'EUR',
  HK: 'HKD',
  HU: 'HUF',
  IN: 'INR',
  ID: 'IDR',
  IR: 'IRR',
  IE: 'EUR',
  IT: 'EUR',
  JP: 'JPY',
  KW: 'KWD',
  LT: 'EUR',
  LU: 'EUR',
  NL: 'EUR',
  NZ: 'NZD',
  NO: 'NOK',
  OM: 'OMR',
  PH: 'PHP',
  PL: 'PLN',
  PT: 'EUR',
  QA: 'QAR',
  RO: 'RON',
  RU: 'RUB',
  SA: 'SAR',
  KR: 'KRW',
  ES: 'EUR',
  LK: 'LKR',
  SE: 'SEK',
  CH: 'CHF',
  TH: 'THB',
  TR: 'TRY',
  UA: 'UAH',
  AE: 'AED',
  UM: 'USD',
};

export function getCurrencyForCountry(countryCode: string): {
  country: string;
  currency: string;
} {
  const code = countryCode.toUpperCase();
  return {
    country: code,
    currency: COUNTRY_CURRENCY_MAP[code] || 'USD',
  };
}

export function createGiftCardClient(): GiftCardClient {
  return new GiftCardClient();
}

// Filter brands by country code (e.g., 'US', 'DE', 'GB')
export function filterBrandsByCountry(
  brands: Brand[],
  countryCode: string,
): Brand[] {
  return brands.filter(
    brand =>
      brand.countries_served?.includes(countryCode.toUpperCase()) ?? false,
  );
}
