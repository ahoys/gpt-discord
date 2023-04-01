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
    await openaiTrainingHandler(openai)
      .then(async () => {
        await interaction
          .reply('Training has been executed.')
          .catch((err) => print(err));
      })
      .catch(async (err) => {
        print(err);
        await interaction
          .reply('Training has failed.')
          .catch((err) => print(err));
      });
  },
};
