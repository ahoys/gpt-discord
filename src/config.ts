const production = {
  openai: {
    apiKey: process.env.OPENAI_APIKEY,
    defaultSystem: process.env.OPENAI_DEFAULTSYSTEM,
    defaultModel: process.env.OPENAI_DEFAULTMODEL || 'gpt-3.5-turbo',
    defaultTemperature: Number(process.env.OPENAI_DEFAULTTEMPERATURE) || 0.64,
    maxTokens: Number(process.env.OPENAI_MAXTOKENS) || 2048,
    improvedMath: process.env.OPENAI_IMPROVEDMATH === 'true',
    embeddingModel:
      process.env.OPENAI_EMBEDDINGMODEL || 'text-embedding-ada-002',
    maxMemoryRequestsInMinute:
      Number(process.env.OPENAI_MAXMEMORYREQUESTSINMINUTE) || 30,
  },
  discord: {
    appId: process.env.DISCORD_APPID,
    token: process.env.DISCORD_TOKEN,
    role: process.env.DISCORD_ROLEID,
    maxContentLength: Number(process.env.DISCORD_MAXCONTENTLENGTH) || 2000,
    ignoreCommands: process.env.DISCORD_IGNORECOMMANDS?.split(',') || [],
    customCommandsDir: process.env.DISCORD_CUSTOMCOMMANDSDIR,
  },
};

const development = {
  ...production,
};

export default process.env.NODE_ENV === 'production' ? production : development;
