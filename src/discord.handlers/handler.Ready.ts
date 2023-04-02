import config from '../config';
import { print } from 'logscribe';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import { IDiscordClient } from '../types';

/**
 * Handle the ready event.
 * Register application commands.
 */
export default (client: IDiscordClient) =>
  client.on('ready', () => {
    const rest = new REST({ version: '10' }).setToken(
      config.discord.token ?? ''
    );
    rest
      .put(Routes.applicationCommands(config.discord.appId ?? ''), {
        body: client.commands.map((command) => command.data.toJSON()),
      })
      .then((response) => {
        print('Ready!');
      })
      .catch((error) =>
        print(`Error registering application commands: ${error}`)
      );
  });
