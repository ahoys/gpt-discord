import path from 'path';
import fs from 'fs';
import config from './config';
import OpenAI from 'openai';
import DiscordReady from './discord.handlers/handler.Ready';
import DiscordMessageCreate from './discord.handlers/handler.MessageCreate';
import DiscordInteractionCreate from './discord.handlers/handler.InteractionCreate';
import jsonscribe from 'jsonscribe';
import { Client as DiscordJs, GatewayIntentBits, Collection } from 'discord.js';
import { print } from 'logscribe';
import { IDatabase, IDiscordClient, IMemoryObject } from './types';
import { getDynamicCommands } from './utilities/utilities.cmd';
import { ChromaClient } from 'chromadb';

print(config);

if (!config.discord.appId) throw new Error('No Discord app ID provided.');
if (!config.discord.token) throw new Error('No Discord token provided.');
if (!config.openai.apiKey) throw new Error('No OpenAI API key provided.');

(process as any).noDeprecation = true;

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

// The OpenAI API client.
// This is used to communicate with the OpenAI API.
const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

// Create ChromaDB client.
const chroma = new ChromaClient({
  path: config.chroma.address,
});

// To check if the connection to the database is working.
const listCollections = async () => {
  try {
    const collections = await chroma.listCollections();
    print(collections);
  } catch (error) {
    print(error);
  }
};

listCollections();

const bootstrap = async () => {
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
    embeddings: jsonscribe<IMemoryObject[]>({
      path: path.join(__dirname, '..', 'db', 'embeddings.json'),
    }),
  };

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
  DiscordInteractionCreate(discord, openai, db, chroma);
  DiscordMessageCreate(discord, openai, db, chroma);

  // Login to discord. This will then trigger the Ready-handler.
  discord.login(config.discord.token);
};

bootstrap();
