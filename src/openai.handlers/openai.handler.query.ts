import computeCosineSimilarity from 'compute-cosine-similarity';
import { DataFrame } from 'node-pandas';
import { executeEmbedding } from '../openai.apis/api.embedding';
import { OpenAIApi } from 'openai';

export const openaiQueryHandler = async (
  openai: OpenAIApi,
  df: typeof DataFrame,
  question: string
) => {
  const embedding = await executeEmbedding(openai, question);
  let similarity = 0;
  if (Array.isArray(embedding)) {
    similarity = computeCosineSimilarity([], embedding);
  }
};
