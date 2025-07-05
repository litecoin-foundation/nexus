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
