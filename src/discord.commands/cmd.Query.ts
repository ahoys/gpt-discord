import { SlashCommandBuilder } from '@discordjs/builders';
import { openaiQueryHandler } from '../openai.handlers/openai.handler.query';
import { ICmdProps } from '../types';
import { print } from 'logscribe';

const name = 'query';

export default {
  name,
  data: new SlashCommandBuilder()
    .setName(name)
    .setDescription('Will query based on training.')
    .addStringOption((option) =>
      option
        .setName('query')
        .setDescription('The query to execute.')
        .setRequired(true)
    ),
  execute: async ({ interaction, openai }: ICmdProps) => {
    interaction.channel?.send('Querying...');
    const query = interaction.options.getString('query');
    if (!query) return;
    await openaiQueryHandler(openai, query)
      .then(() => {
        interaction.reply('Query has been executed.');
      })
      .catch((err) => {
        print(err);
        interaction.reply('Query has failed.');
      });
  },
};
