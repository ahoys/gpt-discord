import config from '../config';
import { SlashCommandBuilder } from '@discordjs/builders';
import { print } from 'logscribe';
import { editReply, getId, sendToChannel } from '../utilities/utilities.cmd';
import { ChannelType } from 'discord.js';
import { ICmdProps } from '../types';
import { executeChatCompletion } from '../openai.apis/api.chatCompletion';
import { CreateChatCompletionRequest } from 'openai';

const name = 'send';

/**
 * Will send a message to a channel.
 */
module.exports = {
  name,
  data: new SlashCommandBuilder()
    .setName(name)
    .setDescription('Will send a message to a channel.')
    .addChannelOption((option) =>
      option
        .setName('channel')
        .setDescription('The target channel.')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('prompt')
        .setDescription('Prompt to be sent.')
        .setRequired(true)
    ),
  execute: async ({ discord, openai, db, interaction }: ICmdProps) => {
    await interaction.deferReply({ ephemeral: true });
    const guild = interaction.guild?.id;
    const channelTarget = interaction.options.getChannel('channel');
    const prompt = interaction.options.getString('prompt');
    const channel = discord.channels.cache.get(channelTarget?.id as string);
    if (
      typeof guild === 'string' &&
      typeof channel?.id === 'string' &&
      channel.type === ChannelType.GuildText &&
      typeof prompt === 'string' &&
      prompt.trim().length
    ) {
      const dbId = getId(guild, channel.id);
      const messages: CreateChatCompletionRequest['messages'] = [];
      const storedSystem =
        db.systems.getKey(dbId) ?? config.openai.defaultSystem ?? '';
      messages.push({
        role: 'system',
        content: (storedSystem + ' Use steps in math.').trim(),
      });
      messages.push({
        role: 'user',
        content: prompt,
      });
      executeChatCompletion(openai, {
        model: db.models.getKey(dbId) ?? config.openai.defaultModel,
        temperature:
          db.temperatures.getKey(dbId) ?? config.openai.defaultTemperature,
        messages,
      })
        .then(async (response) => {
          const content = response.data.choices[0].message?.content;
          if (content) {
            sendToChannel(channel, content).then(() =>
              editReply(interaction, 'Done')
            );
          } else {
            editReply(interaction, 'No response.');
          }
        })
        .catch((err) => {
          print(err);
          editReply(interaction, 'Response failed.');
        });
    }
  },
};
