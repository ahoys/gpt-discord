import axios from 'axios';
import OpenAI from 'openai';
import { print } from 'logscribe';

/**
 * Uses DuckDuckGo to search for an answer.
 * @param query The query to search for.
 * @param maxLength The maximum length of the answer.
 * @returns {Promise<string>} The answer.
 */
export const searchFromDuckDuckGo = async (
  query: string,
  maxLength = 1024
): Promise<OpenAI.Chat.Completions.ChatCompletionMessage | undefined> => {
  try {
    const result = await axios.get<{
      Abstract: string;
      AbstractSource: string;
      Type: string;
    }>(
      `https://api.duckduckgo.com/?format=json&q=${encodeURIComponent(query)}`
    );
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
        content: content.substring(0, maxLength).trim(),
      };
    }
    return;
  } catch (error) {
    print(error);
    return;
  }
};
