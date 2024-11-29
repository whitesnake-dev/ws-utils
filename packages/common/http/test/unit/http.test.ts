import { expect, describe, it, beforeEach, afterEach, vi } from 'vitest';
import { createFetchResponse, fetchMock } from '../util';
import {
  extractQueryParams,
  insertQueryParams,
  encodeQueryParams,
  Serializer,
  urlJoin,
  extractSection,
  Fetcher,
  generatePath,
} from '@/http';

describe('urlJoin', () => {
  it.each([
    { payload: ['https://example.com', 'test'], expected: 'https://example.com/test' },
    { payload: ['api', 'v1'], expected: 'api/v1' },
    { payload: ['example.com', 'api'], expected: 'example.com/api' },
    { payload: ['', 'example.com', 'api', ''], expected: 'example.com/api' },
  ])('joins path segments ($payload) = $expected', ({ payload, expected }) => {
    expect(urlJoin(payload)).toMatch(expected);
  });
  it('handles trailing slash', () => {
    expect(urlJoin(['https://example.com', 'api', 'v1/'], { trailingSlash: false })).toMatch(
      'https://example.com/api/v1'
    );
  });
});

describe('generatePath', () => {
  it('throws if expected by url parameter is not provided', () => {
    // @ts-expect-error testing behaviour
    expect(() => generatePath('/api/v1/:id', {})).toThrow();
  });
});

describe('extractSection', () => {
  it.each([
    { payload: { url: 'https://example.com/api/v1', pos: -1 }, expected: 'v1' },
    { payload: { url: 'https://example.com/api/v1', pos: 0 }, expected: 'example.com' },
    { payload: { url: 'https://example.com/api/v1/', pos: 1 }, expected: 'api' },
    { payload: { url: 'https://example.com/api/v1/', pos: -2 }, expected: 'api' },
  ])('extracts section from url $payload.url by position $payload.pos', ({ payload, expected }) => {
    expect(extractSection(payload.url, payload.pos)).toMatch(expected);
  });
});

describe('extractQueryParams', () => {
  it('extracts query param strings from absolute url', () => {
    expect(extractQueryParams('https://google.com?search=test&value=2')).toEqual({
      search: 'test',
      value: '2',
    });
  });

  it('extracts query params from relative url', () => {
    expect(extractQueryParams('/api/v1/?search=test&value=2')).toEqual({
      search: 'test',
      value: '2',
    });
  });
});

describe('encodeQueryParams', () => {
  it('encodes query params to query string', () => {
    const payload = {
      search: 'name',
      value: 'ten',
    };
    expect(encodeQueryParams(payload)).toMatch('search=name&value=ten');
  });

  it.each([
    {
      payload: { param: 1, floatParam: 5.2 },
      expected: 'param=1&floatParam=5.2',
      label: 'numeric',
    },
    { payload: { param: 'test', search: '52' }, expected: 'param=test&search=52', label: 'string' },
    {
      payload: { param: true, sortValues: false },
      expected: 'param=true&sortValues=false',
      label: 'boolean',
    },
    {
      payload: { param: new Date(2052, 0, 1), createdAt: new Date(Date.UTC(2024, 0, 1, 10)) },
      expected: 'param=2052-01-01&createdAt=2024-01-01T10%3A00%3A00.000Z',
      label: 'date',
    },
    { payload: { param: null }, expected: 'param=null', label: 'null' },
  ])('serializes $label values out-of-the-box', ({ payload, expected }) => {
    expect(encodeQueryParams(payload)).toMatch(expected);
  });

  it('skips undefined values', () => {
    const payload = {
      undefProp: undefined,
    };
    expect(encodeQueryParams(payload)).toMatch('');
  });

  it('extendable by extra serializers for user-defined types/behaviour which takes precedence over defaults', () => {
    // Serializes numbers to hex base
    const hexNumberSerializer: Serializer<number> = {
      test: (value): value is number => typeof value === 'number',
      serialize: (value) => value.toString(16),
    };
    const payload = {
      param: 10,
      other: 1,
    };
    expect(encodeQueryParams(payload, { serializers: [hexNumberSerializer] })).toMatch(
      'param=a&other=1'
    );
  });

  it('handles arrays with customizable behaviour', () => {
    const payload = {
      params: [1, 'test', null],
    };

    expect(encodeQueryParams(payload)).toMatch('params=1&params=test&params=null');
    expect(encodeQueryParams(payload, { arrayFormat: 'comma' })).toMatch('params=1%2Ctest%2Cnull');
    expect(encodeQueryParams(payload, { arrayFormat: 'bracket' })).toMatch(
      'params%5B%5D=1&params%5B%5D=test&params%5B%5D=null'
    );

    // @ts-expect-error I literally just testing it
    expect(() => encodeQueryParams(payload, { arrayFormat: 'someFancyFormat' })).toThrow();
  });

  it('throws error if serializer is not found and is not added by user', () => {
    const payload = {
      exoticParam: new URL('https://example.com'),
    };
    expect(() => encodeQueryParams(payload)).toThrow();
  });
});

