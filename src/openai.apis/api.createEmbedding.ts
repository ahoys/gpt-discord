import config from '../config';
import { print } from 'logscribe';
import { OpenAIApi } from 'openai';

/**
 * Execute embedding.
 */
export const executeEmbedding = async (
  openai: OpenAIApi,
  input: string
): Promise<number[]> => {
  let vector: number[] = [];
  await openai
    .createEmbedding({
      model: config.openai.embeddingModel,
      input,
    })
    .then((response) => {
      if (response?.data?.data[0]?.embedding) {
        vector = response.data.data[0].embedding;
      }
    })
    .catch((error) => {
      print(error);
    });
  return vector;
};
