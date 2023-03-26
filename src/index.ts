import config from './config';
import CmdResume from './commands/cmd.Resume';
import CmdPause from './commands/cmd.Pause';
import {
  Client as DiscordJs,
  GatewayIntentBits,
  Collection,
  Events,
  ChatInputCommandInteraction,
  GuildMemberRoleManager,
} from 'discord.js';
import { print } from 'logscribe';
import { Configuration, OpenAIApi } from 'openai';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';

let paused = false;

/**
 * Handle pause state.
 */
const handlePause = (v: boolean) => (paused = v);

/**
 * Command properties.
 */
export interface ICmdProps {
  interaction: ChatInputCommandInteraction;
  openai: OpenAIApi;
  paused: boolean;
  handlePause: (v: boolean) => void;
}

/**
 * Create a new OpenAI client.
 */
const openai = new OpenAIApi(
  new Configuration({
    apiKey: config.openai.apiKey,
  })
);

/**
 * Create a new Discord client.
 */
interface IDiscordClient extends DiscordJs {
  commands: Collection<string, any>;
}

const client = new DiscordJs({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
}) as IDiscordClient;

client.commands = new Collection();
client.commands.set(CmdResume.name, CmdResume);
client.commands.set(CmdPause.name, CmdPause);

/**
 * Triggered when the Discord client is ready.
 * Register application commands.
 */
client.on('ready', () => {
  const rest = new REST({ version: '10' }).setToken(config.discord.token ?? '');
  rest
    .put(Routes.applicationCommands(config.discord.appId ?? ''), {
      body: client.commands.map((command) => command.data.toJSON()),
    })
    .then((response) => {
      print(response);
      print('Discord client ready.');
    })
    .catch((error) =>
      print(`Error registering application commands: ${error}`)
    );
});

/**
 * Handle incoming slash commands.
 */
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (!interaction.guild) return;
  if (!interaction.member) return;
  if (
    !(interaction.member.roles as GuildMemberRoleManager).cache.has(
      config.discord.role ?? ''
    )
  ) {
    return;
  }
  const commandClient = interaction.client as IDiscordClient;
  const command = commandClient.commands.get(interaction.commandName);
  if (!command) {
    print(`No command matching ${interaction.commandName} was found.`);
    return;
  }
  try {
    const properties: ICmdProps = { interaction, openai, paused, handlePause };
    await command.execute(properties);
  } catch (error) {
    print(`Error executing command ${interaction.commandName}: ${error}`);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: 'There was an error while executing this command!',
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: 'There was an error while executing this command!',
        ephemeral: true,
      });
    }
  }
});

/**
 * Handle incoming messages.
 * If the message mentions the bot, reply with a chat completion.
 */
client.on(Events.MessageCreate, async (message) => {
  try {
    if (client?.user) {
      if (!message.mentions.has(client.user)) return;
      if (message.author.bot) return;
      if (paused) return;
      const content = message.content?.replace(/<@\d+>\s/, '');
      if (
        typeof content === 'string' &&
        content.length > 2 &&
        content.length < 1024
      ) {
        openai
          .createChatCompletion({
            model: config.openai.model,
            temperature: config.openai.temperature,
            max_tokens: config.openai.maxTokens,
            messages: [
              {
                role: 'user',
                content,
              },
            ],
            n: 1,
            stream: false,
          })
          .then((response) => {
            if (response.data.choices) {
              const firstChoice = response.data.choices[0];
              if (typeof firstChoice.message?.content === 'string') {
                return message.reply(firstChoice.message.content);
              } else {
                message.react('👎');
              }
            } else {
              message.react('👎');
            }
          })
          .catch((error) => {
            print(error);
            message.react('👎');
          });
      } else {
        message.react('👎');
      }
    }
  } catch (error) {
    print(error);
  }
});

/**
 * Login to Discord.
 */
client.login(config.discord.token);
