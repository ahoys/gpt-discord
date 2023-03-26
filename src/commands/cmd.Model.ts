import { SlashCommandBuilder } from '@discordjs/builders';
import { ICmdProps } from '..';
import { print } from 'logscribe';

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
            name: 'gpt-3.5-turbo',
            value: 'gpt-3.5-turbo',
          },
          {
            name: 'code-davinci-002',
            value: 'code-davinci-002',
          }
        )
    ),
  execute: async ({ db, interaction }: ICmdProps) => {
    const channel = interaction.options.getChannel('channel');
    const model = interaction.options.getString('model');
    const handleFailure = async (err: Error | null) => {
      print(err);
      await interaction.reply(`Model for ${channel?.id} failed to updated.`);
    };
    if (channel?.id && model) {
      db.models.findOne({ channel: channel.id }, async (err, doc) => {
        if (err) {
          await handleFailure(err);
        } else {
          if (doc) {
            db.models.update(
              { channel: channel.id },
              { model },
              {},
              async (updateErr) => {
                if (updateErr) {
                  await handleFailure(err);
                } else {
                  await interaction.reply(`Model for ${channel.id} updated.`);
                }
              }
            );
          } else {
            db.models.insert(
              { channel: channel.id, model },
              async (insertErr) => {
                if (insertErr) {
                  await handleFailure(err);
                } else {
                  await interaction.reply(`Model for ${channel.id} updated.`);
                }
              }
            );
          }
        }
      });
    }
  },
};
