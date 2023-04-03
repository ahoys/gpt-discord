import { JSONScribeFile } from 'jsonscribe';
import { ChatInputCommandInteraction } from 'discord.js';
import { Client as DiscordJs, Collection } from 'discord.js';
import { OpenAIApi } from 'openai';

export interface IDiscordClient extends DiscordJs {
  commands: Collection<string, any>;
}

export interface IDatabase {
  paused: boolean;
  models: JSONScribeFile<string>;
  temperatures: JSONScribeFile<number>;
  systems: JSONScribeFile<string>;
  embeddings: JSONScribeFile<
    {
      fact: string;
      vector: number[];
    }[]
  >;
}

export interface ICmdProps {
  discord: IDiscordClient;
  db: IDatabase;
  interaction: ChatInputCommandInteraction;
  openai: OpenAIApi;
  paused: boolean;
  handlePause: (v: boolean) => void;
}
