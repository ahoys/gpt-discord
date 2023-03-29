import config from '../config';
import { ChatCompletionRequestMessage } from 'openai';
import { IMemory } from '../types';

/**
 * Get the context for a author.
 * @param id Guild-Channel ID.
 * @param author Id of author.
 * @param content Content of message.
 * @param maxLength Max length of context.
 * @param memory Memory object.
 * @returns Context for a author.
 */
export const getContext = (
  id: string,
  author: string,
  content: string,
  maxLength: number,
  memory: IMemory
): ChatCompletionRequestMessage[] => {
  let messages: ChatCompletionRequestMessage[] = [];
  if (author && content) {
    if (maxLength <= 0) {
      messages = [
        {
          role: 'user',
          content: String(content),
        },
      ];
    } else {
      messages = memory[id] ? [...(memory[id][author] || [])] : [];
      messages.push({
        role: 'user',
        content: String(content),
      });
      const len = messages.filter((e) => e.role === 'user').length;
      if (len > maxLength + 1) {
        messages.splice(0, len - (maxLength - 1));
      }
      if (memory[id]) {
        memory[id][author] = messages;
      } else {
        memory[id] = {};
        memory[id][author] = messages;
      }
    }
  }
  if (config.openai.system && !messages.find((e) => e.role === 'system')) {
    messages.unshift({
      role: 'system',
      content: config.openai.system,
    });
  }
  return messages;
};

/**
 * Update the context with a response.
 * @param id Guild-Channel ID.
 * @param author Id of author.
 * @param content Content of response.
 * @param memory Memory object.
 */
export const updateContextWithResponse = (
  id: string,
  author: string,
  content: string,
  memory: IMemory
) => {
  if (id && author && content) {
    const existing = memory[id] ? [...(memory[id][author] || [])] : [];
    existing.push({
      role: 'system',
      content: String(content),
    });
    if (memory[id]) {
      memory[id][author] = existing;
    } else {
      memory[id] = {};
      memory[id][author] = existing;
    }
  }
};
