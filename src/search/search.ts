import axios from 'axios';
import config from '../config';
import { print } from 'logscribe';
import { ChatCompletionRequestMessage } from 'openai';

let previousCalls: number[] = [];

/**
 * Return true if there has been less than 100 calls in the last 24 hours.
 */
export const canCall = (): boolean => {
  const currentTime = new Date().getTime();
  // Remove the calls that are older than 24 hours.
  const expired = previousCalls
    .filter((call) => call > currentTime - 86400000)
    .map((_, i) => i);
  previousCalls.splice(expired[0], expired.length);
  const calls = previousCalls.filter((call) => call > currentTime - 86400000);
  if (calls.length < config.google.maxCallsPerDay) {
    calls.push(currentTime);
    previousCalls = calls;
    return true;
  }
  return false;
};

/**
 * Use Google Custom Search to search for a snippet.
 * @param query The query to search for.
 * @returns {Promise<string>} The snippet.
 */
export const searchSnippetsToMessages = async (
  query: string
): Promise<ChatCompletionRequestMessage[] | undefined> => {
  try {
    if (!config.google.customSearchApiKey) return;
    if (config.google.maxCallsPerDay <= 0) return;
    if (!canCall()) return;
    const result = await axios.get<{
      items: {
        snippet: string;
      }[];
    }>(
      `https://www.googleapis.com/customsearch/v1?key=${
        config.google.customSearchApiKey
      }&cx=${config.google.cx}&q=${encodeURIComponent(
        query
      )}&fields=items(snippet)`
    );
    if (
      typeof result?.data === 'object' &&
      Array.isArray(result.data.items) &&
      typeof result.data.items[0] === 'object' &&
      typeof result.data.items[0].snippet === 'string'
    ) {
      const messages: ChatCompletionRequestMessage[] = [];
      for (
        let index = 0;
        index < result.data.items.length && index < 3;
        index++
      ) {
        const item = result.data.items[index];
        messages.push({
          role: 'assistant',
          name: 'Google',
          content: item.snippet.trim(),
        });
      }
      return messages;
    }
    return;
  } catch (error) {
    print(error);
    return;
  }
};

/**
 * Uses DuckDuckGo to search for an answer.
 * @param query The query to search for.
 * @param maxLength The maximum length of the answer.
 * @returns {Promise<string>} The answer.
 */
export const searchAnswersToMessages = async (
  query: string,
  maxLength = 512
): Promise<ChatCompletionRequestMessage | undefined> => {
  try {
    const result = await axios.get<{
      Abstract: string;
      AbstractSource: string;
      Type: string;
    }>(
      `https://api.duckduckgo.com/?format=json&q=${encodeURIComponent(query)}`
    );
    console.log(result.data?.AbstractSource, result.data?.Type);
    if (
      typeof result?.data === 'object' &&
      typeof result.data.Abstract === 'string' &&
      typeof result.data.AbstractSource === 'string' &&
      typeof result.data.Type === 'string' &&
      ['A', 'B'].includes(result.data.Type)
    ) {
      // Pick 4 first sentences.
      const sentences = result.data.Abstract.split('.');
      const content = sentences.slice(0, 4).join('. ').trim();
      return {
        role: 'assistant',
        name: result.data.AbstractSource,
        content: content.substring(0, maxLength).trim(),
      };
    }
    return;
  } catch (error) {
    print(error);
    return;
  }
};
