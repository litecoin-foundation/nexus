import * as SecureStore from 'expo-secure-store';

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
  categories?: string[];
  digital_face_value_limits?: {
    lower: number;
    upper: number;
    minor_unit: number;
  };
  denominations?: number[];
  async_only?: boolean;
  type?: 'gift-card' | 'choice-link';
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
    if (options?.currency) params.append('currency', options.currency);
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
  if (brand.denominations && brand.denominations.length > 0) {
    if (!brand.denominations.includes(amount)) {
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
  const symbols: Record<string, string> = {
    USD: '$',
    CAD: 'C$',
    AUD: 'A$',
    EUR: '€',
    GBP: '£',
  };
  const symbol = symbols[currency] || currency + ' ';
  return `${symbol}${amount.toFixed(2)}`;
}

export function formatCurrency(currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$',
    CAD: 'C$',
    AUD: 'A$',
    EUR: '€',
    GBP: '£',
  };
  const symbol = symbols[currency] || currency + ' ';
  return symbol;
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

// Filter brands by currency (e.g., 'USD', 'EUR', 'GBP')
export function filterBrandsByCurrency(
  brands: Brand[],
  currency: string,
): Brand[] {
  return brands.filter(
    brand => brand.currency.toUpperCase() === currency.toUpperCase(),
  );
}
