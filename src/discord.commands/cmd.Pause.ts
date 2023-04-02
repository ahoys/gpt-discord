import { SlashCommandBuilder } from '@discordjs/builders';
import { ICmdProps } from '../types';
import { editReply } from '../utilities/utilities.cmd';

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
    await interaction.deferReply({ ephemeral: true });
    if (paused) {
      await editReply(interaction, 'GPT is already paused.');
    } else {
      handlePause(true);
      await editReply(interaction, 'GPT has been paused.');
    }
  },
};
