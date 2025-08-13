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
  if (['gpt-5'].includes(configuration.model)) {
    return await openai.chat.completions.create({
      max_completion_tokens: config.openai.maxTokens,
      model: 'gpt-5',
      n: 1,
      stream: false,
      messages: configuration.messages,
      verbosity: 'low',
      reasoning_effort: 'high',
    });
  }
  return await openai.chat.completions.create({
    max_tokens: config.openai.maxTokens,
    n: 1,
    stream: false,
    ...configuration,
  });
};
