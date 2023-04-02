import fs from 'fs';
import path from 'path';
import config from './config';
// import CmdModel from './discord.commands/cmd.Model';
// import CmdTemperature from './discord.commands/cmd.Temperature';
// import CmdSystem from './discord.commands/cmd.System';
// import CmdResume from './discord.commands/cmd.Resume';
// import CmdPause from './discord.commands/cmd.Pause';
// import CmdSend from './discord.commands/cmd.Send';
import Ready from './discord.handlers/handler.Ready';
import MessageCreate from './discord.handlers/handler.MessageCreate';
import InteractionCreate from './discord.handlers/handler.InteractionCreate';
import jsonscribe from 'jsonscribe';
import { Client as DiscordJs, GatewayIntentBits, Collection } from 'discord.js';
import { Configuration, OpenAIApi } from 'openai';
import { print } from 'logscribe';
import { IDatabase, IDiscordClient } from './types';

print(config);

// The database, which is basically
// a key-value store.
const db: IDatabase = {
  paused: false,
  models: jsonscribe<string>({
    path: path.join(__dirname, '..', 'db', 'models.json'),
  }),
  temperatures: jsonscribe<number>({
    path: path.join(__dirname, '..', 'db', 'temperatures.json'),
  }),
  systems: jsonscribe<string>({
    path: path.join(__dirname, '..', 'db', 'systems.json'),
  }),
};

// The OpenAI API client.
// This is used to communicate with the OpenAI API.
const openai = new OpenAIApi(
  new Configuration({
    apiKey: config.openai.apiKey,
  })
);

// The Discord API client.
// This is used to communicate with the Discord API.
const discord = new DiscordJs({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
}) as IDiscordClient;

// Read all commands from the commands-folder.
discord.commands = new Collection();
const filenames = fs.readdirSync(path.join(__dirname, 'discord.commands'));
for (const filename of filenames) {
  const file = require(path.join(__dirname, 'discord.commands', filename));
  if (
    'name' in file &&
    'data' in file &&
    'execute' in file &&
    typeof file.name === 'string' &&
    typeof file.data === 'object' &&
    typeof file.execute === 'function'
  ) {
    print(`Loaded /${file.name}`);
    discord.commands.set(file.name, {
      name: file.name,
      data: file.data,
      execute: file.execute,
    });
  }
}

// Register handlers.
Ready(discord);
InteractionCreate(discord, openai, db);
MessageCreate(discord, openai, db);

// Login to discord. This will then trigger the Ready-handler.
discord.login(config.discord.token);
