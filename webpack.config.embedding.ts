import path from 'path';
import DotEnv from 'dotenv';
import Config, { envPath } from './webpack.config';

DotEnv.config({
  path: envPath,
});

export default {
  ...Config,
  entry: path.resolve(__dirname, './src/embed.ts'),
  output: {
    path: path.resolve(__dirname, './build'),
    filename: 'embed.ts',
  },
};
