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
        .setDescription('The model to use.')
        .setRequired(true)
        .addChoices(
          {
            name: 'gpt-4',
            value: 'gpt-4',
          },
          {
            name: 'gpt-4-32k',
            value: 'gpt-4-32k',
          },
          {
            name: 'gpt-3.5-turbo',
            value: 'gpt-3.5-turbo',
          },
          {
            name: 'code-davinci-002',
            value: 'code-davinci-002',
          },
          {
            name: 'code-davinci-001',
            value: 'code-davinci-001',
          }
        )
    ),
  execute: async ({ db, interaction }: ICmdProps) => {
    const guild = interaction.guild?.id;
    const channel = interaction.options.getChannel('channel');
    const model = interaction.options.getString('model');
    const handleFailure = async (err: Error | null) => {
      print(err);
      await interaction.reply(`Model for ${channel?.name} failed to updated.`);
    };
    if (
      typeof guild === 'string' &&
      typeof channel?.id === 'string' &&
      channel.type === ChannelType.GuildText &&
      typeof model === 'string'
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
                  await interaction.reply(`Model for ${channel.name} updated.`);
                }
              }
            );
          } else {
            db.channels.insert({ channel: id, model }, async (insertErr) => {
              if (insertErr) {
                await handleFailure(err);
              } else {
                await interaction.reply(`Model for ${channel.name} updated.`);
              }
            });
          }
        }
      });
    }
  },
};
