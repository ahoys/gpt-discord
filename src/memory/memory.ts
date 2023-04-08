import config from '../config';
import { Collection } from 'chromadb';
import { ChromaClient, OpenAIEmbeddingFunction } from 'chromadb';
import { print } from 'logscribe';

// Initialize ChromaDB.
if (!config.openai.apiKey) throw new Error('No OpenAI API key provided.');
const chroma = new ChromaClient();
const embedder = new OpenAIEmbeddingFunction(
  config.openai.apiKey,
  config.openai.embeddingModel
);

/**
 * Returns a collection from ChromaDB.
 * @param id The collection ID.
 * @returns {Promise<Collection | undefined>} The collection.
 */
const getCollection = async (id: string): Promise<Collection | undefined> => {
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
  collectionId: string,
  ids: string[],
  contents: string[],
  metas: IMeta[]
): Promise<void> => {
  try {
    const memory = await getCollection(collectionId);
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
    console.log('addToMemory', { acceptedContents });
    await memory.add(acceptedIds, undefined, acceptedMetas, acceptedContents);
  } catch (error) {
    print(error);
  }
};

/**
 * Get messages from memory.
 */
export const getFromMemory = async (
  collectionId: string,
  contents: string | string[]
): Promise<
  | {
      ids: string[];
      documents: string[];
      metas: IMeta[];
    }
  | undefined
> => {
  try {
    const memory = await getCollection(collectionId);
    if (!memory) return undefined;
    const memories = await memory.query(
      undefined,
      undefined,
      undefined,
      contents
    );
    console.log('getFromMemory', { collectionId, memories, contents });
    if (
      memories &&
      !memories.error &&
      Array.isArray(memories.ids) &&
      Array.isArray(memories.documents) &&
      Array.isArray(memories.metadatas)
    ) {
      return {
        ids: memories.ids,
        documents: memories.documents,
        metas: memories.metadatas,
      };
    }
    return undefined;
  } catch (error) {
    print(error);
    return undefined;
  }
};
