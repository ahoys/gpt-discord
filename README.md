# GPT-Discord

An Open AI powered Discord bot with great flexibility and security.

## Requirements

- OpenAI account and a valid API-key.
- Discord application for the bot (see inviting the bot below).
- Modern Node.js with NPM installed.
- Yarn installed `npm i -g yarn`

# Installation

### How to install for production

- `yarn install --prod`
- Create `.env`, see the configuration below.
- Run with `yarn start`

### How to install for development

- `yarn install`
- Create `.dev.env` and `.jest.env`, see the configuration below.
- Run with `yarn watch`

### Configuration for .env

```
OPENAI_APIKEY=OpenAI application key.
OPENAI_DEFAULTSYSTEM=With a one sentence describe the bot. (optional).
OPENAI_DEFAULTMODEL=See OpenAPI reference manual (#model).
OPENAI_DEFAULTTEMPERATURE=See OpenAPI reference manual (#temperature).
OPENAI_MAXTOKENS=How many tokens can a singular request cost?
OPENAI_IMPROVEDMATH=Makes the model more precise with math (default=false).
OPENAI_EMBEDDINGMODEL=Model to be used with embedding (text-embedding-ada-002).
OPENAI_MAXMEMORYREQUESTSINMINUTE=How often can the short term memory be updated. Set 0 to disable.
DISCORD_APPID=Discord application key.
DISCORD_TOKEN=Discord Bot token.
DISCORD_ROLEID=Discord role with permissions to commands.
DISCORD_MAXCONTENTLENGTH=How long can the user input be.
DISCORD_IGNORECOMMANDS=List of command names that should not be available.
DISCORD_CUSTOMCOMMANDSDIR=Your unofficial custom commands folder.
```

[You can read default values from the config-file.](https://github.com/ahoys/gpt-discord/blob/main/src/config.ts)

[OpenAI reference manual](https://platform.openai.com/docs/api-reference/completions/create)

## Inviting the bot

You need to invite the bot onto your server. When doing this, make sure you have the following scopes/permissions enabled:

- scope: bot
- scope: applications.commands
- permissions: Send Messages
- permissions: Send Messages in Threads
- permissions: Read Messages/View Channels

# FAQ

## Does the bot remember context?

Yes! If you want to continue conversation with the bot, reply to it. Replying will let the bot access the previous question and answer. This is a good way to get clarifications or to continue conversation.

## How safe it is to use the bot?

The bot doesn't read conversations automatically. You need to mention it to get a response. It also won't access your message history if you don't explicitly request it by replying (see above).

All this is to prevent data mining and to also make sure you don't run out of Tokens in a second.

## Is the bot cheap to use by default?

Yes. The payload that is sent to the API is kept at the very minimum. For further optimization, make sure to use the default model (gpt-3.5-turbo) and not to set the OPENAI_SYSTEM environment variable.
