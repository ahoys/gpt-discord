import config from '../config';
import { Events } from 'discord.js';
import { print } from 'logscribe';
import { IDatabase, IDiscordClient } from '../types';
import { CreateChatCompletionRequest, OpenAIApi } from 'openai';
import { getId, reply } from '../utilities/utilities.cmd';
import { executeChatCompletion } from '../openai.apis/api.chatCompletion';
import {
  getFirstReference,
  getMessageForMessages,
} from '../utilities/utilities.discord';
import { getSystemMessage } from '../utilities/utilities.system';
import { putToShortTermMemory } from '../utilities/utilities.shortTermMemory';
import { getDynamicTemperature } from '../utilities/utilities.temperature';

/**
 * Handle incoming messages.
 * If the message mentions the bot, reply with a chat completion.
 */
export default (client: IDiscordClient, openai: OpenAIApi, db: IDatabase) =>
  client.on(Events.MessageCreate, async (message) => {
    try {
      const { user } = client;
      const { guild, channel } = message;
      if (!user || !guild || !channel) return;
      if (!message.content?.trim().length) return;
      if (
        !message.mentions.has(user) &&
        !message.content.includes(`@<${user.id}>`)
      )
        return;
      if (message.author.bot) return;
      if (db.paused) return;
      const isReply = message.reference?.messageId !== undefined;
      // There's a bug in typings of fetch, which is why any is used.
      const reference = isReply
        ? await channel.messages.fetch(message.reference?.messageId as any)
        : undefined;
      const firstReference = reference
        ? await getFirstReference(reference)
        : undefined;
      const dbId = getId(guild?.id, channel.id);
      // Generate a context.
      const messages: CreateChatCompletionRequest['messages'] = [];
      if (firstReference) {
        const msg = getMessageForMessages(client, firstReference);
        if (msg) messages.push(msg);
      }
      if (reference) {
        const msg = getMessageForMessages(client, reference);
        if (msg) messages.push(msg);
      }
      if (message?.author) {
        const msg = getMessageForMessages(client, message);
        if (msg) messages.push(msg);
      }
      if (!messages.length) return;
      const system = await getSystemMessage(client, openai, db, dbId, message);
      putToShortTermMemory(openai, db, message, client.user?.username);
      if (system) messages.unshift(system);
      // Send request to OpenAI.
      executeChatCompletion(openai, {
        model: db.models.getKey(dbId) ?? config.openai.defaultModel,
        temperature: getDynamicTemperature(db, dbId, message),
        messages,
      }).then(async (response) => {
        const content = response.data.choices[0].message?.content;
        if (content) {
          await reply(message, content);
        } else {
          print('No response.');
        }
      });
    } catch (error) {
      print(error);
    }
  });
