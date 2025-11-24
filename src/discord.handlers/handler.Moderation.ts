import config from '../config';
import OpenAI from 'openai';
import { ClientUser, Events, GuildMemberRoleManager, Message } from 'discord.js';
import { print } from 'logscribe';
import { ICmdProps, IDatabase, IDiscordClient } from '../types';
import { isReplyRequested, messageReadingAllowed, replyToMessage } from './handler.MessageCreate';

/**
 * Analyze the message and determine if it requires moderation.
 * @param message The message to analyze.
 * @returns True if the message requires moderation, false otherwise.
 */
const moderationRequired = (message: Message): boolean => {
    try {
        return false;
    } catch (error) {
        print(error);
        return false;
    }
};

/**
 * Handle incoming messages.
 * If moderation is required, reply with a chat completion.
 */
export default (client: IDiscordClient, openai: OpenAI, db: IDatabase) =>
    client.on(Events.MessageCreate, async (message) => {
        try {
            // For security reasons, only specific messages are allowed
            // to be read.
            if (messageReadingAllowed(client.user, message, false) && moderationRequired(message)) {
                replyToMessage(openai, client.user as ClientUser, message, db);
            }
        } catch (error) {
            print(error);
        }
    });