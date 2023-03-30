import config from '../config';
import { Message } from 'discord.js';
import { ChatCompletionRequestMessage } from 'openai';
import { IDiscordClient } from '../types';

/**
 * Splits a string into chunks of 2000 characters.
 * @param {string} str String to split.
 * @param {number} max Maximum length of each chunk.
 * @returns {string[]} Array of strings.
 */
export const splitString = (str: string, max = 2000): string[] => {
  const result: string[] = [];
  const chunkSize = max;
  for (let i = 0; i < str.length; i += chunkSize) {
    result.push(str.substring(i, i + chunkSize));
  }
  return result;
};

/**
 * Get a message for the messages array.
 * @param {IDiscordClient} client Discord client.
 * @param {Message} message Discord message.
 * @returns {ChatCompletionRequestMessage} Message for the messages array.
 */
export const getMessageForMessages = (
  client: IDiscordClient,
  message: Message
): ChatCompletionRequestMessage => {
  const messageContent = message.cleanContent;
  let role: ChatCompletionRequestMessage['role'] =
    message.author.id === client.user?.id ? 'assistant' : 'user';
  let content: ChatCompletionRequestMessage['content'] = messageContent;
  let name: ChatCompletionRequestMessage['name'] = message.author.username;
  if (content.length > config.discord.maxContentLength) {
    content = content.substring(0, config.discord.maxContentLength);
  }
  return {
    role,
    name,
    content,
  };
};
