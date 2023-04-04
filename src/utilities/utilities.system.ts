import config from '../config';
import { ChatCompletionRequestMessage, OpenAIApi } from 'openai';
import { IDatabase } from '../types';
import { getFromShortTermMemory } from './utilities.shortTermMemory';
import { Message } from 'discord.js';

export const getSystemMessage = async (
  openai: OpenAIApi,
  db: IDatabase,
  dbId: string,
  message: Message
): Promise<ChatCompletionRequestMessage | void> => {
  let str = '';
  const storedSystem =
    db.systems.getKey(dbId) ?? config.openai.defaultSystem ?? '';
  if (storedSystem) str += storedSystem;
  const mathExtension = config.openai.improvedMath
    ? 'Use steps if applicable.'
    : '';
  if (mathExtension) str += str.length ? ' ' + mathExtension : mathExtension;
  const fact = await getFromShortTermMemory(openai, db, message);
  if (fact)
    str += str.length ? ' Remember that ' + fact : 'Remember that ' + fact;
  return str.length ? { role: 'system', content: str.trim() } : undefined;
};
