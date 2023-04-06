import config from '../config';
import { ChatCompletionRequestMessage, OpenAIApi } from 'openai';
import { IDatabase, IDiscordClient } from '../types';
import { getFromShortTermMemory } from './utilities.shortTermMemory';
import { Message } from 'discord.js';

/**
 * Adds a string to another string with a space in between.
 * @param str Base string.
 * @param addition String to add.
 * @returns The combined string.
 */
const addToStr = (str: string, addition: string): string =>
  str.length ? str + ' ' + addition : addition;

/**
 * Returns a formatted system message that is used to
 * improve the chat completion.
 */
export const getSystemMessage = async (
  discordClient: IDiscordClient,
  openai: OpenAIApi,
  db: IDatabase,
  dbId: string,
  message?: Message
): Promise<ChatCompletionRequestMessage | void> => {
  let str = '';
  // Add the default or user-defined system message.
  const storedSystem =
    db.systems.getKey(dbId) ?? config.openai.defaultSystem ?? '';
  if (storedSystem) str = addToStr(str, storedSystem);
  // Add the bot's username so that the bot would understand when he's mentioned.
  if (config.openai.tune.appendUsernameToSystem) {
    const username = discordClient.user?.username;
    str = addToStr(str, `Your nickname is @${username}.`);
  }
  // Add prompt that improves math.
  if (config.openai.tune.appendStepsToImproveMath)
    str = addToStr(str, `Use steps if applicable.`);
  // Add prompt that improves context.
  if (config.openai.tune.appendMemoryToContext && message) {
    const fact = await getFromShortTermMemory(openai, db, message);
    if (fact) addToStr(str, `Use Context: ${fact} ###`);
  }
  // Return only if there's a system message to save tokens.
  return str.length ? { role: 'system', content: str.trim() } : undefined;
};
