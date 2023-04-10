import config from '../config';
import { IDatabase } from '../types';

const MEMORY_TEMPERATURE_MULPLIER = 0.2;
const CONTEXT_TEMPERATURE_MULPLIER = 0.8;

/**
 * Returns the temperature to use for the chat completion.
 * @param db Database.
 * @param dbId Database entry ID.
 * @param hasContext Lower the temperature if the message has context.
 * @param hasMemory Lower the temperature if the message has memory.
 * @returns The temperature to use.
 */
export const getDynamicTemperature = (
  db: IDatabase,
  dbId: string,
  hasContext: boolean,
  hasMemory: boolean
): number => {
  let storedTemperature =
    db.temperatures.getKey(dbId) ?? config.openai.defaultTemperature;
  if (!config.openai.tune.useDynamicTemperature) return storedTemperature;
  if (hasContext) {
    storedTemperature *= CONTEXT_TEMPERATURE_MULPLIER;
  }
  if (hasMemory) {
    storedTemperature *= MEMORY_TEMPERATURE_MULPLIER;
  }
  return storedTemperature ?? config.openai.defaultTemperature;
};
