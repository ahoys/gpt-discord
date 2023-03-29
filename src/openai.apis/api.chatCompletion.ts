import config from '../config';
import { CreateChatCompletionRequest, OpenAIApi } from 'openai';

/**
 * Execute a chat completion.
 */
export const executeChatCompletion = async (
  openai: OpenAIApi,
  configuration: CreateChatCompletionRequest,
  handleSuccess: (content: string) => void,
  handleFailure: (error: unknown) => void
) =>
  openai
    .createChatCompletion({
      max_tokens: config.openai.maxTokens,
      n: 1,
      stream: false,
      ...configuration,
    })
    .then(async (response) =>
      handleSuccess(response?.data?.choices[0]?.message?.content ?? '')
    )
    .catch((error) => handleFailure(error));
