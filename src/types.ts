import { ChatInputCommandInteraction } from 'discord.js';
import DataStore from 'nedb';
import { Client as DiscordJs, Collection } from 'discord.js';
import { OpenAIApi } from 'openai';

export interface IDiscordClient extends DiscordJs {
  commands: Collection<string, any>;
}

export interface IDatabase {
  paused: boolean;
  channels: DataStore;
}

export interface ICmdProps {
  db: IDatabase;
  interaction: ChatInputCommandInteraction;
  openai: OpenAIApi;
  paused: boolean;
  handlePause: (v: boolean) => void;
}

export interface IModelConfiguration {
  model: string;
  temperature: number;
  context: number;
}