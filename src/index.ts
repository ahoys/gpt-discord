import path from 'path';
import fs from 'fs';
import config from './config';
import DiscordReady from './discord.handlers/handler.Ready';
import DiscordMessageCreate from './discord.handlers/handler.MessageCreate';
import DiscordInteractionCreate from './discord.handlers/handler.InteractionCreate';
import jsonscribe from 'jsonscribe';
import { Client as DiscordJs, GatewayIntentBits, Collection } from 'discord.js';
import { Configuration, OpenAIApi } from 'openai';
import { print } from 'logscribe';
import { IDatabase, IDiscordClient } from './types';
import { getDynamicCommands } from './utilities/utilities.cmd';

print(config);

(process as any).noDeprecation = true;

// The database, which is basically
// a key-value store.
const db: IDatabase = {
  paused: false,
  systems: jsonscribe<string>({
    path: path.join(__dirname, '..', 'db', 'systems.json'),
  }),
  models: jsonscribe<string>({
    path: path.join(__dirname, '..', 'db', 'models.json'),
  }),
  temperatures: jsonscribe<number>({
    path: path.join(__dirname, '..', 'db', 'temperatures.json'),
  }),
  shortMemory: [],
  embeddings: jsonscribe<
    {
      name: string;
      content: string;
      vector: number[];
    }[]
  >({
    path: path.join(__dirname, '..', 'db', 'embeddings.json'),
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
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
  ],
}) as IDiscordClient;

// Read all official commands from the commands-folder.
discord.commands = getDynamicCommands(
  new Collection(),
  path.join(__dirname, 'discord.commands')
);

if (
  config.discord.customCommandsDir &&
  fs.existsSync(config.discord.customCommandsDir)
) {
  // Read all unofficial commands from the custom commands-folder.
  discord.commands = getDynamicCommands(
    discord.commands,
    path.join(__dirname, '..', config.discord.customCommandsDir)
  );
}

// Register handlers.
DiscordReady(discord);
DiscordInteractionCreate(discord, openai, db);
DiscordMessageCreate(discord, openai, db);

// Login to discord. This will then trigger the Ready-handler.
discord.login(config.discord.token);
