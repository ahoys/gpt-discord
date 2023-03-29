import { SlashCommandBuilder } from '@discordjs/builders';
import { print } from 'logscribe';
import { getId } from '../utilities/utilities.cmd';
import { ChannelType } from 'discord.js';
import { ICmdProps } from '../types';

const name = 'context';

/**
 * Command to enable/disable context for a channel.
 */
export default {
  name,
  data: new SlashCommandBuilder()
    .setName(name)
    .setDescription('Will enable/disable context for a channel.')
    .addChannelOption((option) =>
      option
        .setName('channel')
        .setDescription('The channel to change the setting for.')
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName('length')
        .setMinValue(0)
        .setMaxValue(100)
        .setDescription(
          'How long the context will be in messages for each user.'
        )
        .setRequired(true)
    ),
  execute: async ({ db, interaction }: ICmdProps) => {
    const guild = interaction.guild?.id;
    const channel = interaction.options.getChannel('channel');
    const length = interaction.options.getInteger('length');
    const handleFailure = async (err: Error | null) => {
      print(err);
      await interaction.reply({
        content: `Context for ${channel?.name} failed to updated.`,
        ephemeral: true,
      });
    };
    if (
      typeof guild === 'string' &&
      typeof channel?.id === 'string' &&
      channel.type === ChannelType.GuildText &&
      typeof length === 'number'
    ) {
      const id = getId(guild, channel.id);
      db.channels.findOne({ channel: id }, async (err, doc) => {
        if (err) {
          await handleFailure(err);
        } else if (doc) {
          db.channels.update(
            { channel: id },
            { ...doc, length },
            {},
            async (updateErr) => {
              if (updateErr) {
                await handleFailure(err);
              } else {
                await interaction.reply({
                  content: `Context length for ${channel.name} updated to ${length}.`,
                  ephemeral: true,
                });
              }
            }
          );
        } else {
          db.channels.insert({ channel: id, length }, async (insertErr) => {
            if (insertErr) {
              await handleFailure(err);
            } else {
              await interaction.reply({
                content: `Context length for ${channel.name} saved to ${length}.`,
                ephemeral: true,
              });
            }
          });
        }
      });
    }
  },
};
