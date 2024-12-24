/**
 * Extracts initials from a given name.
 *
 * This utility generates initials from a person's name, which can be used for avatars,
 * abbreviations, or other shorthand representations.
 *
 * - If the name contains only one word, it will take the first `limit` characters of that word.
 * - If the name contains multiple words, it will take the first letter of each word, up to the `limit`.
 * - The result is always returned in uppercase.
 *
 * @param {string} name - The name from which to extract initials.
 * @param {number} [limit=2] - The maximum number of initials to generate.
 * @returns {string} The generated initials in uppercase.
 *
 * @example
 * getInitials("John Doe"); // Returns "JD"
 * getInitials("Alice Wonderland", 3); // Returns "AW"
 * getInitials("SingleWord", 1); // Returns "S"
 */
export function getInitials(name: string, limit = 2): string {
  const splitted = name.split(' ');

  if (splitted.length === 1) {
    // Single word case: Take the first `limit` characters.
    return name.slice(0, limit).toUpperCase();
  }

  // Multiple words case: Take the first character of each word, up to `limit`.
  return splitted
    .map((word) => word[0])
    .slice(0, limit)
    .join('')
    .toUpperCase();
}
