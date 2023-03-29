import config from '../config';
import { Events } from 'discord.js';
import { print } from 'logscribe';
import { IDatabase, IDiscordClient } from '../types';
import { CreateChatCompletionRequest, OpenAIApi } from 'openai';
import { getId } from '../utilities/utilities.cmd';
import { executeChatCompletion } from '../openai.apis/api.chatCompletion';

/**
 * Handle incoming messages.
 * If the message mentions the bot, reply with a chat completion.
 */
export default (client: IDiscordClient, openai: OpenAIApi, db: IDatabase) =>
  client.on(Events.MessageCreate, async (message) => {
    try {
      const user = client?.user;
      const channel = message?.channel;
      if (!user) return;
      if (!message.guild) return;
      if (!message.mentions.has(user)) return;
      if (message.author.bot) return;
      if (!channel) return;
      if (db.paused) return;
      const isReply = message.reference?.messageId !== undefined;
      // There's a bug in typings of fetch, which is why any is used.
      const reference = isReply
        ? await channel.messages.fetch(message.reference?.messageId as any)
        : undefined;
      const referenceUser = reference
        ? await channel.messages.fetch(reference.reference?.messageId as any)
        : undefined;
      const referenceContent = reference?.content;
      const referenceUserContent = referenceUser?.content.replace(
        /<@\d+>\s/,
        ''
      );
      const content = message.content?.replace(/<@\d+>\s/, '');
      if (typeof content !== 'string' || !content.trim()) return;
      if (content.length > config.discord.maxContentLength) return;
      const id = getId(message.guild.id, channel.id);
      db.channels.findOne({ channel: id }, (err, doc) => {
        if (err) {
          print(err);
          message.react('🛑').catch((error) => print(error));
        } else {
          // Generate a context.
          const messages: CreateChatCompletionRequest['messages'] = [];
          if (config.openai.system) {
            messages.push({
              role: 'system',
              content: config.openai.system,
            });
          }
          if (referenceUserContent?.trim()) {
            messages.push({
              role: 'user',
              content: referenceUserContent,
            });
          }
          if (referenceContent?.trim()) {
            messages.push({
              role: 'assistant',
              content: referenceContent,
            });
          }
          messages.push({
            role: 'user',
            content,
          });
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
