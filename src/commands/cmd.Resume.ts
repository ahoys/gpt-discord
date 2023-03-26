import { SlashCommandBuilder } from '@discordjs/builders';
import { ICmdProps } from '..';

const name = 'resume';

/**
 * Will resume GPT functions.
 */
export default {
  name,
  data: new SlashCommandBuilder()
    .setName(name)
    .setDescription('Will resume GPT functions.'),
  execute: async ({ interaction, paused, handlePause }: ICmdProps) => {
    if (paused) {
      handlePause(false);
      await interaction.reply('Resumed GPT.');
    } else {
      await interaction.reply('Already resumed.');
    }
  },
};
