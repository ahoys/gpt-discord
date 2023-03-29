import { SlashCommandBuilder } from '@discordjs/builders';
import { print } from 'logscribe';
import { getId } from '../utilities/utilities.cmd';
import { ChannelType } from 'discord.js';
import { ICmdProps } from '../types';

const name = 'temperature';

/**
 * Command to adjust temperature for a channel.
 */
export default {
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
    const guild = interaction.guild?.id;
    const channel = interaction.options.getChannel('channel');
    const temperaturePercentage = interaction.options.getInteger('temperature');
    const handleFailure = async (err: Error | null) => {
      print(err);
      await interaction.reply({
        content: `Temperature for ${channel?.name} failed to updated.`,
        ephemeral: true,
      });
    };
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
      db.channels.findOne({ channel: id }, async (err, doc) => {
        if (err) {
          await handleFailure(err);
        } else if (doc) {
          db.channels.update(
            { channel: id },
            { ...doc, temperature },
            {},
            async (updateErr) => {
              if (updateErr) {
                await handleFailure(err);
              } else {
                await interaction.reply({
                  content: `Temperature for ${channel.name} updated to ${temperature}.`,
                  ephemeral: true,
                });
              }
            }
          );
        } else {
          db.channels.insert(
            { channel: id, temperature },
            async (insertErr) => {
              if (insertErr) {
                await handleFailure(err);
              } else {
                await interaction.reply({
                  content: `Temperature for ${channel.name} saved to ${temperature}.`,
                  ephemeral: true,
                });
              }
            }
          );
        }
      });
    }
  },
};
