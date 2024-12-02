import { TransformedRoute } from './routes';
import { Fetcher, FetchPayloadType, generatePath, HTTPMethod } from '@/http';

export type RequestOptions = {
  method: HTTPMethod;
};

export type RequestHooks<TResponse, TTransformed> = {
  /**
   * Hook that processes response before it passed to the caller, allows to perform type-safe response processing
   * Can be both sync and async
   * @param response - response that received from fetcher after all its own hooks
   */
  onResponse?: (response: TResponse) => TTransformed | Promise<TTransformed>;

  /**
   * Hook that processes payload before it passed to fetcher,
   * allows to customize payload generation on request level
   * Can be both sync and async
   * @param payload - fetcher's fetch() method payload that being passed to fetcher
   */
  beforeRequest?: (payload: FetchPayloadType) => FetchPayloadType | Promise<FetchPayloadType>;
};

/**
 * Factory for creating typed HTTP request callables
 * Uses {@link Fetcher} as its underlying transport backend,
 * so you can create different factories with different fetchers to cover concrete needs,
 * see provided example for overview
 *
 * @example
 * ```ts
 * // Create your Fetcher instance, customize it as you wish to provide common configurations...
 * const jsonFetcher = new Fetcher({
 *   baseUrl: "https://api.example.com",
 *   processResponse: async response => await response.json(),
 *   processPayload: async payload => {
 *     payload.body = JSON.stringify(payload.body)
 *     payload.headers = { ...payload.headers, Accept: "appication/json, text/plain" }
 *     return payload
 *   },
 * })
 *
 * // ...and cover edge cases
 * const formDataFetcher = jsonFetcher.override(config => {
 *     return {
 *       ...config,
 *       processPayload: async payload => {
 *         payload.body = serializeObjectToFormDataSomehow(payload.body)
 *       }
 *     }
 * })
 *
 * // Construct new request factory
 * const jsonRequestFactory = new RequestFactory(jsonFetcher)
 * const formDataFactory = new RequestFactory(formDataFetcher)
 *
 *
 * // Some example types found anywhere in your project
 * type User = {
 *   id: number,
 *   name: string,
 *   age: number
 * }
 *
 * type CommonQueryParams = {
 *   search?: string,
 *   limit?: number,
 *   offset?: number
 * }
 *
 * type IdPathParam = {
 *   id: number
 * }
 *
 * // You pick what you need, example shows bloated logic with all possible customizations
 * const getUserById = jsonRequestFactory.new<User>("/v1/user", { method: "GET" })
 *     .pathParams<{ id: number }>()
 *     .queryParams<{ search: string }>({ search: "test" })
 *     .body<User>()
 *     .hooks({
 *
 *       // Typed response processor
 *       // takes expected User type here and produces a new type that will be returned by produced callable
 *       onResponse: user => {
 *         return {
 *           ...user,
 *           processed: true
 *         }
 *       },
 *       beforeRequest: payload => {
 *         // do something with payload before it passed to fetcher
 *         return payload
 *       }
 *     })
 *     .build() // Always call build() when you finish to create final callable
 *
 *
 * // Call anywhere you want
 * // TS will know about all types provided on creation step
 * // so you won't miss that one
 * const user = await getUserById({
 *   pathParams: {
 *     id: 10
 *   },
 *   // ts: Property `age` is missing in type `{ id: number; name: string; }` but required in type `User`
 *   body: {
 *     id: 10, name: "John"
 *   }
 * })
 *
 * // ts: boolean, log: true
 * console.log(user.processed)
 * ```
 */
export class RequestFactory {
  /**
   * Fetcher is a transport backend that performs actual request sending.
   * All advanced configurations and processing logic can be performed here
   * @private
   */
  private readonly _fetcher: Fetcher;

  constructor(fetcher: Fetcher) {
    this._fetcher = fetcher;
  }

  /**
   * Starts building generic request callable, see {@link Request} and examples of that class for available customizations
   * @param url - route to call, can be either string or {@link TransformedRoute} instance
   * @param options - global request options (currently only http method 🌚, interface reserved for later extension)
   */
  new<TResponse = Response>(
    url: TransformedRoute | string,
    options: RequestOptions = { method: 'GET' }
  ) {
    return new Request<TResponse>(this._fetcher, url, options);
  }

  /**
   * Shortcut for new() with GET method
   */
  get<TResponse = Response>(
    url: TransformedRoute | string,
    options?: Omit<RequestOptions, 'method'>
  ) {
    return this.new<TResponse>(url, { ...options, method: 'GET' });
  }

  /**
   * Shortcut for new() with POST method
   */
  post<TResponse = Response>(
    url: TransformedRoute | string,
    options?: Omit<RequestOptions, 'method'>
  ) {
    return this.new<TResponse>(url, { ...options, method: 'POST' });
  }

  /**
   * Shortcut for new() with PUT method
   */
  put<TResponse = Response>(
    url: TransformedRoute | string,
    options?: Omit<RequestOptions, 'method'>
  ) {
    return this.new<TResponse>(url, { ...options, method: 'PUT' });
  }

