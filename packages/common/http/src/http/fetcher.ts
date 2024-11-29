import { urlJoin } from './url';
import { insertQueryParams, QueryParamsEncodingOptions, QueryParamsPayload } from './query';
import { HTTPError } from '@/http/errors';

export type HTTPMethod =
  | 'POST'
  | 'GET'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'CONNECT'
  | 'HEAD'
  | 'OPTIONS'
  | 'TRACE';

export type OverridableFetchParams = Omit<RequestInit, 'method' | 'body' | 'headers'>;

export type FetchPayloadType = {
  method?: HTTPMethod;
  body?: any;
  headers?: Record<string, string>;
  queryParams?: QueryParamsPayload;
  fetchParams?: OverridableFetchParams;
};

export enum ErrorHandlerFlag {
  RETRY = 0,
}
export type FetcherOverrideFunction = (config: FetcherConfig) => FetcherConfig;

type ErrorHandlerContext = {
  /**
   * Base HTTPError being handled
   */
  err: HTTPError;
  /**
   * Current attempt of error handling, starting from 1
   */
  attempt: number;

  /**
   * Try to perform same fetch, possibly handling/sleeping/waiting.
   * You should make a circuit breaking condition to prevent endless fetching.
   */
  retry: () => ErrorHandlerFlag.RETRY;
};

type FetcherConfig = {
  /** Debug mode enables logging of different steps while fetching.
   *  Defaults to false.
   */
  debug?: boolean;

  /** Base url to prepend to all paths */
  baseUrl?: string;

  /** Whether to add trailing slash to all urls.
   *  Defaults to true.
   *  Will not trim slash if set to false.
   */
  trailingSlash?: boolean;

  /** Optional global headers to add, you can override them on request level */
  headers?: Record<string, string>;

  /** Optional global query params to add, you can override them on request level */
  queryParams?: QueryParamsPayload;

  /** Query params encoding options to override default behaviour, see query.ts for details */
  queryParamsOptions?: QueryParamsEncodingOptions;

  /** fetch params to override */
  fetchParams?: OverridableFetchParams;

  /**
   * Allows to process response object after it received.
   * Can be both coro and sync function
   */
  processResponse?: (response: Response) => Promise<unknown> | unknown;

  /**
   * Allows to process final payload before it passed to fetch()
   * Can be both coro and sync function
   * Needs to return modified payload
   */
  processPayload?: (payload: RequestInit) => Promise<RequestInit> | RequestInit;

  /** Optional error handler */
  errorHandler?: (
    ctx: ErrorHandlerContext
  ) => Promise<ErrorHandlerFlag | undefined | void> | ErrorHandlerFlag | undefined | void;
};

const DefaultFetcherConfig: FetcherConfig = {
  trailingSlash: true,
};

/**
 * Type-safe fetch abstraction that reduces some boilerplate code working with similar requests.
 * Mostly based on other handy functions in library, it's highly customizable to fulfill common use-cases.
 * See examples for more details
 *
 * @example Create new fetcher
 * ```ts
 * const fetcher = new Fetcher({
 *   // Base url is appended to all requests of that fetcher
 *   baseUrl: 'https://example.com',
 *
 *   // Global fetch params
 *   fetchParams: {
 *     credentials: 'include',
 *   },
 *
 *   // Transform Response object somehow
 *   processResponse: async (response) => {
 *     return await response.json()
 *   },
 *
 *   // Preprocess final payload passed to fetch
 *   processPayload: payload => {
 *     payload.body = JSON.stringify(payload.body)
 *     return payload
 *   },
 *
 *   // Handle all errors (non-2xx status codes)
 *   errorHandler: async ( { err, retry, attempt } ) => {
 *     switch(err.statusCode) {
 *       // You can throw own detailed type-safe errors, customized base HTTPError,
 *       // or whatever you want to do with error...
 *       case 400: throw new SuperCustomError("validation-error", JSON.parse(err.body));
 *
 *       // ... even retry original fetch after some error handling, but...
 *       case 401: {
 *         const refreshData = await refreshToken();
 *         if (refreshData.status === 401) {
 *           await logout();
 *           sessionStorage.removeItem('isAuth');
 *
 *           // ...keep in mind that it's fully your responsibility
 *           // to break endless loop retries
 *           throw new CircuitBreakingError("not-authorized-error")
 *         }
 *         return retry();
 *       }
 *
 *       case 502: {
 *         // You also can use handy attempt number to decide whether to proceed
 *         if (attempt > 3) { throw err }
 *         sleep(10 * 1000)
 *         return retry();
 *       }
 *
 *       // Will be handled by default, just throwing err
 *       default: return
 *     }
 *   }
 * });
 * ```
 *
 * @example Fire a customized request
 * ```ts
 * // DX thing
 * type TSID = string;
 * type URLString = string;
 *
 * type ProductGetResponse = {
 *   id: TSID,
 *   title: string,
 *   price: number,
 *   photoUrl: URLString | null
 * }
 *
 * // You can provide concrete type that you expect to get as final result of fetch after all pre- and postprocessors
 * // By default, TS will treat result as basic Response.
 * // Of course, you need to implement unwrapping logic by yourself using processResponse hook
 * const product = await fetcher.fetch<ProductGetResponse>("/api/v1/product", {
 *
 *   // Body serialization can be globally transformed using fetcher's preprocessPayload hook
 *   body: {
 *     id: 10,
 *     data: "100"
 *   },
 *
 *   // Query params are serialized to strings according to provided settings
 *   queryParams: {
 *     search: "TS Handbook",
 *     priceGt: 100,
 *     createdAtGt: new Date(2025, 0, 1)
 *   },
 *
 *   // Request-level headers take precedence over fetcher-level
 *   headers: {
 *     "X-Api-Key": "verysecretsecret"
 *   },
 *   method: "GET",
 *
 *   // It is possible to override fetch params at request level, taking precedence over fetcher-level config
 *   fetchParams: {
 *     mode: "no-cors"
 *   }
 * })
 * ```
 */
