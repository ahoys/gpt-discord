# GPT-Discord

A discord bot that uses Open AI ChatCompletion to have conversations with guild members.

## Requirements

- OpenAI account with access to the API.
- Discord application for the bot.
- Modern Node.js installed.

## Configuration

Create an .env file at the root of the project folder.

[You can read default values from the config-file.](https://github.com/ahoys/gpt-discord/blob/main/src/config.ts)

[OpenAI reference manual](https://platform.openai.com/docs/api-reference/completions/create)

```
OPENAI_APIKEY=OpenAI application key.
OPENAI_MODEL=See OpenAPI reference manual (#model).
OPENAI_TEMPERATURE=See OpenAPI reference manual (#temperature).
OPENAI_MAXTOKENS=How many tokens can a singular request cost?
OPENAI_SYSTEM=With a one sentence describe the bot. (optional).
DISCORD_APPID=Discord application key.
DISCORD_TOKEN=Discord Bot token.
DISCORD_ROLEID=Discord role with permissions to commands.
```

## How to install

- After you have created the .env file, run `yarn install && yarn build`
- A `build` directory will appear that will contain the finished application.
- Run the application with Node.

## Inviting the bot

You need to invite the bot onto your server. When doing this, make sure you have the following permissions enabled: `bot`, `applications.commands`, `send messages` and `add reactions`.
