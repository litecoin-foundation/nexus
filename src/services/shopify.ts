import {createStorefrontApiClient} from '@shopify/storefront-api-client';

const SHOPIFY_PUBLIC_ACCESS_TOKEN = '476977e6963fcc8cd1d6a38000e10c62';

export const shopifyClient = createStorefrontApiClient({
  storeDomain: 'litecoin-11.myshopify.com',
  apiVersion: '2025-10',
  publicAccessToken: SHOPIFY_PUBLIC_ACCESS_TOKEN,
});

export const PRODUCTS_QUERY = `
  query GetProducts($first: Int!) {
    products(first: $first) {
      edges {
        node {
          id
          title
          handle
          description
          images(first: 1) {
            edges {
              node {
                url
                altText
              }
            }
          }
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
            maxVariantPrice {
              amount
              currencyCode
            }
          }
          variants(first: 1) {
            edges {
              node {
                id
                title
                price {
                  amount
                  currencyCode
                }
                availableForSale
              }
            }
          }
        }
      }
    }
  }
`;

export const COLLECTIONS_QUERY = `
  query GetCollections($first: Int!) {
    collections(first: $first) {
      edges {
        node {
          id
          title
          handle
          description
          image {
            url
            altText
          }
          products(first: 20) {
            edges {
              node {
                id
                title
                handle
                description
                images(first: 1) {
                  edges {
                    node {
                      url
                      altText
                    }
                  }
                }
                priceRange {
                  minVariantPrice {
                    amount
                    currencyCode
                  }
                  maxVariantPrice {
                    amount
                    currencyCode
                  }
                }
                variants(first: 1) {
                  edges {
                    node {
                      id
                      title
                      price {
                        amount
                        currencyCode
                      }
                      availableForSale
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const CART_CREATE_MUTATION = `
  mutation CartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        id
        createdAt
        updatedAt
        checkoutUrl
        lines(first: 100) {
          edges {
            node {
              id
              quantity
              merchandise {
                ... on ProductVariant {
                  id
                  title
                  priceV2 {
                    amount
                    currencyCode
                  }
                  product {
                    id
                    title
                    handle
                    images(first: 1) {
                      edges {
                        node {
                          url
                          altText
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
        cost {
          totalAmount {
            amount
            currencyCode
          }
          subtotalAmount {
            amount
            currencyCode
          }
          totalTaxAmount {
            amount
            currencyCode
          }
          totalDutyAmount {
            amount
            currencyCode
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const CART_LINES_ADD_MUTATION = `
  mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        id
        createdAt
        updatedAt
        checkoutUrl
        lines(first: 100) {
          edges {
            node {
              id
              quantity
              merchandise {
                ... on ProductVariant {
                  id
                  title
                  priceV2 {
                    amount
                    currencyCode
                  }
                  product {
                    id
                    title
                    handle
                    images(first: 1) {
                      edges {
                        node {
                          url
                          altText
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
        cost {
          totalAmount {
            amount
            currencyCode
          }
          subtotalAmount {
            amount
            currencyCode
          }
          totalTaxAmount {
            amount
            currencyCode
          }
          totalDutyAmount {
            amount
            currencyCode
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const CART_LINES_UPDATE_MUTATION = `
  mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart {
        id
        lines(first: 100) {
          edges {
            node {
              id
              quantity
              merchandise {
                ... on ProductVariant {
                  id
                  title
                  priceV2 {
                    amount
                    currencyCode
                  }
                  product {
                    id
                    title
                    handle
                  }
                }
              }
            }
          }
        }
        cost {
          totalAmount {
            amount
            currencyCode
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const CART_QUERY = `
  query GetCart($cartId: ID!) {
    cart(id: $cartId) {
      id
      createdAt
      updatedAt
      checkoutUrl
      lines(first: 100) {
        edges {
          node {
            id
            quantity
            merchandise {
              ... on ProductVariant {
                id
                title
                priceV2 {
                  amount
                  currencyCode
                }
                product {
                  id
                  title
                  handle
                  images(first: 1) {
                    edges {
                      node {
                        url
                        altText
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      cost {
        totalAmount {
          amount
          currencyCode
        }
        subtotalAmount {
          amount
          currencyCode
        }
        totalTaxAmount {
          amount
          currencyCode
        }
        totalDutyAmount {
          amount
          currencyCode
        }
      }
    }
  }
`;

export interface Product {
  id: string;
  title: string;
  handle: string;
  description: string;
  images: {
    edges: Array<{
      node: {
        url: string;
        altText: string;
      };
    }>;
  };
  priceRange: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
    maxVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
  variants: {
    edges: Array<{
      node: {
        id: string;
        title: string;
        price: {
          amount: string;
          currencyCode: string;
        };
        availableForSale: boolean;
      };
    }>;
  };
}

export interface ProductsResponse {
  products: {
    edges: Array<{
      node: Product;
    }>;
  };
}

export interface Collection {
  id: string;
  title: string;
  handle: string;
  description: string;
  image?: {
    url: string;
    altText: string;
  };
  products: {
    edges: Array<{
      node: Product;
    }>;
  };
}

export interface CollectionsResponse {
  collections: {
    edges: Array<{
      node: Collection;
    }>;
  };
}

export interface CategoryWithProducts {
  collection: Collection;
  products: Product[];
}

export interface CartLine {
  id: string;
  quantity: number;
  merchandise: {
    id: string;
    title: string;
    priceV2: {
      amount: string;
      currencyCode: string;
    };
    product: {
      id: string;
      title: string;
      handle: string;
      images: {
        edges: Array<{
          node: {
            url: string;
            altText: string;
          };
        }>;
      };
    };
  };
}

export interface CartCost {
  totalAmount: {
    amount: string;
    currencyCode: string;
  };
  subtotalAmount: {
    amount: string;
    currencyCode: string;
  };
  totalTaxAmount?: {
    amount: string;
    currencyCode: string;
  };
  totalDutyAmount?: {
    amount: string;
    currencyCode: string;
  };
}

export interface Cart {
  id: string;
  createdAt: string;
  updatedAt: string;
  checkoutUrl: string;
  lines: {
    edges: Array<{
      node: CartLine;
    }>;
  };
  cost: CartCost;
}

export interface CartCreateResponse {
  cartCreate: {
    cart: Cart;
    userErrors: Array<{
      field: string[];
      message: string;
    }>;
  };
}

export interface CartLinesAddResponse {
  cartLinesAdd: {
    cart: Cart;
    userErrors: Array<{
      field: string[];
      message: string;
    }>;
  };
}

export interface CartLinesUpdateResponse {
  cartLinesUpdate: {
    cart: Cart;
    userErrors: Array<{
      field: string[];
      message: string;
    }>;
  };
}

export interface CartQueryResponse {
  cart: Cart;
}

export async function fetchProducts(first: number = 20): Promise<Product[]> {
  try {
    const {data, errors} = await shopifyClient.request<ProductsResponse>(
      PRODUCTS_QUERY,
      {
        variables: {
          first,
        },
      },
    );

    if (errors) {
      console.error('Shopify API errors:', errors);
      throw new Error('Failed to fetch products');
    }

    return data?.products?.edges?.map(edge => edge.node) || [];
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
}

export async function fetchCollectionsWithProducts(
  first: number = 10,
): Promise<CategoryWithProducts[]> {
  try {
    const {data, errors} = await shopifyClient.request<CollectionsResponse>(
      COLLECTIONS_QUERY,
      {
        variables: {
          first,
        },
      },
    );

    if (errors) {
      console.error('Shopify API errors:', errors);
      throw new Error('Failed to fetch collections');
    }

    const collections = data?.collections?.edges?.map(edge => edge.node) || [];

    return collections
      .map(collection => ({
        collection,
        products: collection.products.edges.map(edge => edge.node),
      }))
      .filter(category => category.products.length > 0);
  } catch (error) {
    console.error('Error fetching collections:', error);
    throw error;
  }
}

export async function createCart(
  merchandiseId: string,
  quantity: number = 1,
): Promise<Cart> {
  try {
    const {data, errors} = await shopifyClient.request<CartCreateResponse>(
      CART_CREATE_MUTATION,
      {
        variables: {
          input: {
            lines: [
              {
                quantity,
                merchandiseId,
              },
            ],
          },
        },
      },
    );

    if (errors) {
      console.error('Shopify API errors:', errors);
      throw new Error('Failed to create cart');
    }

    if (data?.cartCreate?.userErrors?.length > 0) {
      throw new Error(
        data.cartCreate.userErrors.map(error => error.message).join(', '),
      );
    }

    return data.cartCreate.cart;
  } catch (error) {
    console.error('Error creating cart:', error);
    throw error;
  }
}

export async function addToCart(
  cartId: string,
  merchandiseId: string,
  quantity: number = 1,
): Promise<Cart> {
  try {
    const {data, errors} = await shopifyClient.request<CartLinesAddResponse>(
      CART_LINES_ADD_MUTATION,
      {
        variables: {
          cartId,
          lines: [
            {
              quantity,
              merchandiseId,
            },
          ],
        },
      },
    );

    if (errors) {
      console.error('Shopify API errors:', errors);
      throw new Error('Failed to add items to cart');
    }

    if (data?.cartLinesAdd?.userErrors?.length > 0) {
      throw new Error(
        data.cartLinesAdd.userErrors.map(error => error.message).join(', '),
      );
    }

    return data.cartLinesAdd.cart;
  } catch (error) {
    console.error('Error adding to cart:', error);
    throw error;
  }
}

export async function updateCartLine(
  cartId: string,
  lineId: string,
  quantity: number,
): Promise<Cart> {
  try {
    const {data, errors} = await shopifyClient.request<CartLinesUpdateResponse>(
      CART_LINES_UPDATE_MUTATION,
      {
        variables: {
          cartId,
          lines: [
            {
              id: lineId,
              quantity,
            },
          ],
        },
      },
    );

    if (errors) {
      console.error('Shopify API errors:', errors);
      throw new Error('Failed to update cart');
    }

    if (data?.cartLinesUpdate?.userErrors?.length > 0) {
      throw new Error(
        data.cartLinesUpdate.userErrors.map(error => error.message).join(', '),
      );
    }

    return data.cartLinesUpdate.cart;
  } catch (error) {
    console.error('Error updating cart:', error);
    throw error;
  }
}

export async function getCart(cartId: string): Promise<Cart> {
  try {
    const {data, errors} = await shopifyClient.request<CartQueryResponse>(
      CART_QUERY,
      {
        variables: {
          cartId,
        },
      },
    );

    if (errors) {
      console.error('Shopify API errors:', errors);
      throw new Error('Failed to fetch cart');
    }

    return data.cart;
  } catch (error) {
    console.error('Error fetching cart:', error);
    throw error;
  }
}

export async function getCheckoutUrl(cartId: string): Promise<string> {
  try {
    const cart = await getCart(cartId);
    return cart.checkoutUrl;
  } catch (error) {
    console.error('Error getting checkout URL:', error);
    throw error;
  }
}
