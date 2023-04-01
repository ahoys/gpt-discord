import { SlashCommandBuilder } from '@discordjs/builders';
import { openaiTrainingHandler } from '../openai.handlers/openai.handler.training';
import { ICmdProps } from '../types';
import { print } from 'logscribe';

const name = 'training';

export default {
  name,
  data: new SlashCommandBuilder()
    .setName(name)
    .setDescription('Will execute training.'),
  execute: async ({ interaction, openai }: ICmdProps) => {
    interaction.channel?.send('Training...');
    await openaiTrainingHandler(openai)
      .then(() => {
        interaction.reply('Training has been executed.');
      })
      .catch((err) => {
        print(err);
        interaction.reply('Training has failed.');
      });
  },
};
