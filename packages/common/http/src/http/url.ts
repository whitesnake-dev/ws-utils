const schemaRegExp = new RegExp(/(https|http):\/\//);
const queryRegExp = new RegExp(/\?.*/);

type UrlJoinOptions = {
  sep?: string;
  trailingSlash?: boolean;
};

const defaultUrlJoinOptions: Required<UrlJoinOptions> = {
  sep: '/',
  trailingSlash: true,
};

/**
 * Safely joins URL segments, ensuring proper separators and optional trailing slash.
 * @param parts - An array of URL segments, e.g., ['https://example.com', 'api', 'v1']
 * @param options - Optional settings for URL joining
 * @returns The joined URL string
 */
export function urlJoin(parts: string[], options?: UrlJoinOptions): string {
  const { sep, trailingSlash } = { ...defaultUrlJoinOptions, ...options };
  parts = parts.filter((v) => Boolean(v));
  const sanitizedParts = parts.map((part, index) => {
    const escapedSep = sep.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');

    if (index === 0) {
      return part.replace(new RegExp(`${escapedSep}+$`), '');
    } else if (index === parts.length - 1) {
      return part.replace(new RegExp(`^${escapedSep}+`), '');
    } else {
      return part.replace(new RegExp(`^${escapedSep}+|${escapedSep}+$`, 'g'), '');
    }
  });

  let result = sanitizedParts.join(sep);

  if (trailingSlash) {
    if (!result.endsWith(sep)) {
      result += sep;
    }
  } else {
    if (result.endsWith(sep)) {
      result = result.slice(0, -sep.length);
    }
  }
  return result;
}

/**
 * Extracts a section from url, last section by default
 * @example
 * ```ts
 * const url = 'https://example.com/test/value?query=test'
 * const pos = -1 // extract last section, it is also default position
 *
 * console.log(extractSection(url, pos)) // 'value'
 *
 * ```
 * @param url - url to extract section from
 * @param pos - position of extraction
 * @returns segment by position, undefined if not found.
 */
export function extractSection(url: string, pos: number = -1) {
  if (url.endsWith('/')) {
    url = url.substring(0, url.length - 1);
  }
  return url.replace(schemaRegExp, '').replace(queryRegExp, '').split('/').at(pos);
}

// prettier-ignore
type Regex_az = "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h" | "i" | "j" | "k" | "l" | "m" | "n" | "o" | "p" | "q" | "r" | "s" | "t" | "u" | "v" | "w" | "x" | "y" | "z"
// prettier-ignore
type Regez_AZ = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L" | "M" | "N" | "O" | "P" | "Q" | "R" | "S" | "T" | "U" | "V" | "W" | "X" | "Y" | "Z"
type Regex_09 = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';
type Regex_w = Regex_az | Regez_AZ | Regex_09 | '_';
type ParamChar = Regex_w | '-';

// Emulates regex `+`
type RegexMatchPlus<
  CharPattern extends string,
  T extends string,
> = T extends `${infer First}${infer Rest}`
  ? First extends CharPattern
    ? RegexMatchPlus<CharPattern, Rest> extends never
      ? First
      : `${First}${RegexMatchPlus<CharPattern, Rest>}`
    : never
  : never;

// Recursive helper for finding path parameters in the absence of wildcards
type _PathParam<Path extends string> =
  // split path into individual path segments
  Path extends `${infer L}/${infer R}`
    ? _PathParam<L> | _PathParam<R>
    : // find params after `:`
      Path extends `:${infer Param}`
      ? Param extends `${infer Optional}?${string}`
        ? RegexMatchPlus<ParamChar, Optional>
        : RegexMatchPlus<ParamChar, Param>
      : // otherwise, there aren't any params present
        never;

export type PathParam<Path extends string> =
  // check if path is just a wildcard
  Path extends '*' | '/*'
    ? '*'
    : // look for wildcard at the end of the path
      Path extends `${infer Rest}/*`
      ? '*' | _PathParam<Rest>
      : // look for params in the absence of wildcards
        _PathParam<Path>;

function invariant(value: boolean, message?: string): asserts value;
function invariant<T>(value: T | null | undefined, message?: string): asserts value is T;
function invariant(value: unknown, message?: string) {
  if (value === false || value === null || typeof value === 'undefined') {
    throw new Error(message);
  }
}

/**
 * Returns a path with params interpolated.
 * Uses :key as placeholder, params map must contain all interpolated keys
 *
 * @example
 * ```ts
 * const templateUrl = '/api/v1/products/:productId'
 *
 * console.log(generatePath(templateUrl, { productId: 10 })) // '/api/v1/products/10/'
 * console.log(generatePath(templateUrl, { someParam: 10 })) // 'Error: Missing :productId param'
 *
 * ```
 */
export function generatePath<Path extends string>(
  originalPath: Path,
  params: {
    [key in PathParam<Path>]: number | string | null;
  } = {} as any
): string {
  const path: string = originalPath;

  // ensure `/` is added at the beginning if the path is absolute
  const prefix = path.startsWith('/') ? '/' : '';

  const stringify = (p: unknown) => (p == null ? '' : typeof p === 'string' ? p : String(p));

  const segments = path
    .split(/\/+/)
    .map((segment) => {
      const keyMatch = segment.match(/^:([\w-]+)(\??)$/);
      if (keyMatch) {
        const [, key, optional] = keyMatch;
        const param = params[key as PathParam<Path>];
        invariant(optional === '?' || param != null, `Missing ":${key}" param`);
        return stringify(param);
      }

      // Remove any optional markers from optional static segments
      return segment.replace(/\?$/g, '');
    })
    // Remove empty segments
    .filter((segment) => !!segment);
  return prefix + segments.join('/');
}
