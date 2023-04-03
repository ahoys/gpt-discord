import config from '../config';
import { SlashCommandBuilder } from '@discordjs/builders';
import { print } from 'logscribe';
import { editReply, getId } from '../utilities/utilities.cmd';
import { ChannelType } from 'discord.js';
import { ICmdProps } from '../types';
import { executeChatCompletion } from '../openai.apis/api.chatCompletion';
import { CreateChatCompletionRequest } from 'openai';
import { getContext } from '../utilities/utilities.getContext';

const name = 'query';

/**
 * Queries the bot for a guild specific fact.
 */
module.exports = {
  name,
  data: new SlashCommandBuilder()
    .setName(name)
    .setDescription('Makes a query for a fact for the active guild.')
    .addStringOption((option) =>
      option
        .setName('query')
        .setDescription('Be precise and concise.')
        .setRequired(true)
    ),
  execute: async ({ db, openai, interaction }: ICmdProps) => {
    await interaction.deferReply({ ephemeral: false });
    const guild = interaction.guild?.id;
    const channel = interaction.channel;
    const query = interaction.options.getString('query')?.trim();
    if (
      typeof guild === 'string' &&
      typeof channel?.id === 'string' &&
      channel.type === ChannelType.GuildText &&
      typeof query === 'string' &&
      query.length
    ) {
      const id = getId(guild, channel.id);
      const embeddings = (await db.embeddings.getKey(guild)) || [];
      const context = await getContext(openai, embeddings, query);
      const messages: CreateChatCompletionRequest['messages'] = [
        {
          role: 'system',
          content: context,
        },
      ];
      messages.push({
        role: 'user',
        content: 'Question: ' + query,
      });
      executeChatCompletion(openai, {
        model: (await db.models.getKey(id)) ?? config.openai.defaultModel,
        temperature: 0.1,
        messages,
      })
        .then(async (response) => {
          const content = response.data.choices[0].message?.content;
          if (content) {
            await editReply(interaction, content);
          } else {
            print('No response.');
          }
        })
        .catch(async (error) => {
          print(error);
          await editReply(interaction, 'I do not know the answer.');
        });
    }
  },
};
