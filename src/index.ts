import axios from 'axios';
import config from './config';
import {
  Client as DiscordJs,
  GatewayIntentBits,
  TextChannel,
} from 'discord.js';
import { print } from 'logscribe';

// Create a new Discord client.
const client = new DiscordJs({ intents: [GatewayIntentBits.Guilds] });

client.on('ready', () => {
  print('Discord client ready.');
});

client.login(config.discord.token);
