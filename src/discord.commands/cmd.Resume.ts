import { SlashCommandBuilder } from '@discordjs/builders';
import { ICmdProps } from '../types';

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
      await interaction.reply({
        content: 'GPT has been resumed.',
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: 'GPT is not paused.',
        ephemeral: true,
      });
    }
  },
};
