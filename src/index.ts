import config from './config';
import DataStore from 'nedb';
import CmdModel from './commands/cmd.Model';
import CmdContext from './commands/cmd.Context';
import CmdTemperature from './commands/cmd.Temperature';
import CmdResume from './commands/cmd.Resume';
import CmdPause from './commands/cmd.Pause';
import Ready from './handlers/handler.Ready';
import MessageCreate from './handlers/handler.MessageCreate';
import InteractionCreate from './handlers/handler.InteractionCreate';
import { Client as DiscordJs, GatewayIntentBits, Collection } from 'discord.js';
import { Configuration, OpenAIApi } from 'openai';
import { print } from 'logscribe';
import { IDatabase, IDiscordClient } from './types';

print(config);

// The database, which is basically
// a key-value store.
const db: IDatabase = {
  paused: false,
  channels: new DataStore({
    filename: 'channels.nedb',
    autoload: true,
    inMemoryOnly: false,
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

// Enable commands.
discord.commands = new Collection();
for (const Cmd of [CmdModel, CmdContext, CmdTemperature, CmdResume, CmdPause]) {
  discord.commands.set(Cmd.name, Cmd);
}

// Register handlers.
Ready(discord);
InteractionCreate(discord, openai, db);
MessageCreate(discord, openai, db);

// Login to discord. This will then trigger the Ready-handler.
discord.login(config.discord.token);
