import config from '../config';
import OpenAI from 'openai';
import { print } from 'logscribe';

/**
 * Execute a chat completion.
 */
export const executeChatCompletion = async (
  openai: OpenAI,
  configuration: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming
) => {
  if (config.isDevelopment || config.isVerbose) {
    print(configuration);
  }
  if (configuration.model.includes('gpt-5')) {
    return await openai.chat.completions.create({
      max_completion_tokens: config.openai.maxTokens,
      model: configuration.model,
      n: 1,
      stream: false,
      messages: configuration.messages,
      verbosity: 'low',
      reasoning_effort: 'medium',
    });
  }
  return await openai.chat.completions.create({
    max_tokens: config.openai.maxTokens,
    n: 1,
    stream: false,
    ...configuration,
  });
};
