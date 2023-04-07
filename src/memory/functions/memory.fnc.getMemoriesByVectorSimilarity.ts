import config from '../../config';
import compute_cosine_similarity from 'compute-cosine-similarity';
import { IMemoryObject } from '../../types';

/**
 * Filters memories by vector similarity.
 * @param memories Unfiltered memories.
 * @param vector Vector to compare against.
 * @param threshold Minimum similarity threshold.
 * @param maximum Maximum number of memories to return.
 * @returns Filtered memories.
 */
export const getMemoriesByVectorSimilarity = (
  memories: IMemoryObject[],
  vector: number[],
  threshold = 0.82,
  maximum = 8
): IMemoryObject[] => {
  let relevantMemories: IMemoryObject[] = [];
  if (Array.isArray(memories && vector)) {
    const foundMemories: {
      similarity: number;
      memory: IMemoryObject;
    }[] = [];
    // Find all memories that are similar enough.
    for (let i = 0; i < memories.length; i++) {
      const similarity = compute_cosine_similarity(
        memories[i].data.vector,
        vector
      );
      if (config.isDevelopment) {
        console.log(
          'Memory:',
          similarity,
          similarity >= threshold,
          memories[i].data.content
        );
      }
      if (similarity >= threshold) {
        foundMemories.push({
          similarity,
          memory: memories[i],
        });
      }
    }
    // Sort the memories by similarity.
    foundMemories.sort((a, b) => a.similarity - b.similarity);
    relevantMemories = foundMemories.map((m) => m.memory);
  }
  // Return the top X memories.
  // We could return everything, but this is a bit more efficient.
  return relevantMemories.slice(0, maximum);
};
