/**
 * Adjusts the similarity based on how long ago the previous recall was.
 * @param similarity Similarity to adjust.
 * @param previousRecall Timestamp of the previous recall.
 * @param recalledCount Number of times the memory has been recalled.
 * @returns Adjusted similarity.
 */
export const getFreshnessAdjustedSimilarity = (
  similarity: number,
  previousRecall: number,
  recalledCount: number
): number => {
  const now = Date.now();
  const distance = now - previousRecall;
  let multiplier = 0;
  if (distance < 1000 * 60 * 10) {
    // 10 minutes
    multiplier = 1;
  } else if (distance < 1000 * 60 * 60 * 2) {
    // 2 hour
    multiplier = 0.98;
  } else if (distance < 1000 * 60 * 60 * 24) {
    // 1 day
    multiplier = 0.94;
  } else if (distance < 1000 * 60 * 60 * 24 * 7) {
    // 1 week
    multiplier = 0.86;
  } else if (distance < 1000 * 60 * 60 * 24 * 30) {
    // 1 month
    multiplier = 0.7;
  }
  return similarity * (multiplier * (1 + recalledCount / 100));
};