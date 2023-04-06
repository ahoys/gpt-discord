import config from '../config';
import { ChatCompletionRequestMessage } from 'openai';
import { IDatabase, IDiscordClient } from '../types';

/**
 * Adds a string to another string with a space in between.
 * @param str Base string.
 * @param addition String to add.
 * @returns The combined string.
 */
const addToStr = (str: string, addition: string): string =>
  str.length ? str + ' ' + addition : addition;

/**
 * Returns a formatted system message that is used to
 * improve the chat completion.
 */
export const getSystemMessage = async (
  discordClient: IDiscordClient,
  db: IDatabase,
  dbId: string,
  useContext: boolean
): Promise<ChatCompletionRequestMessage | void> => {
  let str = '';
  // Add the default or user-defined system message.
  const storedSystem =
    db.systems.getKey(dbId) ?? config.openai.defaultSystem ?? '';
  if (storedSystem) str = addToStr(str, storedSystem);
  // Reinforce answering based on the context.
  if (useContext) {
    str = addToStr(
      str,
      'Answer using the user messages as a context. Answer using the user language if applicable.'
    );
    return { role: 'system', content: str.trim() };
  }
  // Add the bot's username so that the bot would understand when he's mentioned.
  if (config.openai.tune.appendUsernameToSystem) {
    const username = discordClient.user?.username;
    str = addToStr(str, `Your nickname is @${username}.`);
  }
  // Add prompt that improves math.
  if (config.openai.tune.appendStepsToImproveMath)
    str = addToStr(str, `Use steps if applicable.`);
  // Return only if there's a system message to save tokens.
  return str.length ? { role: 'system', content: str.trim() } : undefined;
};
