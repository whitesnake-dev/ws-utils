import { generatePath as generatePathOriginal } from '@/http/url';

import { urlJoin } from '@/http/url';

type RouteHierarchyNode<E> = {
  [key: string]: {
    readonly path: string;
    readonly children?: RouteHierarchyNode<E>;
  } & E;
};

export type TransformedRoute = string & {
  /**
   * Route key, which is basically a constant name
   */
  readonly key: string;

  /**
   * Parent key, which is basically a constant name of the parent route
   */
  readonly parentKey: string;
  /**
   * Absolute path of the route, without any params interpolation, same as Routes.<ROUTE>.toString()
   */
  readonly path: string;

  /**
   * Substitutes params in path with provided values
   * @param params - object with keys corresponding to path params
   * @example
   * ```ts
   * // /v1/products/:id/review
   * APIRoutes.V1_PRODUCTS_$ID_REVIEW.generatePath({productId: 10}) // "/v1/products/10/review"
   * ```
   */
  generatePath: (params: Record<string, string | number>) => string;
};

/**
 * Recursively infers key of route, so
 * ```ts
 *
 * V1: {
 *     children: {
 *         PRODUCTS: {
 *             ...
 *         }
 *     }
 * }
 * becomes
 * V1 and V1_PRODUCTS
 * ```
 */
type InferRouteKeys<T extends RouteHierarchyNode<unknown>, Parent extends string = ''> = {
  [K in keyof T & string]: T[K] extends {
    path: string;
    children: infer Children extends RouteHierarchyNode<unknown>;
  }
    ? `${Parent}${K}` | InferRouteKeys<Children, `${Parent}${K}_`>
    : `${Parent}${K}`;
}[keyof T & string];

type TransformedRoutesType<E, T extends RouteHierarchyNode<E>> = {
  [P in InferRouteKeys<T>]: TransformedRoute & E;
};

/**
 * Generates flattened route constant map, where every route is string-compatible object with extra features
 * including path generation from provided parameters. See example for explanation.
 * Properly configured typescript and IDE will provide all possible constant names in autocompletion.
 *
 * @example
 * ```ts
 * const APIRoutes = routes({
 *   V1: {
 *     path: 'v1',
 *     children: {
 *       PRODUCTS: {
 *         path: 'products',
 *         children: {
 *           $ID: {
 *             path: ':productId',
 *             children: {
 *               REVIEW: {
 *                 path: 'review',
 *               },
 *             },
 *           },
 *         },
 *       },
 *     },
 *   },
 * } as const) // <-- this is necessary to make Typescript treat it correct and generate all literals;
 *
 * // true, but keep in mind that APIRoutes contain string subclasses, so === check won't work.
 * // Use toString() if you really need only a string in a comparison or use V1_PRODUCTS.path which is basically the same
 * APIRoutes.V1_PRODUCTS == "/v1/products/"
 *
 * APIRoutes.V1_PRODUCTS_$ID_REVIEW.generatePath({productId: 10}) == "/v1/products/10/review"
 * APIRoutes.V1_PRODUCTS.key == "V1_PRODUCTS"
 * APIRoutes.V1_PRODUCTS.parentKey == "V1"
 * ```
 */
export function routes<T extends RouteHierarchyNode<E>, E>(
  hierarchy: T
): TransformedRoutesType<E, T> {
  const accumulateRoutes = (
    obj: RouteHierarchyNode<E>,
    parentPath: string = '',
    parentKey: string = ''
  ): Record<string, TransformedRoute> => {
    return Object.entries(obj).reduce<Record<string, TransformedRoute>>((acc, [key, value]) => {
      const currentKey = parentKey ? `${parentKey}_${key}` : key;
      if (value.children) {
        const accumulated = accumulateRoutes(
          value.children,
          urlJoin([parentPath, value.path]),
          currentKey
        );
        Object.assign(acc, accumulated);
      }
      const absPath = urlJoin([parentPath, value.path]);
      // @ts-expect-error - we're adding generatePath later
      acc[currentKey] = Object.assign(absPath, {
        ...value,
        path: absPath,
        key: currentKey,
        parentKey: parentKey,
      });
      return acc;
    }, {});
  };

  const result = accumulateRoutes(hierarchy);
  for (const routeKey in result) {
    result[routeKey].generatePath = (params) => generatePathOriginal(result[routeKey].path, params);
  }
  return result as TransformedRoutesType<E, T>;
}

/**
 * A dirty hack to make typescript infer hierarchy while providing concrete metadata type.
 * You need to call it, providing metadata type into generic, and then call as usual {@link routes}
 * @template E - metadata type merged with every route record
 *
 * @example
 * ```ts
 *
 * // Note double parentheses, it's needed due to shitty typescript limitations regarding partial type inference
 * // ... or I'm just too dumb to understand how to do it properly
 * const ProductAPIRoutes = routesWithMetadata<{ permission?: string }>()({
 *   V1: {
 *     path: "v1",
 *     children: {
 *       PRODUCTS: {
 *         path: "products",
 *         children: {
 *             $ID: {
 *               permission: "product.read",
 *               path: ":id"
 *             }
 *         }
 *       }
 *     }
 *   }
 * } as const)
 * ```
 */
export function routesWithMetadata<E>() {
  return <T extends RouteHierarchyNode<E>>(hierarchy: T) => routes<T, E>(hierarchy);
}
