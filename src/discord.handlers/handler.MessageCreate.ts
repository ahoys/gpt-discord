import config from '../config';
import { ClientUser, Events, Message } from 'discord.js';
import { print } from 'logscribe';
import { IDatabase, IDiscordClient } from '../types';
import { CreateChatCompletionRequest, OpenAIApi } from 'openai';
import { getId } from '../utilities/utilities.cmd';
import { executeChatCompletion } from '../openai.apis/api.chatCompletion';
import {
  getFirstReference,
  getMessageForMessages,
} from '../utilities/utilities.discord';
import { getSystemMessage } from '../utilities/utilities.picard';

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
      if (!message.mentions.has(user)) return;
      if (message.author.bot) return;
      const isReply = message.reference?.messageId !== undefined;
      // There's a bug in typings of fetch, which is why any is used.
      const reference = isReply
        ? await channel.messages.fetch(message.reference?.messageId as any)
        : undefined;
      const firstReference = reference
        ? await getFirstReference(reference)
        : undefined;
      const dbId = getId(guild?.id, channel.id);
      db.channels.findOne({ channel: dbId }, (err, doc) => {
        if (err) {
          print(err);
          message.react('🛑').catch((error) => print(error));
        } else {
          // Generate a context.
          const messages: CreateChatCompletionRequest['messages'] = [];
          messages.push({
            role: 'system',
            content: getSystemMessage(),
          });
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
          // Send request to OpenAI.
          executeChatCompletion(
            openai,
            {
              model: doc?.model ?? config.openai.defaultModel,
              temperature:
                doc?.temperature !== undefined
                  ? Number(doc.temperature)
                  : config.openai.defaultTemperature,
              messages,
            },
            (response) => message.reply(response),
            (error) => {
              print(error);
              message.react('🤷').catch((error) => print(error));
            }
          );
        }
      });
    } catch (error) {
      print(error);
    }
  });
