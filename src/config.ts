const production = {
  openai: {
    apiKey: process.env.OPENAI_APIKEY,
  },
  discord: {
    appId: process.env.DISCORD_APPID,
    token: process.env.DISCORD_TOKEN,
  },
};

const development = {
  ...production,
};

export default process.env.NODE_ENV === 'production' ? production : development;
