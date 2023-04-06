import config from '../config';
import compute_cosine_similarity from 'compute-cosine-similarity';
import { OpenAIApi } from 'openai';
import { executeEmbedding } from '../openai.apis/api.createEmbedding';
import { IDatabase, IMemoryObject } from '../types';
import { Message } from 'discord.js';

const MEMORY_THRESHOLD = 0.82;

/**
 * Get relevant memories from short term memory.
 */
const getFromShortTermMemory = async (
  openai: OpenAIApi,
  db: IDatabase,
  content: string
): Promise<IMemoryObject[]> => {
  let relevantMemories: IMemoryObject[] = [];
  const vector = await executeEmbedding(openai, content.trim().toLowerCase());
  if (Array.isArray(vector)) {
    const memories: {
      similarity: number;
      memory: IMemoryObject;
    }[] = [];
    for (let i = 0; i < db.shortMemory.length; i++) {
      const similarity = compute_cosine_similarity(
        db.shortMemory[i].vector,
        vector
      );
      if (config.isDevelopment) {
        console.log(
          'Memory:',
          similarity,
          similarity >= MEMORY_THRESHOLD,
          db.shortMemory[i].content
        );
      }
      if (similarity >= MEMORY_THRESHOLD) {
        memories.push({
          similarity,
          memory: db.shortMemory[i],
        });
      }
    }
    memories.sort((a, b) => a.similarity - b.similarity);
    relevantMemories = memories.map((m) => m.memory);
  }
  return relevantMemories;
};

let requestCount = 0;

/**
 * Put to short term memory.
 */
export const putToShortTermMemory = async (
  openai: OpenAIApi,
  db: IDatabase,
  message: Message,
  username: string | undefined
): Promise<void> => {
  // Don't use memory if it's disabled.
  if (!config.openai.tune.appendMemoryToContext) return;
  // Check if we've exceeded the maximum number of requests per minute
  if (requestCount >= config.openai.maxMemoryRequestsInMinute) {
    // Buffer the request and return early.
    return;
  }
  let content = message.cleanContent.trim();
  // Don't remember questions or too long messages.
  if (content.includes('?') || content.length > 512) return;
  // Remove the first @mention from the content.
  if (content.startsWith(`@${username}`)) {
    content = content.replace(`@${username}`, '').trim();
  }
  // Increment the request count and reset it after a minute
  requestCount++;
  setTimeout(() => {
    requestCount = 0;
  }, 60 * 1000);
  await executeEmbedding(openai, content).then((vector) => {
    if (Array.isArray(vector)) {
      if (db.shortMemory.length >= 64) {
        db.shortMemory.shift();
      }
      db.shortMemory.push({
        name: message.author.username || 'Someone',
        content,
        vector,
      });
    }
  });
};

interface IMemoryMessage {
  role: 'user';
  name: string;
  content: string;
}

/**
 * Recalled memories from short term memory as messages.
 * @param openai OpenAI API.
 * @param db Database.
 * @param content Discord Message content as-is.
 * @returns Memory messages.
 */
export const getMemoryMessages = async (
  openai: OpenAIApi,
  db: IDatabase,
  content: string
): Promise<IMemoryMessage[]> => {
  const memoryMessages: IMemoryMessage[] = [];
  // Don't use memory if it's disabled.
  if (!config.openai.tune.appendMemoryToContext) return memoryMessages;
  const memories = await getFromShortTermMemory(openai, db, content);
  let totalLen = 0;
  for (const memory of memories) {
    if (totalLen + memory.content.length > 512) break;
    totalLen += memory.content.length;
    memoryMessages.push({
      role: 'user',
      name: memory.name,
      content: memory.content,
    });
  }
  return memoryMessages;
};