describe('insertQueryParams', () => {
  const url = 'https://example.com';
  const payload = {
    param: 1,
    search: 'test',
    isActive: true,
    user: null,
    createdAt: new Date(2024, 0, 1),
  };

  it('inserts query param payload to url', () => {
    expect(insertQueryParams(url, payload)).toMatch(
      'https://example.com?param=1&search=test&isActive=true&user=null&createdAt=2024-01-01'
    );
  });

  it('does nothing if payload is empty or contains undefined values', () => {
    expect(insertQueryParams(url, undefined)).toMatch(url);
    expect(insertQueryParams(url, { param: undefined })).toMatch(url);
  });

  it('works with trailing slash', () => {
    expect(insertQueryParams(url + '/', payload)).toMatch(
      'https://example.com/?param=1&search=test&isActive=true&user=null&createdAt=2024-01-01'
    );
  });

  it('joins existing params, with precedence of new params', () => {
    expect(
      insertQueryParams('https://example.com/api/v1/user?search=Bob', { isActive: true })
    ).toMatch('https://example.com/api/v1/user?search=Bob&isActive=true');
    expect(
      insertQueryParams('https://example.com/api/v1/user?search=Bob', {
        isActive: true,
        search: 'Alice',
      })
    ).toMatch('https://example.com/api/v1/user?search=Alice&isActive=true');
  });
});

describe('Fetcher', () => {
  beforeEach(() => {
    global.fetch = fetchMock;
  });
  afterEach(() => {
    vi.resetAllMocks();
  });

  type Product = {
    id: number;
    name: string;
    description: string | null;
  };

  const productUrl = '/api/v1/product';
  const productGet: Product = {
    id: 10,
    name: 'Cookbook',
    description: 'Handy thing',
  };

  it('can be created without any specific config', () => {
    expect(() => new Fetcher()).not.throw();
  });

  it('can make requests', async () => {
    fetchMock.mockResolvedValueOnce(createFetchResponse(productGet));
    const fetcher = new Fetcher();

    const response = await fetcher.get(productUrl);
    const data = await response.json();
    expect(data).toEqual(productGet);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toBeCalledWith(productUrl + '/', {
      body: undefined,
      headers: {},
      method: 'GET',
    });
  });

  it('can handle errors and retry the request', async () => {
    fetchMock.mockResolvedValueOnce(createFetchResponse({}, 401));
    // Mock the second fetch call to return a successful response
    fetchMock.mockResolvedValueOnce(createFetchResponse(productGet));

    const fetcher = new Fetcher({
      errorHandler: async ({ err, retry }) => {
        if (err.statusCode === 401) {
          // Some logic for auth (e.g., refreshing tokens)
          // Return the result of retrying the request
          return retry();
        }
      },
    });

    const response = await fetcher.get(productUrl);
    const data = await response.json();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(data).toEqual(productGet);
  });

  it('can accept payload modifier', async () => {
    fetchMock.mockResolvedValueOnce(createFetchResponse(productGet));
    const fetcher = new Fetcher({
      trailingSlash: false,
      headers: {
        Accept: 'application/xml',
      },
      debug: true,
      processPayload: async (payload) => {
        payload.body = JSON.stringify(payload.body);
        payload.headers = { ...payload.headers, Accept: 'application/json' };
        return payload;
      },
    });

    await fetcher.post(productUrl, { body: productGet });
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(productUrl, {
      body: JSON.stringify(productGet),
      headers: { Accept: 'application/json' },
      method: 'POST',
    });
  });

  it('can log request pipeline steps if set to debug mode', async () => {
    fetchMock.mockResolvedValueOnce(createFetchResponse(productGet));
    global.console = { log: vi.fn() } as unknown as Console;
    const fetcher = new Fetcher({
      debug: true,
    });

    await fetcher.get(productUrl);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(console.log).toHaveBeenCalled();
  });

  it('can be inherited by calling override()', async () => {
    fetchMock.mockResolvedValueOnce(createFetchResponse(productGet));
    const baseConfig = {
      debug: true,
      headers: {
        Authorization: 'Bearer 123456789',
      },
      trailingSlash: false,
    };

    const overridenHeaders = {
      Authorization: 'Bearer 987654321',
    };

    const childConfig = {
      ...baseConfig,
      headers: {
        ...baseConfig.headers,
        ...overridenHeaders,
      },
    };

    const fetcher = new Fetcher(baseConfig);
    const childFetcher = fetcher.override((config) => {
      return {
        ...config,
        headers: {
          ...config.headers,
          ...overridenHeaders,
        },
      };
    });
    expect(childFetcher.config).toEqual(childConfig);
  });

  it('can process response via hook', async () => {
    fetchMock.mockResolvedValueOnce(createFetchResponse(productGet));
    const fetcher = new Fetcher({
      processResponse: async (response) => {
        return await response.json();
      },
    });
    const product = await fetcher.patch<Product>(productUrl, { body: productGet });
    expect(product).toEqual(productGet);
  });

  it.each([
    { method: 'GET' },
    { method: 'POST' },
    { method: 'PATCH' },
    { method: 'PUT' },
    { method: 'HEAD' },
    { method: 'DELETE' },
  ])('has shortcut for $method', async ({ method }) => {
    fetchMock.mockResolvedValueOnce(createFetchResponse(productGet));
    const fetcher = new Fetcher();

    // @ts-expect-error need to get method dynamically
    await fetcher[method.toLowerCase()](productUrl);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(productUrl + '/', {
      body: undefined,
      headers: {},
      method,
    });
  });

  it('propagates error if no hadler is set', async () => {
    fetchMock.mockResolvedValueOnce(createFetchResponse({}, 500));
    const fetcher = new Fetcher();
    await expect(fetcher.get(productUrl)).rejects.toThrow();
  });

  it("throws error if error handler ignored it and didn't throw own", async () => {
    fetchMock.mockResolvedValueOnce(createFetchResponse({}, 500));
    const fetcher = new Fetcher({
      errorHandler: async ({ err }) => {
        if (err.statusCode === 500) {
          return;
        }
      },
      debug: true,
    });
    await expect(fetcher.get(productUrl)).rejects.toThrow();
  });
});
