import { SlashCommandBuilder } from '@discordjs/builders';
import { print } from 'logscribe';
import { getId } from '../utilities/utilities.cmd';
import { ChannelType } from 'discord.js';
import { ICmdProps } from '../types';

const name = 'system';

/**
 * Will change the system used by GPT for the channel.
 */
export default {
  name,
  data: new SlashCommandBuilder()
    .setName(name)
    .setDescription('Will change the system used by GPT for the channel.')
    .addChannelOption((option) =>
      option
        .setName('channel')
        .setDescription('The channel to change the system for.')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('system')
        .setDescription('The system to use.')
        .setRequired(true)
    ),
  execute: async ({ db, interaction }: ICmdProps) => {
    await interaction.deferReply({ ephemeral: true });
    const guild = interaction.guild?.id;
    const channel = interaction.options.getChannel('channel');
    const system = interaction.options.getString('system');
    if (
      typeof guild === 'string' &&
      typeof channel?.id === 'string' &&
      channel.type === ChannelType.GuildText &&
      typeof system === 'string' &&
      system.length
    ) {
      const id = getId(guild, channel.id);
      await db.systems
        .setKey(id, system)
        .then(
          async () =>
            await interaction.editReply(
              `System for ${channel.name} updated to ${system}.`
            )
        )
        .catch(async (e) => {
          print(e);
          await interaction.editReply(
            `System for ${channel.name} failed to updated to ${system}.`
          );
        });
    }
  },
};
