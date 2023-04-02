import { SlashCommandBuilder } from '@discordjs/builders';
import { ICmdProps } from '../types';
import { editReply } from '../utilities/utilities.cmd';

const name = 'resume';

/**
 * Will resume GPT functions.
 */
module.exports = {
  name,
  data: new SlashCommandBuilder()
    .setName(name)
    .setDescription('Will resume GPT functions.'),
  execute: async ({ interaction, paused, handlePause }: ICmdProps) => {
    await interaction.deferReply({ ephemeral: true });
    if (paused) {
      handlePause(false);
      await editReply(interaction, 'GPT has been resumed.');
    } else {
      await editReply(interaction, 'GPT is not paused.');
    }
  },
};
