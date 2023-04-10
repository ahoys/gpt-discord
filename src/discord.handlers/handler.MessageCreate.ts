import config from '../config';
import { ClientUser, Events, Guild, Message } from 'discord.js';
import { print } from 'logscribe';
import { IDatabase, IDiscordClient } from '../types';
import {
  ChatCompletionRequestMessage,
  CreateChatCompletionRequest,
  OpenAIApi,
} from 'openai';
import { getId, reply } from '../utilities/utilities.cmd';
import { executeChatCompletion } from '../openai.apis/api.chatCompletion';
import { getDynamicTemperature } from '../utilities/utilities.temperature';
import { addToMemory, getFromMemory } from '../memory/memory';
import { ChromaClient } from 'chromadb';

const MAX_REPLY_LENGTH = 1024; // The higher this goes, the more expensive is the query.
const MAX_REPLIES_TO_FETCH = 8; // Discord may buffer if too much is fetched at once.

const getFormedMessage = (
  user: ClientUser,
  message: Message,
  parse = false
): ChatCompletionRequestMessage => ({
  role: message.author.id === user.id ? 'assistant' : 'user',
  name: message.author.username,
  content: parse
    ? message.cleanContent.replace(`@${user.username} `, '').trim()
    : message.cleanContent,
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
const replyToMessage = async (
  openai: OpenAIApi,
  user: ClientUser,
  message: Message,
  db: IDatabase,
  chroma: ChromaClient
) => {
  try {
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
    // Add the message that triggered the reply.
    const currentMessage = getFormedMessage(user, message, true);
    messages.push(currentMessage);
    let hasMemories = false;
    // Extract memories to improve the reply.
    const memories = await getFromMemory(
      chroma,
      [currentMessage.content],
      (message.guild as Guild).id
    );
    if (Array.isArray(memories) && memories.length > 0) {
      hasMemories = true;
      for (const memory of memories) {
        messages.unshift(memory);
      }
    }
    if (messages.length < 1) return;
    // Finally, add the system message.
    const dbId = getId((message.guild as Guild).id, message.channel.id);
    const guildSystem = db.systems.getKey(dbId);
    if (guildSystem || config.openai.defaultSystem || hasMemories) {
      const memoryHelper = hasMemories
        ? 'Use previous messages as a memory. '
        : '';
      messages.unshift({
        role: 'system',
        name: user.username,
        content: (
          memoryHelper + guildSystem || (config.openai.defaultSystem as string)
        )
          .trim()
          .substring(0, 512),
      });
    }
    // Define configuration for the chat completion.
    const model = db.models.getKey(dbId) ?? config.openai.defaultModel;
    const temperature = getDynamicTemperature(
      db,
      dbId,
      !!lastReference,
      hasMemories
    );
    // Execute the chat completion.
    await executeChatCompletion(openai, {
      model,
      temperature,
      messages,
    })
      .then(async (response) => {
        // Reply to the message.
        const gptMessage = response.data.choices[0].message?.content;
        if (gptMessage) {
          await reply(message, gptMessage);
          // Update memories with new claims.
          // Do not include questions to save space.
          if (!currentMessage.content.includes('?')) {
            addToMemory(
              chroma,
              [message.id],
              [currentMessage.content],
              [
                {
                  role: 'user',
                  name: message.author.username,
                  temperature,
                  created: message.createdTimestamp,
                  guildId: (message.guild as Guild).id,
                  channelId: message.channel.id,
                  messageId: message.id,
                },
              ]
            );
          }
        }
      })
      .catch((error) => print(error?.message || error));
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
export default (
  client: IDiscordClient,
  openai: OpenAIApi,
  db: IDatabase,
  chroma: ChromaClient
) =>
  client.on(Events.MessageCreate, async (message) => {
    try {
      // For security reasons, only specific messages are allowed
      // to be read.
      if (messageReadingAllowed(client.user, message)) {
        replyToMessage(openai, client.user as ClientUser, message, db, chroma);
      }
    } catch (error) {
      print(error);
    }
  });
