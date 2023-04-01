import data from '../../data';
import computeCosineSimilarity from 'compute-cosine-similarity';
import { executeEmbedding } from '../openai.apis/api.embedding';
import { OpenAIApi } from 'openai';
import { print } from 'logscribe';

export const openaiQueryHandler = async (
  openai: OpenAIApi,
  question: string
) => {
  const embedding = await executeEmbedding(openai, question);
  let similarity = 0;
  if (Array.isArray(embedding) && Array.isArray(data)) {
    similarity = computeCosineSimilarity(data, embedding);
    print(similarity);
  }
};
