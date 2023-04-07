import { JSONScribeFile } from 'jsonscribe';
import { ChatInputCommandInteraction } from 'discord.js';
import { Client as DiscordJs, Collection } from 'discord.js';
import { ChatCompletionRequestMessage, OpenAIApi } from 'openai';

export interface IDiscordClient extends DiscordJs {
  commands: Collection<string, any>;
}

/**
 * Memory object.
 *
 * Used to store information about a singular memory.
 */
export interface IMemoryObject {
  id: number; // Unique identifier for the memory object.
  meta: {
    createdTimestamp: number; // Timestamp of when the memory object was created.
    recalledTimestamp: number; // Timestamp of when the memory object was last recalled.
    recalledCount: number; // Number of times the memory object has been recalled.
    vector: number[]; // Vector representation of the memory.
  };
  message: ChatCompletionRequestMessage;
}

export interface IDatabase {
  paused: boolean;
  models: JSONScribeFile<string>;
  temperatures: JSONScribeFile<number>;
  systems: JSONScribeFile<string>;
  shortMemory: IMemoryObject[];
  embeddings: JSONScribeFile<IMemoryObject[]>;
}

export interface ICmdProps {
  discord: IDiscordClient;
  db: IDatabase;
  interaction: ChatInputCommandInteraction;
  openai: OpenAIApi;
  paused: boolean;
  handlePause: (v: boolean) => void;
}
