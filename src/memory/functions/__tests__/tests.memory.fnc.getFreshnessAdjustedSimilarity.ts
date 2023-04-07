import { getFreshnessAdjustedSimilarity } from '../memory.fnc.getFreshnessAdjustedSimilarity';

describe('getFreshnessAdjustedSimilarity', () => {
  it('should return the similarity when the previous recall was less than 10 minutes ago', () => {
    const similarity = 0.8;
    const previousRecall = Date.now() - 1000 * 60 * 5; // 5 minutes ago
    const result = getFreshnessAdjustedSimilarity(similarity, previousRecall);
    expect(result).toBe(similarity);
  });

  it('should return the similarity multiplied by 0.99 when the previous recall was between 10 minutes and 2 hours ago', () => {
    const similarity = 0.8;
    const previousRecall = Date.now() - 1000 * 60 * 30; // 30 minutes ago
    const result = getFreshnessAdjustedSimilarity(similarity, previousRecall);
    expect(result).toBe(similarity * 0.99);
  });

  it('should return the similarity multiplied by 0.98 when the previous recall was between 2 hours and 1 day ago', () => {
    const similarity = 0.8;
    const previousRecall = Date.now() - 1000 * 60 * 60 * 12; // 12 hours ago
    const result = getFreshnessAdjustedSimilarity(similarity, previousRecall);
    expect(result).toBe(similarity * 0.98);
  });

  it('should return the similarity multiplied by 0.96 when the previous recall was between 1 day and 1 week ago', () => {
    const similarity = 0.8;
    const previousRecall = Date.now() - 1000 * 60 * 60 * 24 * 3; // 3 days ago
    const result = getFreshnessAdjustedSimilarity(similarity, previousRecall);
    expect(result).toBe(similarity * 0.96);
  });

  it('should return the similarity multiplied by 0.94 when the previous recall was between 1 week and 1 month ago', () => {
    const similarity = 0.8;
    const previousRecall = Date.now() - 1000 * 60 * 60 * 24 * 14; // 2 weeks ago
    const result = getFreshnessAdjustedSimilarity(similarity, previousRecall);
    expect(result).toBe(similarity * 0.94);
  });
});
