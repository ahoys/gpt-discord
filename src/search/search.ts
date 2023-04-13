import compute_cosine_similarity from 'compute-cosine-similarity';
import { ChatCompletionRequestMessage, OpenAIApi } from 'openai';
import { searchFromDuckDuckGo } from './duckduckgo';
import { searchFromGoogle } from './google';
import { executeEmbedding } from '../openai.apis/api.createEmbedding';
import { print } from 'logscribe';

/**
 * Will search the web for answers.
 * @param query The query to search for.
 * @param maxLength The maximum length of the answer.
 * @returns {Promise<string>} The answer.
 */
export const searchTheWebForAnswers = async (
  openai: OpenAIApi,
  vector: number[],
  query: string,
  maxLength = 512
): Promise<ChatCompletionRequestMessage[] | undefined> => {
  try {
    if (maxLength < 1) return;
    const messages: ChatCompletionRequestMessage[] = [];
    // First search from DuckDuckGo.
    const ddg = await searchFromDuckDuckGo(query, maxLength);
    if (ddg) {
      messages.push(ddg);
      return messages;
    }
    // Then search from Google.
    const google = await searchFromGoogle(query, maxLength);
    if (google && google.length) {
      // To make AI not claim something silly about future events.
      if (google.find((g) => g.name !== 'Date_and_Time')) {
        messages.push({
          role: 'assistant',
          name: 'Date_and_Time',
          content: new Date().toString(),
        });
      }
      const googleResults: {
        similarity: number;
        message: ChatCompletionRequestMessage;
      }[] = [];
      for (const message of google) {
        const similarity = compute_cosine_similarity(
          await executeEmbedding(openai, message.content),
          vector
        );
        googleResults.push({
          similarity,
          message,
        });
      }
      googleResults.sort((a, b) => b.similarity - a.similarity);
      const googleMessages = googleResults.map((gr) => gr.message);
      return googleMessages.concat(messages);
    }
  } catch (error) {
    print(error);
  }
};
