import config from '../config';
import { print } from 'logscribe';
import { OpenAIApi } from 'openai';

/**
 * Execute embedding.
 */
export const executeEmbedding = async (openai: OpenAIApi, input: string) =>
  openai
    .createEmbedding({
      model: config.openai.embeddingModel,
      input,
    })
    .then((response) => response?.data?.data[0]?.embedding ?? [])
    .catch((error) => {
      print(error);
      return;
    });