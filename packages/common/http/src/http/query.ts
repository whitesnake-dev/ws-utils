export type QueryParamValue = unknown;
export type QueryParamsPayload = Record<string, QueryParamValue>;

/**
 * Serializer interface for custom serialization
 */
export interface Serializer<T> {
  test: (value: unknown) => value is T;
  serialize: (value: T) => string;
}

export interface QueryParamsEncodingOptions {
  /**
   * Pass your custom serializers. Handy both for extending and overriding default serializers.
   * See defaultSerializers below for defaults
   */
  serializers?: Serializer<any>[];
  /**
   * Array formatting type. Given payload = { arr: [1, 2, 3] }
   * repeat: arr=1&arr=2&arr=3
   * comma: arr=1,2,3
   * bracket: arr[]=1&arr[]=2&arr[]=3
   *
   * Defaults to 'repeat'
   */
  arrayFormat?: 'repeat' | 'comma' | 'bracket';

  /**
   * Whether to skip null values. Defaults to false
   */
  skipNull?: boolean;
}

const defaultSerializers: Serializer<any>[] = [
  {
    test: (value): value is string => typeof value === 'string',
    serialize: (value) => value,
  },
  {
    test: (value): value is number => typeof value === 'number',
    serialize: (value) => value.toString(),
  },
  {
    test: (value): value is boolean => typeof value === 'boolean',
    serialize: (value) => value.toString(),
  },
  {
    test: (value): value is null => value == null,
    serialize: () => 'null',
  },
  // Generic date and datetime formatter
  {
    test: (value): value is Date => value instanceof Date,
    serialize: (value) => {
      if (
        value.getHours() === 0 &&
        value.getMinutes() === 0 &&
        value.getSeconds() === 0 &&
        value.getMilliseconds() === 0
      ) {
        const year = value.getFullYear();
        const month = String(value.getMonth() + 1).padStart(2, '0');
        const day = String(value.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      } else {
        return value.toISOString();
      }
    },
  },
];

/**
 * Encodes query parameters into a query string
 * @param params - The parameters to encode
 * @param options - Optional parameters including custom serializers
 * @returns Encoded query string
 */
export function encodeQueryParams(
  params: QueryParamsPayload,
  options?: QueryParamsEncodingOptions
): string {
  const serializers = options?.serializers
    ? [...options.serializers, ...defaultSerializers]
    : defaultSerializers;

  const searchParams = new URLSearchParams();
  const entries = flattenParams(params, serializers, options);

  for (const [key, value] of entries) {
    searchParams.append(key, value);
  }

  return searchParams.toString();
}

/**
 * Inserts and encodes query params object into baseUrl.
 * @param baseUrl - Base URL to append query params
 * @param payload - Record<string, any> of query params
 * @param options - Optional parameters including custom serializers
 * @returns URL with encoded query parameters
 */
export function insertQueryParams(
  baseUrl: string,
  payload?: QueryParamsPayload,
  options?: QueryParamsEncodingOptions
): string {
  if (!payload) {
    return baseUrl;
  }
  let params: QueryParamsPayload = payload;
  let url: string = baseUrl;

  const existingParams = extractQueryParams(baseUrl);

  // If baseUrl already contains query params...
  if (Object.keys(existingParams).length > 0) {
    // ...override existing params with passed params...
    params = { ...existingParams, ...params };

    // ... and sanitize url
    const urlObj = new URL(baseUrl);
    url = urlObj.origin + urlObj.pathname;
  }

  const encodedParams = encodeQueryParams(params, options);
  if (!encodedParams) {
    return url;
  }
  return `${url}?${encodedParams}`;
}

/**
 * A little shortcut to use URL, extracts query params from a URL as strings
 * @param url - URL to extract query params from
 * @returns Map of query parameters by their keys
 */
export function extractQueryParams(url: string): Record<string, string> {
  const urlObj = new URL(url, 'http://dummy-base'); // Base is required for relative URLs
  return Object.fromEntries(urlObj.searchParams.entries());
}

/*             */
/* PRIVATE API */
/*             */

/**
 * Processes a query parameter value using provided serializers
 * @param value - The value to process
 * @param serializers - Array of serializers to use
 * @returns Serialized string or undefined
 */
function serializeQueryParam(
  value: QueryParamValue,
  serializers: Serializer<unknown>[]
): string | undefined {
  if (value === undefined) return undefined;

  for (const serializer of serializers) {
    if (serializer.test(value)) {
      return serializer.serialize(value);
    }
  }

  throw new Error(`No serializer found for value: ${value}`);
}

/**
 * Flattens the parameters into key-value pairs for encoding
 * @param params - The parameters to flatten
 * @param serializers - Array of serializers to use
 * @param options - Optional parameters including array formatting and value skipping
 * @returns Array of key-value pairs
 */
function flattenParams(
  params: QueryParamsPayload,
  serializers: Serializer<unknown>[],
  options?: QueryParamsEncodingOptions
): Array<[string, string]> {
  const entries: Array<[string, string]> = [];
  const skipNull = options?.skipNull ?? false;
  const arrayFormat = options?.arrayFormat ?? 'repeat';

  for (const key in params) {
    if (Object.prototype.hasOwnProperty.call(params, key)) {
      const value = params[key];
      if (value === undefined || (value === null && skipNull)) continue;

      if (Array.isArray(value)) {
        const processedValues = value
          .map((item) => serializeQueryParam(item, serializers))
          .filter((v): v is string => v !== undefined);

        if (processedValues.length === 0) continue;

        if (arrayFormat === 'repeat') {
          for (const processedValue of processedValues) {
            entries.push([key, processedValue]);
          }
        } else if (arrayFormat === 'comma') {
          entries.push([key, processedValues.join(',')]);
        } else if (arrayFormat === 'bracket') {
          for (const processedValue of processedValues) {
            entries.push([`${key}[]`, processedValue]);
          }
        } else {
          throw new Error(`Unsupported arrayFormat: ${arrayFormat}`);
        }
      } else {
        const processedValue = serializeQueryParam(value, serializers);
        if (processedValue !== undefined) {
          entries.push([key, processedValue]);
        }
      }
    }
  }

  return entries;
}
