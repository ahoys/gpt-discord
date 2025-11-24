import config from '../config';
import OpenAI from 'openai';

/**
 * Execute moderation.
 * @param openai OpenAI instance.
 * @param text Text to moderate.
 * @returns {Promise<OpenAI.Moderations.Moderation>} The moderation.
 */
export const executeModeration = async (openai: OpenAI, text: string) =>
  openai.moderations.create({
    model: config.moderation.model,
    input: text,
  });
