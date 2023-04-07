import config from '../../config';
import compute_cosine_similarity from 'compute-cosine-similarity';
import { IMemoryObject } from '../../types';

export interface IWeightedMemory {
  similarity: number;
  memory: IMemoryObject;
}

/**
 * Filters memories by vector similarity.
 * The memories will be returned in order of similarity.
 * The highest similarity will be at the beginning of the array.
 * @param memories Unfiltered memories.
 * @param vector Vector to compare against.
 * @param threshold Minimum similarity threshold.
 * @param maximum Maximum number of memories to return.
 * @returns Filtered memories.
 */
export const getMemoriesByVectorSimilarity = (
  memories: IMemoryObject[],
  vector: number[],
  options = {
    threshold: 0.82,
    maximum: 8,
  }
): IWeightedMemory[] => {
  const foundMemories: IWeightedMemory[] = [];
  if (Array.isArray(memories && vector)) {
    // Find all memories that are similar enough.
    for (let i = 0; i < memories.length; i++) {
      const similarity = compute_cosine_similarity(
        memories[i].meta.vector,
        vector
      );
      if (config.isDevelopment) {
        console.log(
          'Memory:',
          similarity,
          similarity >= options.threshold,
          memories[i].message.content
        );
      }
      if (similarity >= options.threshold) {
        foundMemories.push({
          similarity,
          memory: memories[i],
        });
      }
    }
    // Sort the memories by similarity.
    foundMemories.sort((a, b) => a.similarity - b.similarity);
  }
  // Return the top X memories.
  // We could return everything, but this is a bit more efficient.
  return foundMemories.slice(0, options.maximum);
};
