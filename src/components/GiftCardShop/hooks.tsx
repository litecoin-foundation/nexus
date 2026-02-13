import React, {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
  ReactNode,
  useRef,
  useMemo,
} from 'react';
import {getCountry} from 'react-native-localize';

import {
  GiftCardClient,
  Brand,
  GiftCard,
  PendingGiftCardPurchase,
  InitiatePurchaseResponseData,
  PurchaseRequest,
  validateAmount,
  filterBrandsByCountry,
} from '../../services/giftcards';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {setGiftCards} from '../../reducers/nexusshopaccount';

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
  const account = useAppSelector(state => state.nexusshopaccount.account);
  const [data, setData] = useState<Brand[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fallback to user location if user unlogged
  const userCountry = account?.userCountry || getCountry();

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Get filtered brands from api
      let brands = await client.getBrandsFiltered({
        country: userCountry,
      });

      // Client side filtering as a safety net
      brands = filterBrandsByCountry(brands, userCountry);

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
  }, [client, userCountry]);

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

export function useMyGiftCards(): UseQueryResult<{
  giftCards: GiftCard[];
  pendingGiftCards: PendingGiftCardPurchase[];
}> {
  const client = useGiftCardClient();
  const dispatch = useAppDispatch();
  const existingGiftCards = useAppSelector(
    state => state.nexusshopaccount.giftCards,
  );
  const existingGiftCardsRef = useRef(existingGiftCards);
  const [data, setData] = useState<{
    giftCards: GiftCard[];
    pendingGiftCards: PendingGiftCardPurchase[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Update ref when existingGiftCards changes
  existingGiftCardsRef.current = existingGiftCards;

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const cards: GiftCard[] = await client.getMyGiftCards();
      const pendingCards: PendingGiftCardPurchase[] =
        await client.getMyPendingGiftCards();

      setData({
        giftCards: cards,
        pendingGiftCards: pendingCards,
      });

      // Preserve favoured state from existing cards using ref
      const cardsWithPreservedFavoured = cards.map(newCard => {
        const existingCard = existingGiftCardsRef.current.find(
          existing => existing.id === newCard.id,
        );
        return {
          ...newCard,
          favoured: existingCard ? existingCard.favoured : false,
        };
      });

      dispatch(setGiftCards(cardsWithPreservedFavoured));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch gift cards',
      );
    } finally {
      setLoading(false);
    }
  }, [client, dispatch]);

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

// Initiate purchase call
export function useInitiatePurchaseGiftCard(): UseMutationResult<
  InitiatePurchaseResponseData,
  PurchaseRequest
> {
  const client = useGiftCardClient();
  const [data, setData] = useState<InitiatePurchaseResponseData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (request: PurchaseRequest): Promise<InitiatePurchaseResponseData> => {
      setLoading(true);
      setError(null);
      try {
        const initiatePurchaseResponseData =
          await client.initiatePurchase(request);
        setData(initiatePurchaseResponseData);
        return initiatePurchaseResponseData;
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
export function usePurchaseFlow(
  brand: Brand | null,
  initialCurrency: string = 'USD',
) {
  const [amount, setAmount] = useState<number>(0);
  const [currency, setCurrency] = useState<string>(initialCurrency);
  const [validation, setValidation] = useState<{
    valid: boolean;
    error?: string;
  }>({
    valid: false,
  });
  const {
    mutate: initiatePurchase,
    loading,
    error,
    data: initiateResponse,
    reset,
  } = useInitiatePurchaseGiftCard();

  const confirmedBalance = useAppSelector(
    state => state.balance.confirmedBalance,
  );
  const rates = useAppSelector(
    state => (state.ticker as any).rates as {[key: string]: number} | undefined,
  );

  const availableBalanceFiat = useMemo(() => {
    const rate = rates?.[currency.toUpperCase()];
    if (!rate || !confirmedBalance) return undefined;
    return (Number(confirmedBalance) / 1e8) * rate;
  }, [confirmedBalance, rates, currency]);

  useEffect(() => {
    if (!brand) {
      setValidation({valid: false, error: 'Select a brand'});
      return;
    }
    if (amount <= 0) {
      setValidation({valid: false, error: 'Enter an amount'});
      return;
    }
    setValidation(validateAmount(brand, amount, availableBalanceFiat));
  }, [brand, amount, availableBalanceFiat]);

  const submit = useCallback(async () => {
    if (!brand || !validation.valid) return null;

    return initiatePurchase({
      brand: brand.slug,
      amount,
      currency,
    });
  }, [brand, amount, currency, validation.valid, initiatePurchase]);

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
    initiateResponse,
    resetFlow,
  };
}
