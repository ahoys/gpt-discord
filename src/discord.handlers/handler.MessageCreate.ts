import config from '../config';
import { ClientUser, Events, Message } from 'discord.js';
import { print } from 'logscribe';
import { IDatabase, IDiscordClient } from '../types';
import {
  ChatCompletionRequestMessage,
  CreateChatCompletionRequest,
  OpenAIApi,
} from 'openai';
import { getId, reply } from '../utilities/utilities.cmd';
import { executeChatCompletion } from '../openai.apis/api.chatCompletion';
import {
  getFirstReference,
  getMessageForMessages,
} from '../utilities/utilities.discord';
import { getSystemMessage } from '../utilities/utilities.system';
import { getMemoryMessages } from '../utilities/utilities.shortTermMemory';
import { getDynamicTemperature } from '../utilities/utilities.temperature';
import { addToMemory } from '../memory/memory';

const MAX_REPLY_LENGTH = 1024; // The higher this goes, the more expensive is the query.
const MAX_REPLIES_TO_FETCH = 8; // Discord may buffer if too much is fetched at once.

const getFormedMessage = (
  user: ClientUser,
  message: Message
): ChatCompletionRequestMessage => ({
  role: message.author.id === user.id ? 'assistant' : 'user',
  name: message.author.username,
  content: message.cleanContent,
});

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
 * Use OpenAI Chat Completion to reply to a message.
 * @param message
 */
const replyToMessage = async (user: ClientUser, message: Message) => {
  // See if the message is a reply to another message.
  // That another message may contain information about the context.
  const messages: CreateChatCompletionRequest['messages'] = [];
  let lastReference: ChatCompletionRequestMessage | undefined;
  let totalLength = 0;
  let safeLimit = MAX_REPLIES_TO_FETCH;
  let previousReference: Message | undefined = await getReference(message);
  if (previousReference) {
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
        if (totalLength + formedMessage.content.length < MAX_REPLY_LENGTH) {
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
  // Finally, add the message that triggered the reply.
  messages.push(getFormedMessage(user, message));
  console.log(messages);
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
    if (message.cleanContent?.trim().length > 2000) return false;
    if (
      !message.mentions.has(user) &&
      !message.content.includes(`@<${user.id}>`)
    ) {
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
export default (client: IDiscordClient, openai: OpenAIApi, db: IDatabase) =>
  client.on(Events.MessageCreate, async (message) => {
    try {
      // For security reasons, only specific messages are allowed
      // to be read.
      if (messageReadingAllowed(client.user, message)) {
        replyToMessage(client.user as ClientUser, message);
      }
      // const isReply = message.reference?.messageId !== undefined;
      // // There's a bug in typings of fetch, which is why any is used.
      // const reference = isReply
      //   ? await channel.messages.fetch(message.reference?.messageId as any)
      //   : undefined;
      // const firstReference = reference
      //   ? await getFirstReference(reference)
      //   : undefined;
      // const dbId = getId(guild?.id, channel.id);
      // // Generate a context.
      // let messages: CreateChatCompletionRequest['messages'] = [];
      // const memory = await getMemoryMessages(openai, db, message.content);
      // messages = messages.concat(memory);
      // if (firstReference) {
      //   const msg = getMessageForMessages(client, firstReference);
      //   if (msg) messages.push(msg);
      // }
      // if (reference) {
      //   const msg = getMessageForMessages(client, reference);
      //   if (msg) messages.push(msg);
      // }
      // if (message?.author) {
      //   const msg = getMessageForMessages(client, message);
      //   if (msg) messages.push(msg);
      // }
      // if (!messages.length) return;
      // const system = await getSystemMessage(
      //   client,
      //   db,
      //   dbId,
      //   memory.length > 1
      // );
      // if (system) messages.unshift(system);
      // // Send request to OpenAI.
      // executeChatCompletion(openai, {
      //   model: db.models.getKey(dbId) ?? config.openai.defaultModel,
      //   temperature: getDynamicTemperature(
      //     db,
      //     dbId,
      //     memory.length > 1,
      //     message
      //   ),
      //   messages,
      // }).then(async (response) => {
      //   const content = response.data.choices[0].message?.content;
      //   if (content) {
      //     await reply(message, content);
      //     // After everything, memorize what has happened.
      //     const now = Date.now();
      //     addToMemory(
      //       ['user-' + now, 'bot-' + now],
      //       [message.cleanContent, content],
      //       []
      //     );
      //   } else {
      //     print('No response.');
      //   }
      // });
    } catch (error) {
      print(error);
    }
  });
