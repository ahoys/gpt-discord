import config from './config';
import DataStore from 'nedb';
import CmdModel from './commands/cmd.Model';
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

/**
 * Define the database.
 */
const db = {
  models: new DataStore({
    filename: 'models.nedb',
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
 * Command properties.
 */
export interface ICmdProps {
  db: {
    models: DataStore;
  };
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
client.commands.set(CmdModel.name, CmdModel);
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
      if (!message.mentions.has(client.user)) return;
      if (message.author.bot) return;
      if (paused) return;
      if (!channel) return;
      const content = message.content?.replace(/<@\d+>\s/, '');
      if (
        typeof content === 'string' &&
        content.length > 2 &&
        content.length < 1024
      ) {
        db.models.findOne({ channel: channel.id }, (err, modelDoc) => {
          // Look for a pre-defined model for this channel.
          const model = modelDoc?.model ?? config.openai.model;
          // Optimize temperatures in certain models.
          const temperatures: { [key: string]: number } = {
            default: 0.8,
            'code-davinci-002': 0,
          };
          const temperature = temperatures[model]
            ? temperatures[model]
            : temperatures.default;
          if (err) {
            print(err);
            message.react('🛑');
          } else {
            // Send the request to OpenAI.
            openai
              .createChatCompletion({
                model,
                temperature,
                max_tokens: config.openai.maxTokens,
                messages: [
                  {
                    role: 'system',
                    content: config.openai.system,
                  },
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
                print(error?.message);
                message.reply(
                  'Cannot connect to OpenAI API. ' +
                    'Try again later or make sure you have got the right subscription.'
                );
              });
          }
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
