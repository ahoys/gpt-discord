import fs from 'fs';
import path from 'path';
import config from '../config';
import { print } from 'logscribe';
import { IDiscordClient } from '../types';

/**
 * Returns a unique ID for a guild-channel combination.
 * @param guild Id of Guild.
 * @param channel Id of Channel.
 * @returns A unique ID for a guild-channel combination.
 */
export const getId = (guild: string, channel: string) => `${guild}-${channel}`;

export const getDynamicCommands = (
  commands: IDiscordClient['commands'],
  dirPath: string
): IDiscordClient['commands'] => {
  const filenames = fs.readdirSync(dirPath);
  for (const filename of filenames) {
    const file = require(path.join(dirPath, filename));
    if (
      !config.discord.ignoreCommands.includes(filename) &&
      'name' in file &&
      'data' in file &&
      'execute' in file &&
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
    }
  }
  return commands;
};
