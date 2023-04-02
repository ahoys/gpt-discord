import config from '../config';
import { SlashCommandBuilder } from '@discordjs/builders';
import { print } from 'logscribe';
import { ChannelType } from 'discord.js';
import { ICmdProps } from '../types';
import { executeChatCompletion } from '../openai.apis/api.chatCompletion';
import { CreateChatCompletionRequest } from 'openai';
import { getSystemMessage } from '../utilities/utilities.picard';

const name = 'send';

export default {
  name,
  data: new SlashCommandBuilder()
    .setName(name)
    .setDescription('Will send a GPT-generated message to a channel.')
    .addChannelOption((option) =>
      option
        .setName('channel')
        .setDescription('The target channel.')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('prompt')
        .setDescription('Prompt for the GPT model.')
        .setRequired(true)
    ),
  execute: async ({ discord, openai, interaction }: ICmdProps) => {
    const guild = interaction.guild?.id;
    const channelPrompt = interaction.options.getChannel('channel');
    const prompt = interaction.options.getString('prompt');
    const channel = discord.channels.cache.get(channelPrompt?.id as string);
    if (
      typeof guild === 'string' &&
      typeof channel?.id === 'string' &&
      channel.type === ChannelType.GuildText &&
      typeof prompt === 'string' &&
      prompt.length
    ) {
      const messages: CreateChatCompletionRequest['messages'] = [];
      messages.push({
        role: 'system',
        content: getSystemMessage(),
      });
      messages.push({
        role: 'user',
        content: prompt,
      });
      await executeChatCompletion(
        openai,
        {
          model: config.openai.defaultModel,
          temperature: 0.95,
          messages,
        },
        async (response) =>
          await channel
            .send(response)
            .catch((err) => print(err))
            .finally(
              async () =>
                await interaction.reply({
                  content: 'Message sent.',
                  ephemeral: true,
                })
            ),
        (err) => {
          print(err);
        }
      );
    }
  },
};
