import { SlashCommandBuilder } from '@discordjs/builders';
import { editReply, getId } from '../utilities/utilities.cmd';
import { ChannelType } from 'discord.js';
import { ICmdProps } from '../types';
import config from '../config';

const name = 'moderation';

/**
 * Will change the moderation setting used for the channel.
 */
module.exports = {
  name,
  data: new SlashCommandBuilder()
    .setName(name)
    .setDescription('Will change the moderation setting used for the channel.')
    .addChannelOption((option) =>
      option
        .setName('channel')
        .setDescription('The channel to change the moderation setting for.')
        .setRequired(true)
    )
    // Multiple options for moderation settings
    .addStringOption((option) =>
      option
        .setName('setting')
        .setDescription('The moderation setting to use.')
        .addChoices(
          { name: 'Threatening, hate and harassment', value: '3' },
          { name: 'Threatening and hate', value: '2' },
          { name: 'Threatening content', value: '1' },
          { name: 'No moderation', value: '0' }
        )
        .setRequired(true)
    ),
  execute: async ({ db, interaction }: ICmdProps) => {
    await interaction.deferReply({ ephemeral: true });
    const guild = interaction.guild?.id;
    const channel = interaction.options.getChannel('channel');
    const setting =
      interaction.options.getString('setting') ||
      config.moderation.defaultModeration;
    if (
      typeof guild === 'string' &&
      typeof channel?.id === 'string' &&
      channel.type === ChannelType.GuildText &&
      typeof setting === 'string'
    ) {
      const id = getId(guild, channel.id);
      db.moderation.setKey(id, setting);
      await editReply(
        interaction,
        `Moderation setting for ${channel.name} updated to ${setting}.`
      );
    }
  },
};
