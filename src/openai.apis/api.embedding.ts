import { OpenAIApi } from 'openai';

/**
 * Execute embedding.
 */
export const executeEmbedding = async (
  openai: OpenAIApi,
  input: string,
  handleSuccess: (embedding: number[]) => void,
  handleFailure: (error: unknown) => void
) =>
  openai
    .createEmbedding({
      model: 'text-embedding-ada-002',
      input,
    })
    .then(async (response) =>
      handleSuccess(response?.data?.data[0]?.embedding ?? [])
    )
    .catch((error) => handleFailure(error));
