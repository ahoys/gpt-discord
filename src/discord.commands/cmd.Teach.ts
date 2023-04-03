import { SlashCommandBuilder } from '@discordjs/builders';
import { print } from 'logscribe';
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
        const embeddings = (await db.embeddings.getKey(guild)) || [];
        embeddings.push({
          fact,
          vector: embedding,
        });
        await db.embeddings
          .setKey(guild, embeddings)
          .then(
            async () =>
              await editReply(
                interaction,
                `Learned "${fact}" for ${interaction.guild?.name}.`
              )
          )
          .catch(async (e) => {
            print(e);
            await editReply(interaction, 'Was unable to learn the fact.');
          });
      } else {
        await editReply(interaction, 'Was unable to learn the fact.');
      }
    }
  },
};
