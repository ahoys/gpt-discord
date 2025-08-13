import config from '../config';
import OpenAI from 'openai';
import { ClientUser, Events, Guild, Message } from 'discord.js';
import { print } from 'logscribe';
import { IDatabase, IDiscordClient } from '../types';
import { getId, reply } from '../utilities/utilities.cmd';
import { executeChatCompletion } from '../openai.apis/api.chatCompletion';
import { getDynamicTemperature } from '../utilities/utilities.temperature';
import {
  ChatCompletionMessage,
  ChatCompletionSystemMessageParam,
  ChatCompletionUserMessageParam,
} from 'openai/resources';

const MAX_REPLY_LENGTH = 1024; // The higher this goes, the more expensive is the query.
const MAX_REPLIES_TO_FETCH = 8; // Discord may buffer if too much is fetched at once.

export type TOpenAIMessage =
  | ChatCompletionMessage
  | ChatCompletionSystemMessageParam
  | ChatCompletionUserMessageParam;

const getFormedMessage = (
  user: ClientUser,
  message: Message,
  parse = false
): ChatCompletionMessage | ChatCompletionUserMessageParam => {
  const isAssistant = message.author.id === user.id;
  const role = isAssistant ? 'assistant' : 'user';
  const name = message.author.username?.replace(/[^a-zA-Z0-9]/g, '');
  const content = parse
    ? message.cleanContent.replace(`@${user.username} `, '').trim()
    : message.cleanContent;
  if (isAssistant) {
    return { role, content } as ChatCompletionMessage;
  }
  return {
    role,
    name,
    content,
  } as ChatCompletionUserMessageParam;
};

/**
 * Get the reference message.
 * @param message Message to get the reference from.
 * @returns {Promise<Message | undefined>} Reference message.
 */
const getReference = async (message: Message): Promise<Message | undefined> =>
  message.reference?.messageId
    ? message.channel.messages.fetch(message.reference.messageId)
    : undefined;

/**
 * Whether a reply is requested.
 * @param message Message to check.
 * @param user Discord client user (the bot).
 * @returns
 */
const isReplyRequested = (message: Message, user: ClientUser): boolean =>
  message.mentions.has(user) || message.content.includes(`@<${user.id}>`);

/**
 * Use OpenAI Chat Completion to reply to a message.
 * @param message
 */
const replyToMessage = async (
  openai: OpenAI,
  user: ClientUser,
  message: Message,
  db: IDatabase
) => {
  try {
    // See if the message is a reply to another message.
    // That another message may contain information about the context.
    const messages: TOpenAIMessage[] = [];
    let lastReference: TOpenAIMessage | undefined;
    let totalLength = 0;
    let safeLimit = MAX_REPLIES_TO_FETCH;
    let previousReference: Message | undefined = await getReference(message);
    const doReply = isReplyRequested(message, user);
    if (doReply && previousReference) {
      const formedMessage = getFormedMessage(user, previousReference);
      lastReference = formedMessage;
      messages.push(formedMessage);
      totalLength += previousReference.content.length;
    }
    do {
      if (previousReference) {
        const reference = await getReference(previousReference);
        previousReference = reference;
        if (reference) {
          const formedMessage = getFormedMessage(user, reference);
          lastReference = formedMessage;
          if (
            totalLength + (formedMessage.content || '').length <
            MAX_REPLY_LENGTH
          ) {
            messages.unshift(formedMessage);
          }
        }
      }
      safeLimit--;
    } while (previousReference && safeLimit > 0);
    if (lastReference && messages[0]?.content !== lastReference.content) {
      // The original message.
      messages.unshift(lastReference);
    }
    // Add the message that triggered the reply.
    const currentMessage = getFormedMessage(user, message, true);
    messages.push(currentMessage);
    if (messages.length < 1) return;
    // Finally, add the system message.
    const dbId = getId((message.guild as Guild).id, message.channel.id);
    const guildSystem = db.systems.getKey(dbId);
    if (doReply && (guildSystem || config.openai.defaultSystem)) {
      messages.unshift({
        role: 'system',
        content: (guildSystem || (config.openai.defaultSystem as string) || '')
          .trim()
          .substring(0, 512),
      });
    }
    // Define configuration for the chat completion.
    const model = db.models.getKey(dbId) ?? config.openai.defaultModel;
    const temperature = getDynamicTemperature(db, dbId, !!lastReference);
    // Execute the chat completion.
    // If a reply is requested.
    if (doReply) {
      await executeChatCompletion(openai, {
        model,
        temperature,
        messages,
      })
        .then(async (response) => {
          // Reply to the message.
          const gptMessage = response.choices[0].message?.content;
          if (gptMessage) {
            await reply(message, gptMessage);
          }
        })
        .catch((error) => print(error?.message || error));
    }
  } catch (error) {
    print(error);
  }
};

/**
 * Check if the message is allowed to be read.
 * @param user Discord client user (the bot).
 * @param message Message to validate.
 * @returns {boolean} True if the message is allowed to be read.
 */
export const messageReadingAllowed = (
  user: ClientUser | null,
  message: Message
): boolean => {
  try {
    if (!user) return false;
    if (typeof message !== 'object') return false;
    if (!message.guild) return false;
    if (!message.channel) return false;
    if (message.author.bot) return false;
    if (message.cleanContent?.trim().length < 1) return false;
    if (message.cleanContent?.trim().length > config.discord.maxContentLength) {
      return false;
    }
    if (
      message.mentions.everyone ||
      message.mentions.roles.some((role) => role.mentionable)
    ) {
      return false;
    }
    if (!isReplyRequested(message, user as ClientUser)) {
      return false;
    }
    return true;
  } catch (error) {
    print(error);
    return false;
  }
};

/**
 * Handle incoming messages.
 * If the message mentions the bot, reply with a chat completion.
 */
export default (client: IDiscordClient, openai: OpenAI, db: IDatabase) =>
  client.on(Events.MessageCreate, async (message) => {
    try {
      // For security reasons, only specific messages are allowed
      // to be read.
      if (messageReadingAllowed(client.user, message)) {
        replyToMessage(openai, client.user as ClientUser, message, db);
      }
    } catch (error) {
      print(error);
    }
  });
