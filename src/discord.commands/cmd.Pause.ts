import { SlashCommandBuilder } from '@discordjs/builders';
import { ICmdProps } from '../types';

const name = 'pause';

/**
 * Will pause GPT functions.
 */
module.exports = {
  name,
  data: new SlashCommandBuilder()
    .setName(name)
    .setDescription('Will pause GPT functions.'),
  execute: async ({ interaction, paused, handlePause }: ICmdProps) => {
    if (paused) {
      await interaction.reply({
        content: 'GPT is already paused.',
        ephemeral: true,
      });
    } else {
      handlePause(true);
      await interaction.reply({
        content: 'GPT has been paused.',
        ephemeral: true,
      });
    }
  },
};
