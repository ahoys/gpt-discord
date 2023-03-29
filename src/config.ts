const production = {
  openai: {
    apiKey: process.env.OPENAI_APIKEY,
    defaultModel: process.env.OPENAI_DEFAULTMODEL || 'gpt-3.5-turbo',
    defaultTemperature: Number(process.env.OPENAI_DEFAULTTEMPERATURE) || 0.64,
    maxTokens: Number(process.env.OPENAI_MAXTOKENS) || 512,
    maxContentLength: Number(process.env.OPENAI_MAXCONTENTLENGTH) || 2048,
    system:
      process.env.OPENAI_SYSTEM || 'You are an assistant on a Discord server.',
    defaultContext: Number(process.env.OPENAI_DEFAULTCONTEXT) || 1,
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
