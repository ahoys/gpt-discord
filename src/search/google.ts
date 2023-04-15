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
  maxLength = 1024,
  maxResults = 3
): Promise<
  | {
      meta: {
        url?: string;
      };
      message: ChatCompletionRequestMessage;
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
              name: 'Google_fact',
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
              name: 'Google_fact',
              content: response.featured_snippet.description,
            },
          },
        ];
      } else if (response.time.date) {
        return [
          {
            meta: {},
            message: {
              role: 'assistant',
              name: 'Date_and_Time',
              content: new Date().toString(),
            },
          },
        ];
      } else if (Array.isArray(response.results)) {
        let messages: {
          meta: {
            url: string;
          };
          message: ChatCompletionRequestMessage;
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
                name: 'Google_result',
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
