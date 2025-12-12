import React, {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
  ReactNode,
} from 'react';
import {
  GiftCardClient,
  Brand,
  GiftCard,
  PurchaseRequest,
  validateAmount,
} from '../../services/giftcards';

// Context ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
const GiftCardClientContext = createContext<GiftCardClient | null>(null);

interface GiftCardProviderProps {
  client: GiftCardClient | null;
  children: ReactNode;
}

export function GiftCardProvider({client, children}: GiftCardProviderProps) {
  return (
    <GiftCardClientContext.Provider value={client}>
      {children}
    </GiftCardClientContext.Provider>
  );
}

function useGiftCardClient(): GiftCardClient {
  const client = useContext(GiftCardClientContext);
  if (!client) {
    throw new Error('useGiftCardClient must be used within a GiftCardProvider');
  }
  return client;
}

// Queries ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
interface UseQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useBrands(): UseQueryResult<Brand[]> {
  const client = useGiftCardClient();
  const [data, setData] = useState<Brand[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const brands = await client.getBrands();
      if (Array.isArray(brands)) {
        setData(brands);
      } else {
        setError('Invalid brands data format');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch brands');
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return {data, loading, error, refetch: fetch};
}

export function useBrand(slug: string): UseQueryResult<Brand> {
  const client = useGiftCardClient();
  const [data, setData] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const brand = await client.getBrand(slug);
      setData(brand);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch brand');
    } finally {
      setLoading(false);
    }
  }, [client, slug]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return {data, loading, error, refetch: fetch};
}

export function useMyGiftCards(): UseQueryResult<GiftCard[]> {
  const client = useGiftCardClient();
  const [data, setData] = useState<GiftCard[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const cards = await client.getMyGiftCards();
      setData(cards);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch gift cards',
      );
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return {data, loading, error, refetch: fetch};
}

export function useGiftCard(id: string): UseQueryResult<GiftCard> {
  const client = useGiftCardClient();
  const [data, setData] = useState<GiftCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const card = await client.getGiftCard(id);
      setData(card);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch gift card',
      );
    } finally {
      setLoading(false);
    }
  }, [client, id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return {data, loading, error, refetch: fetch};
}

// Mutations ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
interface UseMutationResult<TData, TVariables> {
  mutate: (variables: TVariables) => Promise<TData>;
  data: TData | null;
  loading: boolean;
  error: string | null;
  reset: () => void;
}

// Purchase call
export function usePurchaseGiftCard(): UseMutationResult<
  GiftCard,
  PurchaseRequest
> {
  const client = useGiftCardClient();
  const [data, setData] = useState<GiftCard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (request: PurchaseRequest): Promise<GiftCard> => {
      setLoading(true);
      setError(null);
      try {
        const card = await client.purchase(request);
        setData(card);
        return card;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to purchase';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [client],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return {mutate, data, loading, error, reset};
}

// Mark as redeemed call
export function useRedeemGiftCard(): UseMutationResult<GiftCard, string> {
  const client = useGiftCardClient();
  const [data, setData] = useState<GiftCard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (id: string): Promise<GiftCard> => {
      setLoading(true);
      setError(null);
      try {
        const card = await client.markAsRedeemed(id);
        setData(card);
        return card;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to redeem';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [client],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return {mutate, data, loading, error, reset};
}

// Flows ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
// Purchase flow
export function usePurchaseFlow(brand: Brand | null) {
  const [amount, setAmount] = useState<number>(0);
  const [currency, setCurrency] = useState<string>('GBP');
  const [validation, setValidation] = useState<{
    valid: boolean;
    error?: string;
  }>({
    valid: false,
  });
  const {
    mutate: purchase,
    loading,
    error,
    data: purchasedCard,
    reset,
  } = usePurchaseGiftCard();

  useEffect(() => {
    if (!brand) {
      setValidation({valid: false, error: 'Select a brand'});
      return;
    }
    if (amount <= 0) {
      setValidation({valid: false, error: 'Enter an amount'});
      return;
    }
    setValidation(validateAmount(brand, amount));
  }, [brand, amount]);

  const submit = useCallback(async () => {
    if (!brand || !validation.valid) return null;

    return purchase({
      brand: brand.slug,
      amount,
      currency,
    });
  }, [brand, amount, currency, validation.valid, purchase]);

  const resetFlow = useCallback(() => {
    setAmount(0);
    reset();
  }, [reset]);

  return {
    amount,
    setAmount,
    currency,
    setCurrency,
    validation,
    submit,
    loading,
    error,
    purchasedCard,
    resetFlow,
  };
}
