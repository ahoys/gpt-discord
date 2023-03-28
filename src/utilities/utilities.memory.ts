import config from '../config';
import { ChatCompletionRequestMessage } from 'openai';
import { print } from 'logscribe';

interface IMemory {
  [key: string]: {
    [key: string]: ChatCompletionRequestMessage[];
  };
}
/**
 * Memory for user messages. Related to context.
 */
const memory: IMemory = {};

/**
 * Get the context for a author.
 * @param id Guild-Channel ID.
 * @param author Id of author.
 * @param content Content of message.
 * @param maxLength Max length of context.
 * @returns Context for a author.
 */
export const getContext = (
  id: string,
  author: string,
  content: string,
  maxLength: number
): ChatCompletionRequestMessage[] => {
  let messages: ChatCompletionRequestMessage[] = [];
  if (author && content) {
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
  if (config.openai.system && !messages.find((e) => e.role === 'system')) {
    messages.unshift({
      role: 'system',
      content: config.openai.system,
    });
  }
  print(maxLength, messages);
  return messages;
};

/**
 * Update the context with a response.
 * @param id Guild-Channel ID.
 * @param author Id of author.
 * @param content Content of response.
 */
export const updateContextWithResponse = (
  id: string,
  author: string,
  content: string
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
