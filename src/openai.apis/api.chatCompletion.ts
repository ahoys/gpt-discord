import config from '../config';
import OpenAI from 'openai';
import { print } from 'logscribe';

/**
 * Execute a chat completion for GPT-5.
 * @param openai OpenAI instance.
 * @param configuration Configuration for the chat completion.
 * @returns {Promise<OpenAI.Chat.Completions.ChatCompletion>} The chat completion.
 */
const chatCompletionForGPT5 = async (
  openai: OpenAI,
  configuration: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming
) => await openai.chat.completions.create({
  max_completion_tokens: config.openai.maxTokens,
  model: configuration.model,
  n: 1,
  stream: false,
  messages: configuration.messages,
  verbosity: 'low',
  reasoning_effort: 'medium',
});

/**
 * Execute a chat completion for legacy models.
 * @param openai OpenAI instance.
 * @param configuration Configuration for the chat completion.
 * @returns {Promise<OpenAI.Chat.Completions.ChatCompletion>} The chat completion.
 */
const chatCompletionLegacy = async (
  openai: OpenAI,
  configuration: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming
) => await openai.chat.completions.create({
  max_tokens: config.openai.maxTokens,
  n: 1,
  stream: false,
  ...configuration,
});

/**
 * Execute a chat completion.
 * @param openai OpenAI instance.
 * @param configuration Configuration for the chat completion.
 * @returns {Promise<OpenAI.Chat.Completions.ChatCompletion>} The chat completion.
 */
export const executeChatCompletion = async (
  openai: OpenAI,
  configuration: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming
) => {
  if (config.isDevelopment || config.isVerbose) {
    print(configuration);
  }
  if (configuration.model.includes('gpt-5')) {
    return await chatCompletionForGPT5(openai, configuration);
  }
  return await chatCompletionLegacy(openai, configuration);
};
