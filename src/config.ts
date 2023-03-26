const production = {
  openai: {
    apiKey: process.env.OPENAI_APIKEY,
    model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
    temperature: Number(process.env.OPENAI_TEMPERATURE) || 0.5,
    maxTokens: Number(process.env.OPENAI_MAXTOKENS) || 1000,
    system:
      process.env.OPENAI_SYSTEM || 'You are an assistant on a Discord server.',
  },
  discord: {
    appId: process.env.DISCORD_APPID,
    token: process.env.DISCORD_TOKEN,
    role: process.env.DISCORD_ROLEID,
  },
};

const development = {
  ...production,
};

export default process.env.NODE_ENV === 'production' ? production : development;
