import { RequestFactory, routes, routesWithMetadata } from '@/api';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Fetcher, HTTPMethod } from '@/http';
import { createFetchResponse, fetchMock } from '../util.ts';

const routeHierarchy = {
  V1: {
    path: 'v1',
    children: {
      PRODUCTS: {
        path: 'products',
        children: {
          $ID: {
            path: ':productId',
            children: {
              REVIEW: {
                path: 'review',
              },
            },
          },
        },
      },
    },
  },
} as const;
const APIRoutes = routes(routeHierarchy);

describe('routes', () => {
  it('transforms route hierarchy to flattened constant map', () => {
    expect(APIRoutes['V1_PRODUCTS_$ID_REVIEW']).toBeDefined();
  });

  it('contains string-compatible routes that are basically joined paths of original map', () => {
    expect(APIRoutes['V1_PRODUCTS_$ID_REVIEW'].toString()).toEqual(
      'v1/products/:productId/review/'
    );
  });

  it('contains key property that allows to get constant name programmatically from value (yep, it is needed sometimes)', () => {
    const key = 'V1_PRODUCTS';
    expect(APIRoutes[key].key).toEqual(key);
  });

  it('also contains parent key that (surprisingly) could also be used sometimes', () => {
    expect(APIRoutes['V1_PRODUCTS'].parentKey).toEqual('V1');
  });

  it('allows to interpolate params in path (strings and numbers supported out of the box)', () => {
    expect(APIRoutes.V1_PRODUCTS_$ID_REVIEW.generatePath({ productId: 10 })).toEqual(
      'v1/products/10/review'
    );
    expect(APIRoutes.V1_PRODUCTS_$ID.generatePath({ productId: '10' })).toEqual('v1/products/10');
  });
});

describe('routesWithMetadata', () => {
  it('does the same as routes, but also allows to add metadata to routes with typings', () => {
    const routes = routesWithMetadata()(routeHierarchy);
    expect(routes.V1_PRODUCTS_$ID_REVIEW.path).toEqual(APIRoutes.V1_PRODUCTS_$ID_REVIEW.path);
  });

  it('supports typing for additional metadata', () => {
    const routes = routesWithMetadata<{ meta?: string }>()({
      V1: {
        path: 'v1',
        children: {
          PRODUCTS: {
            path: 'products',
            meta: 'some meta',
          },
        },
      },
    });
    expect(routes.V1_PRODUCTS.meta).toEqual('some meta');
  });
});

describe('RequestFactory', () => {
  beforeEach(() => {
    global.fetch = fetchMock;
  });
  afterEach(() => {
    vi.resetAllMocks();
  });

  const baseUrl = 'https://api.example.com';

  const fetcher = new Fetcher({
    baseUrl,
  });

  type Product = {
    id: number;
    title: string;
  };

  it('allows to create typed request callable using fetcher as its backend', () => {
    const httpFactory = new RequestFactory(fetcher);
    const productGet = httpFactory
      .get<Product>(APIRoutes.V1_PRODUCTS_$ID)
      .pathParams<{ productId: number }>()
      .hooks({
        onResponse: (response) => {
          return {
            ...response,
            processedSomehow: true,
          };
        },
      })
      .build();

    expect(productGet).toBeDefined();
  });
  it('produces async callables that do actual requests', async () => {
    const httpFactory = new RequestFactory(fetcher);
    fetchMock.mockResolvedValue(createFetchResponse({ id: 1, title: 'Product 1' }));

    const productGet = httpFactory
      .get(APIRoutes.V1_PRODUCTS_$ID)
      .pathParams<{ productId: number }>()
      .hooks({
        onResponse: async (response) => {
          return await response.json();
        },
      })
      .build();

    const result = await productGet({
      pathParams: {
        productId: 1,
      },
    });

    expect(fetchMock).toHaveBeenCalledWith('https://api.example.com/v1/products/1/', {
      body: undefined,
      headers: {},
      method: 'GET',
    });
    expect(result.title).toEqual('Product 1');
  });
  it.each([
    { method: 'GET' },
    { method: 'POST' },
    { method: 'PUT' },
    { method: 'DELETE' },
    { method: 'PATCH' },
    { method: 'OPTIONS' },
    { method: 'HEAD' },
  ])('provides shortcut for $method', ({ method }) => {
    const httpFactory = new RequestFactory(fetcher);
    const url = '/api/v1/test';

    // @ts-expect-error I know it's illegal, just need to parametrize
    expect(httpFactory[method.toLowerCase()](url)).toEqual(
      httpFactory.new(url, { method: method as HTTPMethod })
    );
  });
});
