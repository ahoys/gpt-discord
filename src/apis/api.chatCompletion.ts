import config from '../config';
import { OpenAIApi } from 'openai';
import { IModelConfiguration } from '..';
import {
  getContext,
  updateContextWithResponse,
} from '../utilities/utilities.memory';
import { Message } from 'discord.js';
import { print } from 'logscribe';

/**
 * Execute a chat completion.
 */
export const executeChatCompletion = (
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
        configuration.context
      ),
      n: 1,
      stream: false,
    })
    .then((response) => {
      if (response?.data?.choices) {
        const firstChoice = response.data.choices[0];
        if (typeof firstChoice.message?.content === 'string') {
          message.reply(firstChoice.message.content);
          updateContextWithResponse(
            id,
            message.author.id,
            firstChoice.message.content
          );
        } else {
          message.react('👎');
        }
      } else {
        message.react('👎');
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
