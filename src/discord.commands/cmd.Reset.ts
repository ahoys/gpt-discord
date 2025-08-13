import { SlashCommandBuilder } from '@discordjs/builders';
import { editReply } from '../utilities/utilities.cmd';
import { ICmdProps } from '../types';

const name = 'reset';

/**
 * Forget everything.
 */
module.exports = {
  name,
  data: new SlashCommandBuilder()
    .setName(name)
    .setDescription(
      'Will reset the bot entirely, making the bot forget everything.'
    ),
  execute: async ({ interaction }: ICmdProps) => {
    await interaction.deferReply({ ephemeral: true });
    await editReply(interaction, 'Done.');
  },
};
