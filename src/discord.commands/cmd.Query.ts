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
    const query = interaction.options.getString('query');
    if (!query) return;
    await openaiQueryHandler(
      openai,
      query,
      async (content) =>
        await interaction.reply(content).catch((err) => print(err)),
      async (err) => {
        print(err);
        await interaction.reply('🤷').catch((err) => print(err));
      }
    );
  },
};
