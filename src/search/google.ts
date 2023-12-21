import googlethis from 'googlethis';
import OpenAI from 'openai';
import { print } from 'logscribe';
import { TOpenAIMessage } from '../discord.handlers/handler.MessageCreate';

/**
 * Uses Google to search for an answer.
 * @param query The query to search for.
 * @param maxLength The maximum length of the answer.
 * @returns {Promise<string>} The answer.
 */
export const searchFromGoogle = async (
  query: string,
  maxLength = 1024,
  maxResults = 3
): Promise<
  | {
      meta: {
        url?: string;
      };
      message: TOpenAIMessage;
    }[]
  | undefined
> => {
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
        return [
          {
            meta: {},
            message: {
              role: 'user',
              content: response.knowledge_panel.description,
            },
          },
        ];
      } else if (typeof response.featured_snippet?.description === 'string') {
        return [
          {
            meta: {},
            message: {
              role: 'user',
              content: response.featured_snippet.description,
            },
          },
        ];
      } else if (Array.isArray(response.results)) {
        let messages: {
          meta: {
            url: string;
          };
          message: TOpenAIMessage;
        }[] = [];
        for (
          let index = 0;
          index < response.results.length && index < maxResults;
          index++
        ) {
          const element = response.results[index];
          if (
            typeof element.title === 'string' &&
            typeof element.description === 'string'
          ) {
            messages.push({
              meta: {
                url: element.url,
              },
              message: {
                role: 'user',
                content: (element.title + ': ' + element.description)
                  .substring(0, maxLength)
                  .trim(),
              },
            });
          }
        }
        return messages;
      }
    }
    return;
  } catch (error) {
    print(error);
  }
};
