import config from '../config';
import { Message } from 'discord.js';
import { IDatabase } from '../types';

const QUESTION_TEMPERATURE = 0.1;
const CONTEXT_TEMPERATURE = 0.4;

/**
 * Returns the temperature to use for the chat completion.
 * @param db Database.
 * @param dbId Database entry ID.
 * @param useContext Adjust the temperature based on the context.
 * @param message Discord Message that triggered the chat completion.
 * @returns The temperature to use.
 */
export const getDynamicTemperature = (
  db: IDatabase,
  dbId: string,
  useContext: boolean,
  message?: Message
): number => {
  const storedTemperature = db.temperatures.getKey(dbId);
  if (!config.openai.tune.useDynamicTemperature)
    return storedTemperature ?? config.openai.defaultTemperature;
  if (message && message.content.includes('?')) {
    if (!storedTemperature) return QUESTION_TEMPERATURE;
    return storedTemperature < QUESTION_TEMPERATURE
      ? storedTemperature
      : QUESTION_TEMPERATURE;
  }
  if (useContext) {
    if (!storedTemperature) return CONTEXT_TEMPERATURE;
    return storedTemperature < CONTEXT_TEMPERATURE
      ? storedTemperature
      : CONTEXT_TEMPERATURE;
  }
  return storedTemperature ?? config.openai.defaultTemperature;
};
