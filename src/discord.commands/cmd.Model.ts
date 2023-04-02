import { SlashCommandBuilder } from '@discordjs/builders';
import { print } from 'logscribe';
import { getId } from '../utilities/utilities.cmd';
import { ChannelType } from 'discord.js';
import { ICmdProps } from '../types';

const name = 'model';

/**
 * Will change the model used by GPT for the channel.
 */
export default {
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
        .setRequired(true)
    ),
  execute: async ({ db, interaction }: ICmdProps) => {
    await interaction.deferReply({ ephemeral: true });
    const guild = interaction.guild?.id;
    const channel = interaction.options.getChannel('channel');
    const model = interaction.options.getString('model');
    if (
      typeof guild === 'string' &&
      typeof channel?.id === 'string' &&
      channel.type === ChannelType.GuildText &&
      typeof model === 'string' &&
      model.length
    ) {
      const id = getId(guild, channel.id);
      await db.models
        .setKey(id, model)
        .then(
          async () =>
            await interaction.editReply(
              `Model for ${channel.name} updated to ${model}.`
            )
        )
        .catch(async (e) => {
          print(e);
          await interaction.editReply(
            `Model for ${channel.name} failed to updated to ${model}.`
          );
        });
    }
  },
};
