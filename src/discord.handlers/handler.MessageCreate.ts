import config from '../config';
import { Events } from 'discord.js';
import { print } from 'logscribe';
import { IDatabase, IDiscordClient, IModelConfiguration } from '../types';
import { executeChatCompletion } from '../openai.apis/api.chatCompletion';
import { OpenAIApi } from 'openai';
import { getId } from '../utilities/utilities.cmd';

/**
 * Handle incoming messages.
 * If the message mentions the bot, reply with a chat completion.
 */
export default (client: IDiscordClient, openai: OpenAIApi, db: IDatabase) =>
  client.on(Events.MessageCreate, async (message) => {
    try {
      if (client?.user) {
        const channel = message?.channel;
        if (!message.guild) return;
        if (!message.mentions.has(client.user)) return;
        if (message.author.bot) return;
        if (!channel) return;
        const content = message.content?.replace(/<@\d+>\s/, '');
        if (typeof content !== 'string') {
          print('Content is not a string.');
          message.react('🛑').catch((error) => print(error));
        } else if (content.length <= 2) {
          print('Content is too short.');
          message.react('👎').catch((error) => print(error));
        } else if (content.length >= config.openai.maxContentLength) {
          print('Content is too long.');
          message.react('👎').catch((error) => print(error));
        } else {
          const id = getId(message.guild.id, channel.id);
          db.channels.findOne({ channel: id }, (err, doc) => {
            if (err) {
              print(err);
              message.react('🛑').catch((error) => print(error));
            } else {
              // Build configuration for the channel.
              const configuration: IModelConfiguration = {
                model: doc?.model ?? config.openai.defaultModel,
                context: doc?.length ?? config.openai.defaultContext,
                temperature:
                  doc?.temperature !== undefined
                    ? Number(doc.temperature)
                    : config.openai.defaultTemperature,
              };
              // Send request to OpenAI.
              executeChatCompletion(
                openai,
                message,
                id,
                configuration,
                content
              );
            }
          });
        }
      }
    } catch (error) {
      print(error);
    }
  });
