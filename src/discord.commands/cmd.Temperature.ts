import { SlashCommandBuilder } from '@discordjs/builders';
import { print } from 'logscribe';
import { editReply, getId } from '../utilities/utilities.cmd';
import { ChannelType } from 'discord.js';
import { ICmdProps } from '../types';

const name = 'temperature';

/**
 * Command to adjust temperature for a channel.
 */
module.exports = {
  name,
  data: new SlashCommandBuilder()
    .setName(name)
    .setDescription('Adjust temperature for a channel.')
    .addChannelOption((option) =>
      option
        .setName('channel')
        .setDescription('The channel to change the setting for.')
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName('temperature')
        .setMinValue(0)
        .setMaxValue(100)
        .setDescription('0: Very exact, 100: Very random.')
        .setRequired(true)
    ),
  execute: async ({ db, interaction }: ICmdProps) => {
    await interaction.deferReply({ ephemeral: true });
    const guild = interaction.guild?.id;
    const channel = interaction.options.getChannel('channel');
    const temperaturePercentage = interaction.options.getInteger('temperature');
    if (
      typeof guild === 'string' &&
      typeof channel?.id === 'string' &&
      channel.type === ChannelType.GuildText &&
      typeof temperaturePercentage === 'number' &&
      temperaturePercentage >= 0 &&
      temperaturePercentage <= 100
    ) {
      const id = getId(guild, channel.id);
      const temperature =
        temperaturePercentage <= 0
          ? 0
          : (temperaturePercentage / 100).toFixed(2);
      await db.temperatures
        .setKey(id, Number(temperature))
        .then(
          async () =>
            await editReply(
              interaction,
              `Model for ${channel.name} updated to ${temperature}.`
            )
        )
        .catch(async (e) => {
          print(e);
          await editReply(
            interaction,
            `Model for ${channel.name} failed to updated to ${temperature}.`
          );
        });
    }
  },
};
