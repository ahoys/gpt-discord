import config from '../config';
import { CreateChatCompletionRequest, OpenAIApi } from 'openai';
import { IDatabase, IDiscordClient, IMemoryObject } from '../types';
import { Message } from 'discord.js';
import { Collection } from 'chromadb';
import {
  IWeightedMemory,
  getMemoriesByVectorSimilarity,
} from './functions/memory.fnc.getMemoriesByVectorSimilarity';
import { executeEmbedding } from '../openai.apis/api.createEmbedding';
import { ChromaClient, OpenAIEmbeddingFunction } from 'chromadb';
import { print } from 'logscribe';

let memory: Collection;

// export const recallFromMemories = async (
//   openai: OpenAIApi,
//   shortMemory: IDatabase['shortMemory'],
//   message: Message
// ): Promise<IMemoryObject[]> => {
//   const cleanedContent = message.cleanContent;
//   const newVector = await executeEmbedding(openai, cleanedContent);
//   const weightedMemories: IWeightedMemory[] = getMemoriesByVectorSimilarity(
//     shortMemory,
//     newVector
//   );
//   return [];
// };

// export const processToMemories = async (): Promise<void> => {
//   return;
// };

// /**
//  * Process the memory and return relevant messages.
//  * @returns {CreateChatCompletionRequest['messages']}
//  */
// export const getMemoryMessages = async (
//   discordClient: IDiscordClient,
//   shortMemory: IDatabase['shortMemory'],
//   chromaCollection: Collection,
//   openai: OpenAIApi,
//   message: Message
// ): Promise<CreateChatCompletionRequest['messages']> => {
//   const memories = await recallFromMemories(openai, shortMemory, message);
//   processToMemories();
//   return memories.map((memory) => memory.message);
// };

/**
 * Initialize the memory by fetching or creating a
 * Chroma collection.
 */
export const initMemory = async (): Promise<void> => {
  if (!config.openai.apiKey) throw new Error('No OpenAI API key provided.');
  const chroma = new ChromaClient();
  const embedder = new OpenAIEmbeddingFunction(config.openai.apiKey);
  memory = await chroma.getCollection(config.chroma.collection);
  if (memory) return;
  memory = await chroma.createCollection(
    config.chroma.collection,
    {},
    embedder
  );
};

/**
 * Memorize messages.
 */
export const addToMemory = async (
  ids: string[],
  contents: string[],
  metas: {
    role: string;
    name: string;
    temperature: number;
  }[]
): Promise<void> => {
  if (!memory) throw new Error('Memory not initialized.');
  try {
    await memory.add(ids, undefined, metas, contents);
  } catch (error) {
    print(error);
  }
};
