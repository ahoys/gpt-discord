import fs from 'fs';
import path from 'path';
import config from '../config';
import { print } from 'logscribe';
import { IDiscordClient } from '../types';
import { ChatInputCommandInteraction, Message, TextChannel } from 'discord.js';

/**
 * Returns a unique ID for a guild-channel combination.
 * @param guild Id of Guild.
 * @param channel Id of Channel.
 * @returns A unique ID for a guild-channel combination.
 */
export const getId = (guild: string, channel: string) => `${guild}-${channel}`;

/**
 * Loads all commands from the given directory.
 * @param commands Existing commands Collection.
 * @param dirPath Path to commands directory.
 * @returns A Collection of commands.
 */
export const getDynamicCommands = (
  commands: IDiscordClient['commands'],
  dirPath: string
): IDiscordClient['commands'] => {
  const filenames = fs.readdirSync(dirPath);
  for (const filename of filenames) {
    const file = require(path.join(dirPath, filename));
    if (
      'name' in file &&
      'data' in file &&
      'execute' in file &&
      !config.discord.ignoreCommands.includes(file.name) &&
      typeof file.name === 'string' &&
      typeof file.data === 'object' &&
      typeof file.execute === 'function'
    ) {
      print(`Loaded /${file.name}`);
      commands.set(file.name, {
        name: file.name,
        data: file.data,
        execute: file.execute,
      });
    } else {
      print(`Ignored /${filename}`);
    }
  }
  return commands;
};

/**
 * Sends a message to a channel.
 * @param channel Target channel.
 * @param content Message to be sent.
 */
export const sendToChannel = async (channel: TextChannel, content: string) =>
  await channel.send(content).catch((error) => print(error));

/**
 * Edits a deferred reply.
 * @param interaction Discord interaction.
 * @param content Message to be sent.
 */
export const editReply = async (
  interaction: ChatInputCommandInteraction,
  content: string
) => {
  if (content.length < 2000) {
    await interaction
      .editReply({
        content,
      })
      .catch((error) => print(error));
  } else {
    const buffer = Buffer.from(content);
    await interaction
      .editReply({
        files: [
          {
            attachment: buffer,
            name: 'reply.txt',
          },
        ],
      })
      .catch((error) => print(error));
  }
};

/**
 * Replies to a message.
 * @param message Discord message.
 * @param content Message to be sent.
 */
export const reply = async (message: Message, content: string) => {
  if (content.length < 2000) {
    await message.reply(content).catch((error) => print(error));
  } else {
    const buffer = Buffer.from(content);
    await message.reply({
      files: [
        {
          attachment: buffer,
          name: 'reply.txt',
        },
      ],
    });
  }
};
