import compute_cosine_similarity from 'compute-cosine-similarity';
import OpenAI from 'openai';
import axios from 'axios';
import config from '../config';
import { searchFromDuckDuckGo } from './duckduckgo';
import { searchFromGoogle } from './google';
import { executeEmbedding } from '../openai.apis/api.createEmbedding';
import { print } from 'logscribe';
import { TOpenAIMessage } from '../discord.handlers/handler.MessageCreate';

/**
 * Will search the web for answers.
 * @param query The query to search for.
 * @param maxLength The maximum length of the answer.
 * @param maxInDepthMultiplier Multipliers for answers that are certainly facts.
 * @returns {Promise<string>} The answer.
 */
export const searchTheWebForAnswers = async (
  openai: OpenAI,
  vector: number[],
  query: string,
  maxLength = 512,
  maxInDepthMultiplier = 8
): Promise<TOpenAIMessage[] | undefined> => {
  try {
    if (maxLength < 1) return;
    const includesQuestion = query.includes('?');
    const messages: TOpenAIMessage[] = [];
    // First search from DuckDuckGo.
    const ddg =
      includesQuestion && config.search.ddgEnabled
        ? await searchFromDuckDuckGo(query, maxLength)
        : undefined;
    if (ddg) {
      messages.push(ddg);
      return messages;
    }
    // Then search from Google.
    const google =
      includesQuestion && config.search.googleEnabled
        ? await searchFromGoogle(query, maxLength, 6)
        : undefined;
    if (google && google.length) {
      // To make AI not claim something silly about future events.
      messages.push({
        role: 'assistant',
        content: new Date().toString(),
      });
      const googleResults: {
        similarity: number;
        message: TOpenAIMessage;
      }[] = [];
      for (const googleObject of google) {
        if (
          config.stackoverflow.key &&
          googleObject.meta.url?.startsWith(
            'https://stackoverflow.com/questions'
          )
        ) {
          const idRegex = /\/questions\/(\d+)\//;
          const match = googleObject.meta.url.match(idRegex);
          const questionId = match ? match[1] : null;
          const answers = await axios.get(
            `https://api.stackexchange.com/${config.stackoverflow.api}/questions/${questionId}/answers?key=${config.stackoverflow.key}&site=stackoverflow&filter=!.(5GpzDNEH9`
          );
          if (Array.isArray(answers?.data?.items)) {
            interface ISOItem {
              score: number;
              body: string;
            }
            const highestScoreObject = answers?.data?.items.reduce(
              (prev: ISOItem, current: ISOItem) =>
                prev.score > current.score ? prev : current
            );
            if (highestScoreObject) {
              googleResults.push({
                similarity: 1,
                message: {
                  role: 'user',
                  content: highestScoreObject.body
                    ?.replace(/<\/?[^>]+(>|$)/g, '')
                    .substring(0, maxLength * maxInDepthMultiplier),
                },
              });
            }
          }
        } else if (typeof googleObject.message.content === 'string') {
          const similarity = compute_cosine_similarity(
            await executeEmbedding(openai, googleObject.message.content),
            vector
          );
          googleResults.push({
            similarity,
            message: googleObject.message,
          });
        }
      }
      googleResults.sort((a, b) => b.similarity - a.similarity);
      const googleMessages = googleResults.map((gr) => gr.message).slice(0, 2);
      messages.concat(googleMessages);
    }
    if (messages.length) {
      messages.push({
        role: 'user',
        content: 'Attempt to use the information given.',
      });
    }
    return messages;
  } catch (error) {
    print(error);
  }
};
