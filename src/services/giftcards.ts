export interface FaceValue {
  amount: number;
  currency: string;
}

export interface Brand {
  slug: string; // Unique brand identifier
  name: string;
  currency: string;
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

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export class GiftCardClient {
  private baseUrl: string = __DEV__
    ? 'http://mylocalip:3000'
    : 'https://api.nexuswallet.com';
  private uuid: string;

  constructor(uuid: string) {
    this.uuid = uuid;
  }

  private async request<T>(
    method: string,
    endpoint: string,
    body?: object,
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.uuid}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data: ApiResponse<T> = await response.json();

    if (!response.ok || !data.success) {
      throw new GiftCardError(
        data.error || data.message || 'Request failed',
        response.status,
      );
    }

    return data.data as T;
  }

  async getBrands(): Promise<Brand[]> {
    return this.request<Brand[]>('GET', '/api/gift-cards/brands');
  }

  async getBrand(slug: string): Promise<Brand> {
    return this.request<Brand>('GET', `/api/gift-cards/brands/${slug}`);
  }

  async purchase(request: PurchaseRequest): Promise<GiftCard> {
    return this.request<GiftCard>('POST', '/api/gift-cards/purchase', request);
  }

  async getMyGiftCards(): Promise<GiftCard[]> {
    return this.request<GiftCard[]>('GET', '/api/gift-cards');
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
): {valid: boolean; error?: string} {
  if (brand.denominations && brand.denominations.length > 0) {
    if (!brand.denominations.includes(amount)) {
      return {
        valid: false,
        error: `Amount must be one of: ${brand.denominations.join(', ')}`,
      };
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

    return {valid: true};
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

export function formatCurrency(amount: number, currency: string): string {
  const symbols: Record<string, string> = {
    GBP: '£',
    USD: '$',
    EUR: '€',
    CAD: 'C$',
    AUD: 'A$',
  };
  const symbol = symbols[currency] || currency + ' ';
  return `${symbol}${amount.toFixed(2)}`;
}

export function createGiftCardClient(uniqueId: string): GiftCardClient {
  return new GiftCardClient(uniqueId);
}
