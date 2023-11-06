import config from '../config';
import OpenAI from 'openai';
import { print } from 'logscribe';

/**
 * Execute embedding.
 */
export const executeEmbedding = async (
  openai: OpenAI,
  input: string
): Promise<number[]> => {
  let vector: number[] = [];
  await openai.embeddings
    .create({
      model: config.openai.embeddingModel,
      input,
    })
    .then((response) => {
      if (response?.data[0]?.embedding) {
        vector = response.data[0].embedding;
      }
    })
    .catch((error) => {
      print(error);
    });
  return vector;
};
