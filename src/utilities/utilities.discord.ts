/**
 * Splits a string into chunks of 2000 characters
 * @param {string} str String to split
 * @returns {string[]} Array of strings
 */
export const splitString = (str: string): string[] => {
  const result: string[] = [];
  const chunkSize = 2000;
  for (let i = 0; i < str.length; i += chunkSize) {
    result.push(str.substring(i, i + chunkSize));
  }
  return result;
};
