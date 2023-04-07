import { CreateChatCompletionRequest, OpenAIApi } from 'openai';
import { IDatabase, IDiscordClient, IMemoryObject } from '../types';
import { Message } from 'discord.js';
import {
  IWeightedMemory,
  getMemoriesByVectorSimilarity,
} from './functions/memory.fnc.getMemoriesByVectorSimilarity';
import { executeEmbedding } from '../openai.apis/api.createEmbedding';

export const recallFromMemories = async (
  openai: OpenAIApi,
  shortMemory: IDatabase['shortMemory'],
  message: Message
): Promise<IMemoryObject[]> => {
  const cleanedContent = message.cleanContent;
  const newVector = await executeEmbedding(openai, cleanedContent);
  const weightedMemories: IWeightedMemory[] = getMemoriesByVectorSimilarity(
    shortMemory,
    newVector
  );
  return [];
};

export const processToMemories = async (): Promise<void> => {
  return;
};

/**
 * Process the memory and return relevant messages.
 * @returns {CreateChatCompletionRequest['messages']}
 */
export const getMemoryMessages = async (
  discordClient: IDiscordClient,
  shortMemory: IDatabase['shortMemory'],
  openai: OpenAIApi,
  message: Message
): Promise<CreateChatCompletionRequest['messages']> => {
  const memories = await recallFromMemories(openai, shortMemory, message);
  processToMemories();
  return memories.map((memory) => memory.message);
};
