import config from '../config';
import { OpenAIApi } from 'openai';
import {
  getContext,
  updateContextWithResponse,
} from '../utilities/utilities.memory';
import { Message } from 'discord.js';
import { print } from 'logscribe';
import { splitString } from '../utilities/utilities.discord';
import { IMemory, IModelConfiguration } from '../types';

let memory: IMemory = {};

/**
 * Execute a chat completion.
 */
export const executeChatCompletion = async (
  openai: OpenAIApi,
  message: Message,
  id: string,
  configuration: IModelConfiguration,
  content: string
) =>
  openai
    .createChatCompletion({
      model: configuration.model,
      temperature: configuration.temperature,
      max_tokens: config.openai.maxTokens,
      messages: getContext(
        id,
        message.author.id,
        content,
        configuration.context,
        memory
      ),
      n: 1,
      stream: false,
    })
    .then(async (response) => {
      if (response?.data?.choices) {
        const firstChoice = response.data.choices[0];
        if (typeof firstChoice.message?.content === 'string') {
          const msg = firstChoice.message?.content;
          if (msg.length >= 2000) {
            // Maximum reply length is 2000 characters.
            const splits = splitString(msg);
            for (const part of splits) {
              await message.channel.send(part).catch((error) => print(error));
            }
          } else {
            message.reply(msg).catch((error) => print(error));
          }
          updateContextWithResponse(
            id,
            message.author.id,
            firstChoice.message.content,
            memory
          );
        } else {
          message.react('👎').catch((error) => print(error));
        }
      } else {
        message.react('👎').catch((error) => print(error));
      }
    })
    .catch((error) => {
      message.react('🛑');
      print({
        message: error?.message,
        configuration,
        content,
      });
    });