export class Fetcher {
  config: FetcherConfig;

  constructor(config?: FetcherConfig) {
    this.config = { ...DefaultFetcherConfig, ...config };
    if (this.config.debug) {
      console.log('Creating new fetcher', this.config);
    }
  }

  /**
   * Allows you to create a new Fetcher, overriding existing config.
   * Do not mutate original config, since it will modify parent Fetcher
   *
   * @param overrideFn - callable that returns new config from current one.
   *
   * @example
   * ```ts
   * const baseFetcher = new Fetcher({ baseUrl: "https://example.com", ... })
   *
   * ...
   *
   * const shopAPIFetcher = baseFetcher.override((config) => {
   *  return {
   *    ...config,
   *    baseUrl: "https://api.shop.example.com"
   *  }
   * })
   * ```
   */
  override(overrideFn: FetcherOverrideFunction): Fetcher {
    return new Fetcher(overrideFn(this.config));
  }

  async fetch<TResponse = Response>(
    url: string,
    payload: FetchPayloadType = { method: 'GET' }
  ): Promise<TResponse> {
    const queryParams = { ...this.config.queryParams, ...payload.queryParams };
    const headers = { ...this.config.headers, ...payload.headers };

    const processedUrl = insertQueryParams(
      urlJoin([this.config.baseUrl ?? '', url], { trailingSlash: this.config.trailingSlash }),
      queryParams,
      this.config.queryParamsOptions
    );

    let processedPayload: RequestInit = {
      ...this.config.fetchParams,
      ...payload.fetchParams,
      headers,
      body: payload.body,
      method: payload.method,
    };

    if (this.config.processPayload) {
      processedPayload = await this.config.processPayload(processedPayload);
    }
    if (this.config.debug) {
      console.log(`${processedPayload.method} ${processedUrl}: final payload`, processedPayload);
    }

    let retry = true;
    let attempt = 0;

    const retryCb = () => {
      retry = true;
      return 0;
    };

    // Assigning some error here to make TS happy, this error really shouldn't show up
    let error: HTTPError = new HTTPError('Unknown HTTP error', { statusCode: 500 });

    while (retry) {
      attempt++;
      retry = false;
      const response = await fetch(processedUrl, processedPayload);

      if (response.ok) {
        if (this.config.processResponse) {
          return (await this.config.processResponse(response)) as TResponse;
        }
        return response as TResponse;
      }

      error = new HTTPError('HTTP error', {
        statusCode: response.status,
        body: await response.text(),
      });
      if (this.config.debug) {
        console.log(`${processedPayload.method} ${processedUrl}: error is produced`, error);
      }
      if (this.config.errorHandler) {
        const handlerResult = await this.config.errorHandler({
          err: error,
          retry: retryCb,
          attempt,
        });
        if (handlerResult === ErrorHandlerFlag.RETRY) {
          retry = true;
        }
      }
    }
    throw error;
  }

  async get<TResponse = Response>(
    url: string,
    payload?: Omit<FetchPayloadType, 'method'>
  ): Promise<TResponse> {
    return await this.fetch(url, { ...payload, ...{ method: 'GET' } });
  }

  async post<TResponse = Response>(
    url: string,
    payload?: Omit<FetchPayloadType, 'method'>
  ): Promise<TResponse> {
    return await this.fetch(url, { ...payload, ...{ method: 'POST' } });
  }

  async put<TResponse = Response>(
    url: string,
    payload?: Omit<FetchPayloadType, 'method'>
  ): Promise<TResponse> {
    return await this.fetch(url, { ...payload, ...{ method: 'PUT' } });
  }

  async patch<TResponse = Response>(
    url: string,
    payload?: Omit<FetchPayloadType, 'method'>
  ): Promise<TResponse> {
    return await this.fetch(url, { ...payload, ...{ method: 'PATCH' } });
  }

  async delete<TResponse = Response>(
    url: string,
    payload?: Omit<FetchPayloadType, 'method'>
  ): Promise<TResponse> {
    return await this.fetch(url, { ...payload, ...{ method: 'DELETE' } });
  }

  async head<TResponse = Response>(
    url: string,
    payload?: Omit<FetchPayloadType, 'method'>
  ): Promise<TResponse> {
    return await this.fetch(url, { ...payload, ...{ method: 'HEAD' } });
  }
}
