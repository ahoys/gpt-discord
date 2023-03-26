import { SlashCommandBuilder } from '@discordjs/builders';
import { ICmdProps } from '..';

const name = 'pause';

export default {
  name,
  data: new SlashCommandBuilder()
    .setName(name)
    .setDescription('Will pause GPT functions.'),
  execute: async ({ interaction, paused, handlePause }: ICmdProps) => {
    if (paused) {
      await interaction.reply('Already paused.');
    } else {
      handlePause(true);
      await interaction.reply('GPT paused.');
    }
  },
};
