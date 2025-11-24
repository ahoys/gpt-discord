# GPT-Discord

An Open AI powered Discord bot with great flexibility and security.

## Requirements

- OpenAI account and a valid API-key.
- Discord application for the bot (see inviting the bot below).
- Modern Node.js with NPM installed.

# Installation

### How to install for production

- `npm ci`
- Create `.env`, see the configuration below.
- Run with `npm run start`

### How to install for development

- `npm install`
- Create `.dev.env` and `.jest.env`, see the configuration below.
- Run with `npm run watch`

### Configuration for .env

```
# OpenAI application key.
OPENAI_APIKEY=

# With a one sentence give the bot identity, if you want.
OPENAI_DEFAULTSYSTEM=

# See OpenAPI reference manual (#model).
OPENAI_DEFAULTMODEL=

# See OpenAPI reference manual (#temperature).
OPENAI_DEFAULTTEMPERATURE=

# How many tokens can a singular request cost?
OPENAI_MAXTOKENS=

# Model to be used with embedding (memory).
OPENAI_EMBEDDINGMODEL=

# How often can the short term memory be updated.
OPENAI_MAXMEMORYREQUESTSINMINUTE=

# Discord application key.
DISCORD_APPID=

# Discord Bot token.
DISCORD_TOKEN=

# Discord role with permissions to bot's interactions.
DISCORD_ROLEID=

# How long can the user input be. Don't go over 2000.
DISCORD_MAXCONTENTLENGTH=

# List of command names that should _not_ be available.
DISCORD_IGNORECOMMANDS=

# Your unofficial custom commands folder, if any.
DISCORD_CUSTOMCOMMANDSDIR=
```

[You can read the default values from the config-file.](https://github.com/ahoys/gpt-discord/blob/main/src/config.ts)

[OpenAI reference manual](https://platform.openai.com/docs/api-reference/completions/create)

## Tuning

The following commands expand the bot over basic capabilities but may also cause unwanted behaviour. Use `.env` to control tuning.

```
# Enables experimental multilevel memory for the bot.
OPENAI_TUNE_APPENDMEMORYTOCONTEXT=true/false

# Improves math capabilities by encouraging steps on a system level.
OPENAI_TUNE_APPENDSTEPSTOIMPROVEMATH=true/false

# The bot will become aware of the Discord username.
OPENAI_TUNE_APPENDUSERNAMETOSYSTEM=true/false

# The prompt defines the temperature. For example questions use lower.
OPENAI_TUNE_USEDYNAMICTEMPERATURE=true/false
```

[You can read the default values from the config-file.](https://github.com/ahoys/gpt-discord/blob/main/src/config.ts)

## Inviting the bot

You need to invite the bot onto your server. When doing this, make sure you have the following scopes/permissions enabled:

- scope: bot
- scope: applications.commands
- permissions: Send Messages
- permissions: Send Messages in Threads
- permissions: Read Messages/View Channels

# FAQ

## Does the bot remember context?

Yes! If you want to continue conversation with the bot, reply to it. Replying will let the bot access the previous question and answer. This is a good way to get clarifications or to continue conversation. The bot also remembers some claims for a short period of time. Think of it as a short term memory.

## How safe it is to use the bot?

The bot doesn't read conversations automatically. You need to mention it to get a response. It also won't access your message history if you don't explicitly request it by replying (see above).

All this is to prevent data mining and to also make sure you don't run out of Tokens in seconds.

However, it is good to understand that the bot has a short term memory. This means that the bot can remember something on channel A that was said on channel B. I'd suggest using the bot only on a one server at time due to this. Create an another instance if you need more bots.

## Is the bot cheap to use by default?

Generally speaking, yes. As cheap as it gets. If you want to further reduce the expenses, disable the memory `OPENAI_TUNE_APPENDMEMORYTOCONTEXT=false` and don't give the bot system-level charasteristics.
