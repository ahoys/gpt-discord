import config from '../config';
import { Collection } from 'chromadb';
import { ChromaClient, OpenAIEmbeddingFunction } from 'chromadb';
import { print } from 'logscribe';
import { ChatCompletionRequestMessage } from 'openai';
import { compareStrings } from '../utilities/utilities.strings';

const DISTANCE_THRESHOLD = 0.26;

// Initialize ChromaDB.
if (!config.openai.apiKey) throw new Error('No OpenAI API key provided.');
const embedder = new OpenAIEmbeddingFunction(
  config.openai.apiKey,
  config.openai.embeddingModel
);

/**
 * Returns a collection from ChromaDB.
 * @param chroma The ChromaDB client.
 * @param id The collection ID.
 * @returns {Promise<Collection | undefined>} The collection.
 */
const getCollection = async (
  chroma: ChromaClient,
  id: string
): Promise<Collection | undefined> => {
  try {
    let memory = await chroma.getCollection(id, embedder);
    if (memory) return memory;
    return await chroma.createCollection(id, {}, embedder);
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
  channelId: string;
  messageId: string;
}

/**
 * Memorize messages.
 */
export const addToMemory = async (
  chroma: ChromaClient,
  collectionId: string,
  ids: string[],
  contents: string[],
  metas: IMeta[]
): Promise<void> => {
  try {
    const memory = await getCollection(chroma, collectionId);
    if (!memory) return;
    const acceptedIds = [];
    const acceptedContents = [];
    const acceptedMetas = [];
    for (let index = 0; index < contents.length; index++) {
      const meta = metas[index];
      if (
        ['system', 'assistant', 'user'].includes(meta.role) &&
        typeof meta.name === 'string' &&
        typeof meta.temperature === 'number' &&
        typeof meta.created === 'number' &&
        typeof meta.channelId === 'string' &&
        typeof meta.messageId === 'string'
      ) {
        acceptedIds.push(ids[index]);
        acceptedContents.push(contents[index]);
        acceptedMetas.push(meta);
      }
    }
    if (acceptedIds.length < 1) return;
    await memory.add(acceptedIds, undefined, acceptedMetas, acceptedContents);
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
  chroma: ChromaClient,
  collectionId: string,
  contents: string | string[]
): Promise<ChatCompletionRequestMessage[] | undefined> => {
  try {
    const memory = await getCollection(chroma, collectionId);
    if (!memory) return undefined;
    let memories = await memory.query(undefined, 8, undefined, contents);
    if (
      memories &&
      !memories.error &&
      Array.isArray(memories.ids[0]) &&
      Array.isArray(memories.documents[0]) &&
      Array.isArray(memories.metadatas[0])
    ) {
      // Create memory objects and filter out invalid memories.
      let memoryObjects: ISelectedMemory[] = [];
      for (let index = 0; index < memories.ids[0].length; index++) {
        if (
          typeof memories.ids[0][index] === 'string' &&
          typeof memories.metadatas[0][index] === 'object' &&
          typeof memories.metadatas[0][index].created === 'number' &&
          typeof memories.documents[0][index] === 'string' &&
          typeof memories.distances[0][index] === 'number' &&
          ['assistant', 'user'].includes(memories.metadatas[0][index].role)
        ) {
          memoryObjects.push({
            id: memories.ids[0][index],
            meta: memories.metadatas[0][index],
            content: memories.documents[0][index],
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
        for (let r = 0; r < selectedMemories.length; r++) {
          const existingContent = selectedMemories[r].content;
          const v = compareStrings(memory.content, existingContent);
          if (v > 90) {
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
      return selectedMemories.slice(0, 3).map((memory) => ({
        role: memory.meta.role,
        name: memory.meta.name,
        content: memory.content,
      }));
    } else if (memories?.error) {
      print(memories.error);
    }
    return undefined;
  } catch (error) {
    print(error);
    return undefined;
  }
};
