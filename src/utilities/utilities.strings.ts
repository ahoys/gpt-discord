/**
 * Compares two strings and returns a similarity percentage
 * @param str1 String.
 * @param str2 String.
 * @returns {number} Similarity percentage.
 */
export const compareStrings = (str1: string, str2: string): number => {
  const str1low = str1.toLowerCase();
  const str2low = str2.toLowerCase();
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = [];

  // Initialize matrix with 0s
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill in matrix with Levenshtein distances
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1low[i - 1] === str2low[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  // Calculate similarity percentage
  const distance = matrix[len1][len2];
  const maxLength = Math.max(len1, len2);
  const similarity = (1 - distance / maxLength) * 100;
  return similarity;
};
