import config from '../config';
import { print } from 'logscribe';
import { CreateChatCompletionRequest, OpenAIApi } from 'openai';

/**
 * Execute a chat completion.
 */
export const executeChatCompletion = async (
  openai: OpenAIApi,
  configuration: CreateChatCompletionRequest
) => {
  if (config.isDevelopment) {
    print(configuration);
  }
  return await openai.createChatCompletion({
    max_tokens: config.openai.maxTokens,
    n: 1,
    stream: false,
    ...configuration,
  });
};
