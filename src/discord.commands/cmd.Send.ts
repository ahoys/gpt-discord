import { SlashCommandBuilder } from '@discordjs/builders';
import { print } from 'logscribe';
import { getId } from '../utilities/utilities.cmd';
import { ChannelType } from 'discord.js';
import { ICmdProps } from '../types';
import { executeChatCompletion } from '../openai.apis/api.chatCompletion';
import { CreateChatCompletionRequest } from 'openai';
import config from '../config';

const name = 'send';

/**
 * Will change the model used by GPT for the channel.
 */
export default {
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
      db.channels.findOne({ channel: dbId }, async (err, doc) => {
        if (err) {
          interaction.editReply({ content: 'Sending failed.' });
          return;
        }
        const messages: CreateChatCompletionRequest['messages'] = [];
        if (config.openai.system?.trim()) {
          messages.push({
            role: 'system',
            content:
              config.openai.system ??
              `You are in Discord with username ${discord.user?.username}.`,
          });
        }
        messages.push({
          role: 'user',
          content: prompt,
        });
        executeChatCompletion(
          openai,
          {
            model: doc?.model ?? config.openai.defaultModel,
            temperature:
              doc?.temperature !== undefined
                ? Number(doc.temperature)
                : config.openai.defaultTemperature,
            messages,
          },
          async (response) =>
            await channel
              .send(response)
              .catch((err) => print(err))
              .finally(
                async () =>
                  await interaction.editReply({
                    content: 'Message sent.',
                  })
              ),
          async (err) => {
            print(err);
            await interaction
              .editReply({
                content: 'Sending failed.',
              })
              .catch((err) => print(err));
          }
        );
      });
    }
  },
};
