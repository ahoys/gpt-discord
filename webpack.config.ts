import webpack from 'webpack';
import path from 'path';
import DotEnv from 'dotenv';

DotEnv.config({
  path:
    process.env.NODE_ENV === 'development'
      ? path.join(__dirname, '.dev.env')
      : path.join(__dirname, '.env'),
});

export default {
  name: 'production',
  target: 'node',
  entry: path.resolve(__dirname, './src/index.ts'),
  output: {
    path: path.resolve(__dirname, './build'),
    filename: 'gpt.js',
  },
  module: {
    rules: [
      {
        test: /\.(ts|js)$/,
        use: 'ts-loader',
        include: path.resolve(__dirname, './src'),
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js', '.json'],
    modules: ['node_modules'],
  },
  plugins: [
    new webpack.EnvironmentPlugin({
      OPENAI_APIKEY: undefined, // mandatory. If not set, the build will fail.
      OPENAI_MODEL: null,
      OPENAI_TEMPERATURE: null,
      OPENAI_MAXTOKENS: null,
      OPENAI_SYSTEM: null,
      DISCORD_APPID: undefined,
      DISCORD_TOKEN: undefined,
      DISCORD_ROLEID: undefined,
    }),
  ],
  optimization: {
    minimize: false,
  },
};
