import { SlashCommandBuilder } from '@discordjs/builders';
import { editReply, getId } from '../utilities/utilities.cmd';
import { ChannelType } from 'discord.js';
import { ICmdProps } from '../types';
import config from '../config';

const name = 'model';

/**
 * Will change the model used by GPT for the channel.
 */
module.exports = {
  name,
  data: new SlashCommandBuilder()
    .setName(name)
    .setDescription('Will change the model used by GPT for the channel.')
    .addChannelOption((option) =>
      option
        .setName('channel')
        .setDescription('The channel to change the model for.')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('model')
        .setDescription(
          'The model to use. See https://platform.openai.com/playground for names.'
        )
    ),
  execute: async ({ db, interaction }: ICmdProps) => {
    await interaction.deferReply({ ephemeral: true });
    const guild = interaction.guild?.id;
    const channel = interaction.options.getChannel('channel');
    const model =
      interaction.options.getString('model') || config.openai.defaultModel;
    if (
      typeof guild === 'string' &&
      typeof channel?.id === 'string' &&
      channel.type === ChannelType.GuildText &&
      typeof model === 'string'
    ) {
      const id = getId(guild, channel.id);
      db.models.setKey(id, model);
      await editReply(
        interaction,
        `Model for ${channel.name} updated to ${model}.`
      );
    }
  },
};
