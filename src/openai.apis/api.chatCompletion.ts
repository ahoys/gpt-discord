import config from '../config';
import { CreateChatCompletionRequest, OpenAIApi } from 'openai';

/**
 * Execute a chat completion.
 */
export const executeChatCompletion = async (
  openai: OpenAIApi,
  configuration: CreateChatCompletionRequest
) =>
  await openai.createChatCompletion({
    max_tokens: config.openai.maxTokens,
    n: 1,
    stream: false,
    ...configuration,
  });
