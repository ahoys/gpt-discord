/**
 * Splits a string into chunks of 2000 characters.
 * @param {string} str String to split.
 * @param {number} max Maximum length of each chunk.
 * @returns {string[]} Array of strings.
 */
export const splitString = (str: string, max = 2000): string[] => {
  const result: string[] = [];
  const chunkSize = max;
  for (let i = 0; i < str.length; i += chunkSize) {
    result.push(str.substring(i, i + chunkSize));
  }
  return result;
};
