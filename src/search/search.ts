import { ChatCompletionRequestMessage } from 'openai';
import { searchFromDuckDuckGo } from './duckduckgo';
import { searchFromGoogle } from './google';

/**
 * Will search the web for answers.
 * @param query The query to search for.
 * @param maxLength The maximum length of the answer.
 * @returns {Promise<string>} The answer.
 */
export const searchTheWebForAnswers = async (
  query: string,
  maxLength = 512
): Promise<ChatCompletionRequestMessage[] | undefined> => {
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
  if (google) {
    messages.push(google);
    return messages;
  }
};
