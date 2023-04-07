import { getMemoriesByVectorSimilarity } from '../memory.fnc.getMemoriesByVectorSimilarity';
import { IMemoryObject } from '../../../types';

describe('getMemoriesByVectorSimilarity', () => {
  const meta: IMemoryObject['meta'] = {
    createdTimestamp: 0,
    recalledTimestamp: 0,
    recalledCount: 0,
  };
  const memories: IMemoryObject[] = [
    {
      id: 0,
      meta,
      data: {
        author: '',
        vector: [1, 2, 3],
        content: 'Memory 1',
      },
    },
    {
      id: 1,
      meta,
      data: {
        author: '',
        vector: [4, 5, 6],
        content: 'Memory 2',
      },
    },
    {
      id: 2,
      meta,
      data: {
        author: '',
        vector: [7, 8, 9],
        content: 'Memory 3',
      },
    },
  ];

  it('returns an empty array when given an empty array of memories', () => {
    const result = getMemoriesByVectorSimilarity([], [1, 2, 3]);
    expect(result).toEqual([]);
  });

  it('returns an empty array when no memories are similar enough', () => {
    const result = getMemoriesByVectorSimilarity(memories, [0, 0, 0]);
    expect(result).toEqual([]);
  });

  it('returns the correct memories when some memories are similar enough', () => {
    const result = getMemoriesByVectorSimilarity(
      memories,
      memories[0].data.vector,
      {
        threshold: 0.99,
        maximum: 3,
      }
    );
    expect(result[0].memory.id).toEqual(memories[0].id);
  });

  it('returns the memories in reversed order of similarity', () => {
    const result = getMemoriesByVectorSimilarity(
      memories,
      memories[1].data.vector,
      {
        threshold: 0.99,
        maximum: 3,
      }
    );
    const similarities = result.map((s) => s.similarity);
    let inOrder = true;
    let previous = -1;
    for (let index = 0; index < similarities.length; index++) {
      const s = similarities[index];
      if (previous > -1 && s > previous) {
        inOrder = false;
        break;
      }
    }
    expect(inOrder).toEqual(true);
  });

  it('returns the top X memories when there are more than X similar memories', () => {
    const result = getMemoriesByVectorSimilarity(
      memories,
      memories[2].data.vector,
      {
        threshold: 0.99,
        maximum: 2,
      }
    );
    expect(result).toEqual([
      {
        similarity: result[0].similarity,
        memory: memories[1],
      },
      {
        similarity: result[1].similarity,
        memory: memories[2],
      },
    ]);
  });
});
