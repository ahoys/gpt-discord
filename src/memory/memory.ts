import { CreateChatCompletionRequest, OpenAIApi } from 'openai';
import { IDiscordClient, IMemoryObject } from '../types';
import { Message } from 'discord.js';

export const recallFromMemories = (
  openai: OpenAIApi,
  message: Message
): IMemoryObject[] => {
  return [];
};

export const processToMemories = (): void => {
  return;
};

/**
 * Process the memory and return relevant messages.
 * @returns {CreateChatCompletionRequest['messages']}
 */
export const getMemoryMessages = (
  discordClient: IDiscordClient,
  openai: OpenAIApi,
  message: Message
): CreateChatCompletionRequest['messages'] => {
  const memories = recallFromMemories(openai, message);
  return memories.map((memory) => memory.message);
};
