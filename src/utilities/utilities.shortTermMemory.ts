import config from '../config';
import compute_cosine_similarity from 'compute-cosine-similarity';
import { OpenAIApi } from 'openai';
import { executeEmbedding } from '../openai.apis/api.createEmbedding';
import { IDatabase } from '../types';
import { Message } from 'discord.js';

/**
 * Get from short term memory.
 */
export const getFromShortTermMemory = async (
  openai: OpenAIApi,
  db: IDatabase,
  message: Message
): Promise<string | void> => {
  const content = message.cleanContent.trim().toLowerCase();
  let memory = '';
  if (config.openai.maxMemoryRequestsInMinute <= 0) return memory;
  await executeEmbedding(openai, content).then((vector) => {
    if (Array.isArray(vector)) {
      let smallest = -1;
      let similarity = 0;
      for (let i = 0; i < db.shortMemory.length; i++) {
        const value = compute_cosine_similarity(
          db.shortMemory[i].vector,
          vector
        );
        if (value > similarity && value > 0.8) {
          smallest = i;
          similarity = value;
        }
      }
      if (typeof db.shortMemory[smallest]?.fact === 'string') {
        memory = db.shortMemory[smallest]?.fact;
      }
    }
  });
  return memory;
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
  // Check if we've exceeded the maximum number of requests per minute
  if (requestCount >= config.openai.maxMemoryRequestsInMinute) {
    // Buffer the request and return early.
    return;
  }
  let content = message.cleanContent.trim();
  // Don't remember questions.
  if (content.includes('?')) return;
  // Remove the first @mention from the content.
  if (content.startsWith(`@${username}`)) {
    content = content.replace(`@${username}`, '');
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
