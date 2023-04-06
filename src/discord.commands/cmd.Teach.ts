import { SlashCommandBuilder } from '@discordjs/builders';
import { editReply } from '../utilities/utilities.cmd';
import { ChannelType } from 'discord.js';
import { ICmdProps } from '../types';
import { executeEmbedding } from '../openai.apis/api.createEmbedding';

const name = 'teach';

/**
 * Teaches the bot a new guild specific fact.
 */
module.exports = {
  name,
  data: new SlashCommandBuilder()
    .setName(name)
    .setDescription('Teach the bot a new fact for the active guild.')
    .addStringOption((option) =>
      option
        .setName('fact')
        .setDescription('Be precise and concise.')
        .setRequired(true)
    ),
  execute: async ({ db, openai, interaction }: ICmdProps) => {
    await interaction.deferReply({ ephemeral: true });
    const guild = interaction.guild?.id;
    const channel = interaction.channel;
    const fact = interaction.options.getString('fact')?.trim();
    if (
      typeof guild === 'string' &&
      typeof channel?.id === 'string' &&
      channel.type === ChannelType.GuildText &&
      typeof fact === 'string' &&
      fact.length
    ) {
      const embedding = await executeEmbedding(openai, fact);
      if (Array.isArray(embedding) && embedding.length) {
        const embeddings = db.embeddings.getKey(guild) || [];
        embeddings.push({
          name: interaction.member?.user.username || 'Unknown',
          content: fact,
          vector: embedding,
        });
        db.embeddings.setKey(guild, embeddings);
        await editReply(
          interaction,
          `Learned "${fact}" for ${interaction.guild?.name}.`
        );
      } else {
        await editReply(interaction, 'Was unable to learn the fact.');
      }
    }
  },
};
