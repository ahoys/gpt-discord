import googlethis from 'googlethis';
import { print } from 'logscribe';
import { ChatCompletionRequestMessage } from 'openai';

/**
 * Uses Google to search for an answer.
 * @param query The query to search for.
 * @param maxLength The maximum length of the answer.
 * @returns {Promise<string>} The answer.
 */
export const searchFromGoogle = async (
  query: string,
  maxLength = 512
): Promise<ChatCompletionRequestMessage | undefined> => {
  try {
    const options = {
      page: 0,
      safe: true, // Safe Search
      parse_ads: true,
      additional_params: {
        hl: 'en',
      },
    };
    const response = await googlethis.search(query, options);
    if (typeof response === 'object' && Array.isArray(response.results)) {
      if (typeof response.knowledge_panel?.description === 'string') {
        return {
          role: 'assistant',
          name: 'Google',
          content: response.knowledge_panel.description,
        };
      } else if (typeof response.featured_snippet?.description === 'string') {
        return {
          role: 'assistant',
          name: 'Google',
          content: response.featured_snippet.description,
        };
      } else if (response.time.date) {
        return {
          role: 'assistant',
          name: 'Date_and_Time',
          content: new Date().toString(),
        };
      } else if (response.results[0]?.description) {
        return {
          role: 'assistant',
          name: 'Google',
          content: response.results[0].description
            .substring(0, maxLength)
            .trim(),
        };
      }
    }
    return;
  } catch (error) {
    print(error);
  }
};