  /**
   * Shortcut for new() with PATCH method
   */
  patch<TResponse = Response>(
    url: TransformedRoute | string,
    options?: Omit<RequestOptions, 'method'>
  ) {
    return this.new<TResponse>(url, { ...options, method: 'PATCH' });
  }

  /**
   * Shortcut for new() with DELETE method
   */
  delete<TResponse = Response>(
    url: TransformedRoute | string,
    options?: Omit<RequestOptions, 'method'>
  ) {
    return this.new<TResponse>(url, { ...options, method: 'DELETE' });
  }

  /**
   * Shortcut for new() with HEAD method
   */
  head<TResponse = Response>(
    url: TransformedRoute | string,
    options?: Omit<RequestOptions, 'method'>
  ) {
    return this.new<TResponse>(url, { ...options, method: 'HEAD' });
  }

  /**
   * Shortcut for new() with OPTIONS method
   */
  options<TResponse = Response>(
    url: TransformedRoute | string,
    options?: Omit<RequestOptions, 'method'>
  ) {
    return this.new<TResponse>(url, { ...options, method: 'OPTIONS' });
  }
}

/**
 * Actual request builder that is created on factory.new() / factory.<method>() call
 *
 * @template TResponse - expected response type
 * @template TBody - expected body type
 * @template TPathParams - expected path params type
 * @template TQueryParams - expected query params type
 * @template TOmitted - omitted methods for fluent interface
 *
 */
export class Request<
  TResponse = Response,
  TBody = undefined,
  TPathParams = undefined,
  TQueryParams = undefined,
  TOmitted extends string | number | symbol = '',
> {
  private readonly _fetcher: Fetcher;
  private readonly _options: RequestOptions;
  private readonly _url: TransformedRoute | string;

  private _withPathParams: boolean = false;
  private _defaultQueryParams?: Record<string, unknown>;
  private _hooks?: RequestHooks<TResponse, unknown>;

  constructor(fetcher: Fetcher, url: TransformedRoute | string, options: RequestOptions) {
    this._fetcher = fetcher;
    this._options = options;
    this._url = url;
  }

  /**
   * Adds path params type to final callable
   * @example
   * ```ts
   * const getUserById = jsonRequestFactory.new<User>("", { method: "GET" })
   * ```
   */
  pathParams<TNewPathParams extends Record<string, string | number>>() {
    this._withPathParams = true;
    return this as unknown as Omit<
      Request<TResponse, TBody, TNewPathParams, TQueryParams, TOmitted | 'pathParams'>,
      TOmitted | 'pathParams'
    >;
  }

  queryParams<TNewQueryParams extends Record<string, unknown>>(
    defaultQueryParams?: Partial<TNewQueryParams>
  ) {
    this._defaultQueryParams = defaultQueryParams;
    return this as unknown as Omit<
      Request<TResponse, TBody, TPathParams, Partial<TNewQueryParams>, TOmitted | 'queryParams'>,
      TOmitted | 'queryParams'
    >;
  }

  body<TNewBody>() {
    return this as unknown as Omit<
      Request<TResponse, TNewBody, TPathParams, TQueryParams, TOmitted | 'body'>,
      TOmitted | 'body'
    >;
  }

  hooks<TTransformed>(hooks: RequestHooks<TResponse, TTransformed>) {
    this._hooks = hooks;
    return this as unknown as Omit<
      Request<TTransformed, TBody, TPathParams, TQueryParams, TOmitted | 'hooks'>,
      TOmitted | 'hooks'
    >;
  }

  build(): RequestHandler<RequestPayload<TBody, TPathParams, TQueryParams>, TResponse> {
    return async (
      payload: RequestPayload<TBody, TPathParams, TQueryParams>
    ): Promise<TResponse> => {
      const { body, queryParams, pathParams } = payload as RequestPayload<object, object, object>;

      const mergedQueryParams = { ...this._defaultQueryParams, ...queryParams };

      let url: string = this._url.toString();
      if (this._withPathParams) {
        url = generatePath(url, pathParams);
      }

      let fetcherPayload: FetchPayloadType = {
        method: this._options.method,
        queryParams: mergedQueryParams,
        body: body,
      };
      if (this._hooks?.beforeRequest !== undefined) {
        fetcherPayload = await this._hooks.beforeRequest(fetcherPayload);
      }

      const result = await this._fetcher.fetch<TResponse>(url, fetcherPayload);

      if (this._hooks?.onResponse !== undefined) {
        return (await this._hooks.onResponse(result)) as TResponse;
      }
      return result as TResponse;
    };
  }
}

/**
 * PRIVATE API
 */

type RequestPayload<TBody = undefined, TPathParams = undefined, TQueryParams = undefined> = Omit<
  {
    body: TBody;
    pathParams: TPathParams;
    queryParams?: TQueryParams;
  },
  '' | (TBody extends undefined ? 'body' : '') | (TPathParams extends undefined ? 'pathParams' : '')
>;

type RequestHandler<TPayload, TResponse> = (payload: TPayload) => TResponse | Promise<TResponse>;
