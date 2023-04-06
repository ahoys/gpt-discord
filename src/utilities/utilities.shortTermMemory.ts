import config from '../config';
import compute_cosine_similarity from 'compute-cosine-similarity';
import { OpenAIApi } from 'openai';
import { executeEmbedding } from '../openai.apis/api.createEmbedding';
import { IDatabase } from '../types';
import { Message } from 'discord.js';

const MEMORY_THRESHOLD = 0.82;

/**
 * Get from short term memory.
 */
export const getFromShortTermMemory = async (
  openai: OpenAIApi,
  db: IDatabase,
  message: Message
): Promise<string | void> => {
  // Don't use memory if it's disabled.
  if (!config.openai.tune.appendMemoryToContext) return;
  const content = message.cleanContent.trim().toLowerCase();
  let memory = '';
  if (config.openai.maxMemoryRequestsInMinute <= 0) return memory;
  await executeEmbedding(openai, content).then((vector) => {
    if (Array.isArray(vector)) {
      const memories: {
        similarity: number;
        fact: string;
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
            db.shortMemory[i].fact
          );
        }
        if (similarity >= MEMORY_THRESHOLD) {
          memories.push({
            similarity,
            fact: db.shortMemory[i].fact,
          });
        }
      }
      memories.sort((a, b) => b.similarity - a.similarity);
      memory = memories
        .map((m) => m.fact)
        .join(', ')
        .substring(0, 512);
    }
  });
  return memory.length >= 512 ? memory.trim() + '...' : memory.trim();
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
      if (db.shortMemory.length >= 32) {
        db.shortMemory.shift();
      }
      db.shortMemory.push({
        fact: content,
        vector,
      });
    }
  });
};
