import config from '../../config';
import { ClientUser, Message } from 'discord.js';
import { IDiscordClient } from '../../types';
import { getMessageForMessages, splitString } from '../utilities.discord';

describe('splitString', () => {
  it('should split a string into chunks of "max" characters', () => {
    const str = 'Lorem ipsum dolor sit.';
    const expectedChunks = ['Lorem ipsum dolor si', 't.'];
    const actualChunks = splitString(str, 20);
    expect(actualChunks).toEqual(expectedChunks);
  });

  it('should handle empty strings', () => {
    const str = '';
    const expectedChunks: string[] = [];
    const actualChunks = splitString(str);
    expect(actualChunks).toEqual(expectedChunks);
  });

  it('should handle strings shorter than 2000 characters', () => {
    const str = 'Lorem ipsum dolor sit amet.';
    const expectedChunks = [str];
    const actualChunks = splitString(str);
    expect(actualChunks).toEqual(expectedChunks);
  });
});

describe('getMessageForMessages', () => {
  const client: IDiscordClient = {
    user: {
      id: 'abc',
    },
  } as IDiscordClient;
  const message: Message = {
    content: '<@1234> Hello world!',
    cleanContent: 'Hello world!',
    author: {
      id: '123',
      username: 'testuser',
    },
  } as Message;

  it('should return a ChatCompletionRequestMessage object', () => {
    const result = getMessageForMessages(client, message);
    expect(result).toHaveProperty('role');
    expect(result).toHaveProperty('name');
    expect(result).toHaveProperty('content');
  });

  it('should set the role to "assistant" if the message author is the client', () => {
    message.author.id = (client.user as ClientUser).id;
    const result = getMessageForMessages(client, message);
    expect(result?.role).toEqual('assistant');
  });

  it('should set the role to "user" if the message author is not the client', () => {
    message.author.id = '456';
    const result = getMessageForMessages(client, message);
    expect(result?.role).toEqual('user');
  });

  it('should truncate the content if it is longer than the max length', () => {
    const longContent = 'a'.repeat(3000);
    (message.cleanContent as string) = longContent;
    const result = getMessageForMessages(client, message);
    expect(result?.content.length).toEqual(config.discord.maxContentLength);
  });
});
