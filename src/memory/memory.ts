import config from '../config';
import { Collection } from 'chromadb';
import { ChromaClient, OpenAIEmbeddingFunction } from 'chromadb';
import { print } from 'logscribe';
import { ChatCompletionRequestMessage } from 'openai';

const DISTANCE_THRESHOLD = 0.26;

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
): Promise<ChatCompletionRequestMessage[] | undefined> => {
  try {
    const memory = await getCollection(collectionId);
    if (!memory) return undefined;
    const memories = await memory.query(undefined, 2, undefined, contents);
    // console.log('getFromMemory', { collectionId, memories, contents });
    if (
      memories &&
      !memories.error &&
      Array.isArray(memories.ids[0]) &&
      Array.isArray(memories.documents[0]) &&
      Array.isArray(memories.metadatas[0])
    ) {
      const messages: ChatCompletionRequestMessage[] = [];
      for (let index = 0; index < memories.ids[0].length; index++) {
        const role = memories.metadatas[0][index].role;
        const name = memories.metadatas[0][index].name;
        const content = memories.documents[0][index];
        const distance = memories.distances[0][index];
        console.log({ content, distance });
        const exists = messages.find(
          (m) => m.content.toLowerCase().trim() === content.toLowerCase().trim()
        );
        if (!exists && distance <= DISTANCE_THRESHOLD) {
          messages.push({
            role,
            name,
            content,
          });
        }
      }
      return messages;
    }
    return undefined;
  } catch (error) {
    print(error);
    return undefined;
  }
};
