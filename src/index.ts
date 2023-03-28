import config from './config';
import DataStore from 'nedb';
import CmdModel from './commands/cmd.Model';
import CmdContext from './commands/cmd.Context';
import CmdTemperature from './commands/cmd.Temperature';
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
import { getId } from './utilities/utilities.cmd';
import {
  getContext,
  updateContextWithResponse,
} from './utilities/utilities.memory';

/**
 * Command properties.
 */
export interface ICmdProps {
  db: {
    channels: DataStore;
  };
  interaction: ChatInputCommandInteraction;
  openai: OpenAIApi;
  paused: boolean;
  handlePause: (v: boolean) => void;
}

/**
 * Define the database.
 */
const db: ICmdProps['db'] = {
  channels: new DataStore({
    filename: 'channels.nedb',
    autoload: true,
    inMemoryOnly: false,
  }),
};

/**
 * If paused, the bot will not respond to GPT-messages.
 */
let paused = false;
const handlePause = (v: boolean) => (paused = v);

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
client.commands.set(CmdModel.name, CmdModel);
client.commands.set(CmdContext.name, CmdContext);
client.commands.set(CmdTemperature.name, CmdTemperature);
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
    const properties: ICmdProps = {
      db,
      interaction,
      openai,
      paused,
      handlePause,
    };
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
      const channel = message?.channel;
      if (!message.guild) return;
      if (!message.mentions.has(client.user)) return;
      if (message.author.bot) return;
      if (paused) return;
      if (!channel) return;
      const content = message.content?.replace(/<@\d+>\s/, '');
      if (typeof content !== 'string') {
        print('Content is not a string.');
        message.react('🛑');
      } else if (content.length <= 2) {
        print('Content is too short.');
        message.react('👎');
      } else if (content.length >= 1024) {
        print('Content is too long.');
        message.react('👎');
      } else {
        const id = getId(message.guild.id, channel.id);
        db.channels.findOne({ channel: id }, (err, doc) => {
          if (err) {
            print(err);
            message.react('🛑');
          } else {
            // Build configuration for the channel.
            const configuration = {
              model: doc?.model ?? config.openai.model,
              context: doc?.length ?? config.openai.defaultContextLength,
              temperature:
                doc?.temperature !== undefined ? Number(doc.temperature) : 0.8,
            };
            // Send request to OpenAI.
            openai
              .createChatCompletion({
                model: configuration.model,
                temperature: configuration.temperature,
                max_tokens: config.openai.maxTokens,
                messages: getContext(
                  id,
                  message.author.id,
                  content,
                  configuration.context
                ),
                n: 1,
                stream: false,
              })
              .then((response) => {
                if (response?.data?.choices) {
                  const firstChoice = response.data.choices[0];
                  if (typeof firstChoice.message?.content === 'string') {
                    message.reply(firstChoice.message.content);
                    updateContextWithResponse(
                      id,
                      message.author.id,
                      firstChoice.message.content
                    );
                  } else {
                    message.react('👎');
                  }
                } else {
                  message.react('👎');
                }
              })
              .catch((error) => {
                message.react('🛑');
                print({
                  message: error?.message,
                  configuration,
                  content,
                });
              });
          }
        });
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
