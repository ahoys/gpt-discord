const production = {
  openai: {
    apiKey: process.env.OPENAI_APIKEY,
    model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
    temperature: Number(process.env.OPENAI_TEMPERATURE) || 0.5,
    maxTokens: Number(process.env.OPENAI_MAXTOKENS) || 1000,
    system:
      process.env.OPENAI_SYSTEM || 'You are an assistant on a Discord server.',
    embeddingInput: process.env.OPENAI_EMBEDDINGINPUT || 'input.json',
    embeddingOutput: process.env.OPENAI_EMBEDDINGOUTPUT || 'output.json',
    embeddingMaxTokens: Number(process.env.OPENAI_EMBEDDINGMAXTOKENS) || 2000,
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
