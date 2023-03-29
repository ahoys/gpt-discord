import config from '../config';
import { Events, GuildMemberRoleManager } from 'discord.js';
import { print } from 'logscribe';
import { IDatabase, IDiscordClient } from '../types';
import { OpenAIApi } from 'openai';

/**
 * Handle incoming interactions.
 */
export default (client: IDiscordClient, openai: OpenAIApi, db: IDatabase) =>
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    if (!interaction.guild) return;
    if (!interaction.member) return;
    let roleFound = !config.discord.role;
    if (config.discord.role) {
      for (const roleId of config.discord.role.split(',')) {
        if (
          !roleFound &&
          (interaction.member.roles as GuildMemberRoleManager).cache.has(roleId)
        ) {
          roleFound = true;
        }
      }
    }
    if (!roleFound) {
      interaction.reply('You do not have permission to use this command.');
      return;
    }
    const commandClient = interaction.client as IDiscordClient;
    const command = commandClient.commands.get(interaction.commandName);
    if (!command) {
      print(`No command matching ${interaction.commandName} was found.`);
      return;
    }
    await command.execute({
      db,
      interaction,
      openai,
      paused: db.paused,
      handlePause: (v: boolean) => {
        db.paused = v;
      },
    });
  });
