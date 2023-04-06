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
 * @param {IDiscordClient} discordClient Discord client.
 * @param {Message} message Discord message.
 * @returns {ChatCompletionRequestMessage} Message for the messages array.
 */
export const getMessageForMessages = (
  discordClient: IDiscordClient,
  message: Message
): ChatCompletionRequestMessage | undefined => {
  if (!discordClient || !message?.author) return;
  const messageContent = message.cleanContent ?? message.content;
  if (!messageContent || messageContent.trim().length <= 0) return;
  let role: ChatCompletionRequestMessage['role'] =
    message.author?.id === discordClient.user?.id ? 'assistant' : 'user';
  let content: ChatCompletionRequestMessage['content'] = messageContent;
  let name: ChatCompletionRequestMessage['name'] = message.author?.username;
  if (role === 'user') {
    if (content.startsWith(`@${discordClient.user?.username} `)) {
      content = content.replace(`@${discordClient.user?.username} `, '');
    }
    content = `<${message.author.username}> ${content}`;
  }
  if (content.length > config.discord.maxContentLength) {
    content = content.substring(0, config.discord.maxContentLength);
  }
  return {
    role,
    name,
    content,
  };
};

/**
 * Get reference message.
 * @param message Discord message.
 * @returns Reference message.
 */
export const getReference = async (
  message: Message
): Promise<Message | undefined> => {
  if (!message?.channel) return;
  if (!message.reference?.messageId) return;
  return await message.channel.messages.fetch(
    message.reference?.messageId as any
  );
};

/**
 * Get first reference message.
 * @param message Discord message.
 * @returns First reference message.
 */
export const getFirstReference = async (
  message: Message
): Promise<Message | undefined> => {
  const reference = await getReference(message);
  if (reference) {
    return await getFirstReference(reference);
  } else {
    return message;
  }
};
