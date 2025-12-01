export interface FaceValue {
  amount: number;
  currency: string;
}

export interface Brand {
  slug: string; // Unique brand identifier
  name: string;
  logo_url?: string;
  categories?: string[];
  digital_face_value_limits?: {
    minimum: number;
    maximum: number;
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
  private baseUrl: string = 'https://api.nexuswallet.com';
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
    if (__DEV__) {
      return [
        {
          slug: 'amazon',
          name: 'Amazon',
          logo_url: 'https://logo.clearbit.com/amazon.com',
          categories: ['retail', 'marketplace'],
          digital_face_value_limits: { minimum: 10, maximum: 500, minor_unit: 1 },
          type: 'gift-card',
        },
        {
          slug: 'starbucks',
          name: 'Starbucks',
          logo_url: 'https://logo.clearbit.com/starbucks.com',
          categories: ['food', 'coffee'],
          denominations: [5, 10, 15, 25, 50, 100],
          type: 'gift-card',
        },
        {
          slug: 'target',
          name: 'Target',
          logo_url: 'https://logo.clearbit.com/target.com',
          categories: ['retail', 'department-store'],
          digital_face_value_limits: { minimum: 5, maximum: 300, minor_unit: 0.5 },
          type: 'gift-card',
        },
        {
          slug: 'spotify',
          name: 'Spotify',
          logo_url: 'https://logo.clearbit.com/spotify.com',
          categories: ['entertainment', 'music'],
          denominations: [10, 30, 50],
          type: 'gift-card',
        },
        {
          slug: 'netflix',
          name: 'Netflix',
          logo_url: 'https://logo.clearbit.com/netflix.com',
          categories: ['entertainment', 'streaming'],
          denominations: [15, 25, 50, 100],
          type: 'gift-card',
        },
        {
          slug: 'walmart',
          name: 'Walmart',
          logo_url: 'https://logo.clearbit.com/walmart.com',
          categories: ['retail', 'grocery'],
          digital_face_value_limits: { minimum: 20, maximum: 1000, minor_unit: 1 },
          type: 'gift-card',
        },
        {
          slug: 'apple',
          name: 'Apple',
          logo_url: 'https://logo.clearbit.com/apple.com',
          categories: ['technology', 'apps'],
          denominations: [10, 25, 50, 100],
          type: 'gift-card',
        },
        {
          slug: 'google-play',
          name: 'Google Play',
          logo_url: 'https://logo.clearbit.com/play.google.com',
          categories: ['technology', 'apps'],
          denominations: [10, 25, 50],
          type: 'gift-card',
        },
        {
          slug: 'uber',
          name: 'Uber',
          logo_url: 'https://logo.clearbit.com/uber.com',
          categories: ['transportation', 'delivery'],
          digital_face_value_limits: { minimum: 15, maximum: 200, minor_unit: 1 },
          type: 'gift-card',
        },
        {
          slug: 'steam',
          name: 'Steam',
          logo_url: 'https://logo.clearbit.com/steampowered.com',
          categories: ['gaming', 'entertainment'],
          denominations: [5, 10, 20, 50, 100],
          type: 'gift-card',
        },
      ];
    }
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
    const {minimum, maximum, minor_unit} = brand.digital_face_value_limits;

    if (amount < minimum) {
      return {valid: false, error: `Minimum amount is ${minimum}`};
    }
    if (amount > maximum) {
      return {valid: false, error: `Maximum amount is ${maximum}`};
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

export function createGiftCardClient(uniqueId: string): GiftCardClient {
  return new GiftCardClient(uniqueId);
}
