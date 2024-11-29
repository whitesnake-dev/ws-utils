type ClassName = string | undefined | null | false | { [key: string]: boolean } | ClassName[];

/**
 * Combines multiple class names into a single string.
 *
 * This function is designed to work seamlessly with Tailwind CSS and supports:
 * - String class names (e.g., 'bg-red-500').
 * - Conditional classes in object format (e.g., { 'text-green-500': true, 'hidden': false }).
 * - Nested arrays of class names for dynamic generation.
 * - Automatically ignores falsy values such as `null`, `undefined`, and `false`.
 *
 * @param {...ClassName[]} classNames - List of class names as strings, objects, or arrays.
 * @returns {string} A single string containing all valid class names separated by spaces.
 */
export const mergeClassNames = (...classNames: Array<ClassName>): string => {
  const result: string[] = [];

  const processClass = (classItem: ClassName) => {
    if (typeof classItem === 'string') {
      result.push(classItem); // Add string class directly
    } else if (classItem && typeof classItem === 'object' && !Array.isArray(classItem)) {
      // Process dynamic Tailwind-style classes (e.g., { 'text-red-500': true })
      Object.entries(classItem).forEach(([key, value]) => {
        if (value) result.push(key); // Add class if value is true
      });
    } else if (Array.isArray(classItem)) {
      // Recursively process nested arrays
      classItem.forEach(processClass);
    }
  };

  classNames.forEach(processClass);

  return result.join(' ');
};
