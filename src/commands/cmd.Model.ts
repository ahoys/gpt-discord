import { SlashCommandBuilder } from '@discordjs/builders';
import { ICmdProps } from '..';
import { print } from 'logscribe';
import { getId } from '../utilities/utilities.cmd';
import { ChannelType } from 'discord.js';

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
    const guild = interaction.guild?.id;
    const channel = interaction.options.getChannel('channel');
    const model = interaction.options.getString('model');
    const handleFailure = async (err: Error | null) => {
      print(err);
      await interaction.reply({
        content: `Model for ${channel?.name} failed to updated.`,
        ephemeral: true,
      });
    };
    if (
      typeof guild === 'string' &&
      typeof channel?.id === 'string' &&
      channel.type === ChannelType.GuildText &&
      typeof model === 'string' &&
      model.length
    ) {
      const id = getId(guild, channel.id);
      db.channels.findOne({ channel: id }, async (err, doc) => {
        if (err) {
          await handleFailure(err);
        } else {
          if (doc) {
            db.channels.update(
              { channel: id },
              { ...doc, model },
              {},
              async (updateErr) => {
                if (updateErr) {
                  await handleFailure(err);
                } else {
                  await interaction.reply({
                    content: `Model for ${channel.name} updated to ${model}.`,
                    ephemeral: true,
                  });
                }
              }
            );
          } else {
            db.channels.insert({ channel: id, model }, async (insertErr) => {
              if (insertErr) {
                await handleFailure(err);
              } else {
                await interaction.reply({
                  content: `Model for ${channel.name} saved to ${model}.`,
                  ephemeral: true,
                });
              }
            });
          }
        }
      });
    }
  },
};
