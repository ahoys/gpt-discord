import config from '../config';
import { Message } from 'discord.js';
import { IDatabase } from '../types';

const QUESTION_TEMPERATURE = 0.1;

/**
 * Returns the temperature to use for the chat completion.
 * @param db Database.
 * @param dbId Database entry ID.
 * @param message Discord Message that triggered the chat completion.
 * @returns The temperature to use.
 */
export const getDynamicTemperature = (
  db: IDatabase,
  dbId: string,
  message?: Message
) => {
  const storedTemperature = db.temperatures.getKey(dbId);
  if (
    config.openai.tune.useDynamicTemperature &&
    message &&
    message.content.endsWith('?')
  ) {
    if (!storedTemperature) return QUESTION_TEMPERATURE;
    return storedTemperature < 0.1 ? storedTemperature : QUESTION_TEMPERATURE;
  }
  return storedTemperature ?? config.openai.defaultTemperature;
};
