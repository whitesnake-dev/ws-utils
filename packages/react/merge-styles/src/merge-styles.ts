import { CSSProperties } from 'react';

type InlineStyle = CSSProperties | Record<string, string | number | undefined> | undefined | null;

/**
 * Merges multiple CSS style objects into a single consolidated style object.
 *
 * Filters out null, undefined, and invalid values, combining only valid styles.
 *
 * @param {...InlineStyle[]} styles - Style objects to merge.
 * @returns {CSSProperties | undefined} - Merged style object or undefined.
 */
export const mergeStyles = (...styles: InlineStyle[]): CSSProperties | undefined => {
  const mergedStyle: CSSProperties = {};

  for (const style of styles) {
    if (style && typeof style === 'object') {
      Object.assign(mergedStyle, style);
    }
  }

  return Object.keys(mergedStyle).length > 0 ? mergedStyle : undefined;
};
