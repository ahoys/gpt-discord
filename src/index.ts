import path from 'path';
import config from './config';
import CmdModel from './discord.commands/cmd.Model';
import CmdTemperature from './discord.commands/cmd.Temperature';
import CmdSystem from './discord.commands/cmd.System';
import CmdResume from './discord.commands/cmd.Resume';
import CmdPause from './discord.commands/cmd.Pause';
import CmdSend from './discord.commands/cmd.Send';
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

// Enable commands.
discord.commands = new Collection();
for (const Cmd of [
  CmdModel,
  CmdTemperature,
  CmdSystem,
  CmdResume,
  CmdPause,
  CmdSend,
]) {
  discord.commands.set(Cmd.name, Cmd);
}

// Register handlers.
Ready(discord);
InteractionCreate(discord, openai, db);
MessageCreate(discord, openai, db);

// Login to discord. This will then trigger the Ready-handler.
discord.login(config.discord.token);
