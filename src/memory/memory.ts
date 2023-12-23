import config from '../config';
import OpenAI from 'openai';
import { Collection, Metadata, Metadatas } from 'chromadb';
import { ChromaClient, OpenAIEmbeddingFunction } from 'chromadb';
import { print } from 'logscribe';
import { compareStrings } from '../utilities/utilities.strings';
import { TOpenAIMessage } from '../discord.handlers/handler.MessageCreate';

const DISTANCE_THRESHOLD = 0.26;
const MAX_RESULTS = 6;

// Initialize ChromaDB.
if (!config.openai.apiKey) throw new Error('No OpenAI API key provided.');
if (!config.chroma.collection) throw new Error('Missing collection.');
const embedder = new OpenAIEmbeddingFunction({
  openai_api_key: config.openai.apiKey,
  openai_model: config.openai.embeddingModel,
});

/**
 * Returns a collection from ChromaDB.
 * @param chroma The ChromaDB client.
 * @returns {Promise<Collection | undefined>} The collection.
 */
const getCollection = async (
  chroma: ChromaClient,
  id: string
): Promise<Collection | undefined> => {
  try {
    const collections: { name: string }[] = await chroma.listCollections();
    const exists = collections.find((c) => c.name === id);
    if (exists) {
      return await chroma.getCollection({
        name: id,
        embeddingFunction: embedder,
      });
    } else {
      return await chroma.createCollection({
        name: id,
        metadata: {},
        embeddingFunction: embedder,
      });
    }
  } catch (error) {
    print(error);
    return;
  }
};

interface IMeta {
  role: 'system' | 'assistant' | 'user';
  name: string;
  temperature: number;
  created: number;
  guildId: string;
  channelId: string;
  messageId: string;
}

/**
 * Memorize messages.
 */
export const addToMemory = async (
  id: string,
  chroma: ChromaClient,
  ids: string[],
  contents: string[],
  metas: Metadatas
): Promise<void> => {
  try {
    if (!config.chroma.enabled) return;
    const collection = await getCollection(chroma, id);
    if (!collection) return;
    collection.id = id; // Fixes a weird error with ChromaDB.
    if (config.isVerbose) {
      print(
        `Stored to memory. The size of ${id} collection is now ${await collection.count()}`
      );
    }
    const acceptedIds = [];
    const acceptedContents = [];
    const acceptedMetas: Metadatas = [];
    for (let index = 0; index < contents.length; index++) {
      const meta: Metadata = metas[index];
      if (
        ['system', 'assistant', 'user'].includes(String(meta.role)) &&
        typeof meta.name === 'string' &&
        typeof meta.temperature === 'number' &&
        typeof meta.created === 'number' &&
        typeof meta.channelId === 'string' &&
        typeof meta.guildId === 'string' &&
        typeof meta.messageId === 'string'
      ) {
        meta.name = meta.name.replace(/./g, '');
        acceptedIds.push(ids[index]);
        acceptedContents.push(contents[index]);
        acceptedMetas.push(meta);
      }
    }
    if (acceptedIds.length < 1) return;
    await collection.add({
      ids: acceptedIds,
      metadatas: acceptedMetas,
      documents: acceptedContents,
    });
  } catch (error) {
    print(error);
  }
};

interface ISelectedMemory {
  id: string;
  meta: IMeta;
  content: string;
  distance: number;
}

/**
 * Get messages from memory.
 */
export const getFromMemory = async (
  id: string,
  chroma: ChromaClient,
  embeddings: number[],
  contents: string
): Promise<TOpenAIMessage[] | undefined> => {
  try {
    if (!config.chroma.enabled) return;
    const collection = await getCollection(chroma, id);
    if (!collection) return;
    collection.id = id; // Fixes a weird error with ChromaDB.
    const count = await collection.count();
    const memories = await collection.query({
      queryEmbeddings: embeddings,
      nResults: count < MAX_RESULTS ? count : MAX_RESULTS,
    });
    if (
      typeof memories === 'object' &&
      Array.isArray(memories.ids) &&
      Array.isArray(memories.ids[0]) &&
      Array.isArray(memories.documents[0]) &&
      Array.isArray(memories.metadatas[0]) &&
      memories.distances &&
      Array.isArray(memories.distances[0])
    ) {
      // Create memory objects and filter out invalid memories.
      let memoryObjects: ISelectedMemory[] = [];
      for (let index = 0; index < memories.ids[0].length; index++) {
        const metaData = memories?.metadatas[0]
          ? memories?.metadatas[0][index]
          : undefined;
        if (
          typeof memories.ids[0][index] === 'string' &&
          typeof memories.metadatas[0][index] === 'object' &&
          typeof memories.metadatas[0][index]?.created === 'number' &&
          typeof memories.documents[0][index] === 'string' &&
          typeof memories.distances[0][index] === 'number' &&
          metaData &&
          ['assistant', 'user'].includes(String(metaData?.role))
        ) {
          memoryObjects.push({
            id: memories.ids[0][index],
            meta: memories.metadatas[0][index] as unknown as IMeta,
            content: memories.documents[0][index] as string,
            distance: memories.distances[0][index],
          });
        }
      }
      // Sort by distance.
      memoryObjects = memoryObjects.sort((a, b) => a.distance - b.distance);
      // Validate and weight found memories.
      const selectedMemories: ISelectedMemory[] = [];
      for (const memory of memoryObjects) {
        // Filter out similar memories, selecting
        // the closer one. The goal is to have a good variety
        // of relevant memories, instead of the same memory
        // repeating in different flavors.
        let pass = true;
        const contentStr = Array.isArray(contents)
          ? contents.join(' ')
          : contents;
        const memoryToContent = compareStrings(memory.content, contentStr);
        if (memoryToContent >= 90) pass = false;
        for (let r = 0; r < selectedMemories.length && pass; r++) {
          const existingContent = selectedMemories[r].content;
          const v = compareStrings(memory.content, existingContent);
          if (compareStrings(memory.content, contentStr) > 90) {
            pass = false;
          } else if (v > 90) {
            // Pick the closer one.
            const newMemoryDistance = memory.distance;
            const inMemoryDistance = selectedMemories[r].distance;
            if (newMemoryDistance < inMemoryDistance) {
              // The new memory is closer, replace the old one.
              selectedMemories[r] = memory;
            }
            pass = false;
          }
        }
        if (pass && memory.distance < DISTANCE_THRESHOLD) {
          selectedMemories.push(memory);
        }
      }
      // Create messages from selected memories.
      const returnedMemories = selectedMemories.slice(0, 3).map((memory) => ({
        role: memory.meta.role,
        name: memory.meta.name,
        content: memory.content,
      }));
      if (config.isVerbose) {
        print(`Found ${returnedMemories.length} memories.`);
      }
      return returnedMemories;
    }
    return undefined;
  } catch (error) {
    print(error);
    return undefined;
  }
};
